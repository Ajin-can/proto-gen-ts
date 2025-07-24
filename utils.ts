import path from "path";
import { promises as fs } from "graceful-fs";
import { execSync } from "child_process";
// import chalk from "chalk";

/**
 * 修复 proto 文件的语法问题
 * @param dir 包含 proto 文件的目录
 */
async function fixProtoSyntax(dir: string) {
  const protoFiles = await fs.readdir(dir);

  for (const file of protoFiles) {
    if (file.endsWith(".proto")) {
      const filePath = path.join(dir, file);
      let content = await fs.readFile(filePath, "utf8");

      // 检查是否已经有 syntax 声明
      if (!content.includes("syntax =")) {
        // 如果没有 syntax 声明，添加 proto3
        content = 'syntax = "proto3";\n\n' + content;
        console.log(`为 ${file} 添加 proto3 语法声明`);
      } else if (content.includes('syntax = "proto2"')) {
        // 如果是 proto2，转换为 proto3
        content = content.replace('syntax = "proto2"', 'syntax = "proto3"');
        console.log(`将 ${file} 从 proto2 转换为 proto3`);
      }

      await fs.writeFile(filePath, content);
    }
  }
}

/**
 * 组织生成的文件，按 proto 文件名创建子目录
 * @param generatedDir 生成文件的目录
 * @param outputDir 输出目录
 * @param protoFileNames proto 文件名列表（不含扩展名）
 */
async function organizeGeneratedFiles(
  generatedDir: string,
  outputDir: string,
  protoFileNames: string[]
) {
  // 获取所有生成的文件
  const generatedFiles = await fs.readdir(generatedDir);

  for (const protoName of protoFileNames) {
    // 为每个 proto 文件创建对应的子目录
    const subDir = path.join(outputDir, protoName);
    execSync(`mkdir -p "${subDir}"`);

    // 查找与当前 proto 文件相关的生成文件
    const relatedFiles = generatedFiles.filter((file: string) => {
      // 匹配文件名包含 proto 名称的文件
      return (
        file.includes(protoName) ||
        file.includes(protoName.toLowerCase())
      );
    });

    if (relatedFiles.length === 0) {
      // 如果没有找到相关文件，尝试更宽松的匹配
      const allFiles = generatedFiles.filter((file: string) => {
        return (
          file.endsWith(".ts") ||
          file.endsWith(".js") ||
          file.endsWith(".d.ts")
        );
      });

      // 如果只有一个 proto 文件，将所有生成的文件都放到对应目录
      if (protoFileNames.length === 1 && allFiles.length > 0) {
        for (const file of allFiles) {
          const srcPath = path.join(generatedDir, file);
          const destPath = path.join(subDir, file);

          try {
            await fs.access(srcPath);
            execSync(`cp "${srcPath}" "${destPath}"`);
            console.log(`  ${protoName}/${file}`);
          } catch (e) {
            // 文件可能不存在，跳过
          }
        }
      }
    } else {
      // 复制相关文件到对应的子目录
      for (const file of relatedFiles) {
        const srcPath = path.join(generatedDir, file);
        const destPath = path.join(subDir, file);

        try {
          await fs.access(srcPath);
          execSync(`cp "${srcPath}" "${destPath}"`);
          console.log(`  ${protoName}/${file}`);
        } catch (e) {
          // 文件可能不存在，跳过
        }
      }
    }
  }

  // 如果没有成功分组任何文件，回退到原来的方式
  const hasAnyFiles = await Promise.all(
    protoFileNames.map(async (protoName) => {
      const subDir = path.join(outputDir, protoName);
      try {
        const files = await fs.readdir(subDir);
        return files.length > 0;
      } catch (e) {
        return false;
      }
    })
  );

  if (!hasAnyFiles.some(Boolean)) {
    console.log("未能按 proto 文件分组，使用默认方式复制所有文件...");
    execSync(`cp -rf "${generatedDir}"/* "${outputDir}"/`);
  }
}

/**
 * 从本地 proto 文件生成 TypeScript 类型
 * @param protoDir proto 文件目录
 * @param outputDir 输出目录
 */
export const genProtoFromLocal = async (
  protoDir: string,
  outputDir: string
) => {
  // 保存原始工作目录
  const originalCwd = process.cwd();

  // 检查 proto 目录是否存在
  try {
    await fs.access(protoDir);
    const stat = await fs.stat(protoDir);
    if (!stat.isDirectory()) {
      throw new Error(`${protoDir} 不是一个目录`);
    }
  } catch (e) {
    throw new Error(`Proto 目录不存在: ${protoDir}`);
  }

  // 创建临时工作目录
  const tempDir = path.resolve(originalCwd, ".proto-temp");

  try {
    // 清理并创建临时目录
    execSync(`rm -rf "${tempDir}"`);
    execSync(`mkdir -p "${tempDir}"`);

    // 复制 buf 配置文件到临时目录
    const bufGenFile = path.resolve(__dirname, "../bufbuild/buf.gen.yaml");
    const packageJsonFile = path.resolve(__dirname, "../bufbuild/package.json");

    execSync(`cp "${packageJsonFile}" "${tempDir}"/`);
    execSync(`cp "${bufGenFile}" "${tempDir}"/`);

    // 复制 proto 文件到临时目录
    execSync(`cp -r "${protoDir}"/* "${tempDir}"/`);

    // 切换到临时目录
    process.chdir(tempDir);

    // 安装依赖
    console.log("安装 buf 依赖...");
    execSync("npm install", { stdio: "inherit" });

    // 创建 buf.yaml 配置文件
    const bufYamlContent = `version: v1
name: buf.build/local/proto
lint:
  use:
    - DEFAULT
  except:
    - FIELD_NO_REQUIRED
    - FIELD_NO_OPTIONAL
`;
    await fs.writeFile("buf.yaml", bufYamlContent, "utf8");

    // 检查并修复 proto 文件的语法问题
    await fixProtoSyntax(tempDir);

    // 生成 TypeScript 类型
    console.log("生成 TypeScript 类型...");
    const genCommand = "npx buf generate --template=./buf.gen.yaml";
    console.log(`\x1b[32m${genCommand}\x1b[0m`);

    try {
      execSync(genCommand, { stdio: "pipe" });
    } catch (error: any) {
      console.error("buf generate 命令失败:");
      console.error("stdout:", error.stdout?.toString());
      console.error("stderr:", error.stderr?.toString());

      // 尝试更详细的诊断
      console.log("\n诊断信息:");
      try {
        execSync("ls -la", { stdio: "inherit" });
        console.log("\nbuf.gen.yaml 内容:");
        execSync("cat buf.gen.yaml", { stdio: "inherit" });
        console.log("\nbuf.yaml 内容:");
        execSync("cat buf.yaml", { stdio: "inherit" });
        console.log("\nproto 文件:");
        execSync("find . -name '*.proto'", { stdio: "inherit" });
      } catch (e) {
        console.error("诊断信息获取失败:", e);
      }

      throw error;
    }

    // 切换回原目录
    process.chdir(originalCwd);

    // 获取原始 proto 文件列表，用于创建对应的子目录
    const protoFiles = await fs.readdir(protoDir);
    const protoFileNames = protoFiles
      .filter((file) => file.endsWith(".proto"))
      .map((file) => path.basename(file, ".proto"));

    // 复制生成的文件到输出目录，按 proto 文件名分组
    const generatedDir = path.join(tempDir, "cli-gen-ts-file");
    try {
      await fs.access(generatedDir);

      // 确保输出目录存在
      execSync(`mkdir -p "${outputDir}"`);

      // 为每个 proto 文件创建对应的子目录并复制文件
      await organizeGeneratedFiles(generatedDir, outputDir, protoFileNames);

      console.log(`文件已生成到: ${outputDir}`);
    } catch (e) {
      throw new Error("生成的文件目录不存在，可能生成失败");
    }
  } catch (error) {
    // 确保在出错时也切换回原目录
    try {
      process.chdir(originalCwd);
    } catch (e) {
      // 忽略切换目录失败的错误
    }
    throw error;
  } finally {
    // 清理临时目录
    try {
      execSync(`rm -rf "${tempDir}"`);
    } catch (e) {
      console.warn("清理临时目录失败:", e);
    }
  }
};

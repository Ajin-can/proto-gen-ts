import { program } from "commander";
import * as packageJSON from "./package.json";
import { genProtoFromLocal } from "./utils";
import path from "path";

const gen = async (sourcePath: string, outputPath: string) => {
  console.clear();
  console.log("正在生成 protobuf ts 类型...\n");

  const currentDir = process.cwd();
  const protoDir = path.resolve(currentDir, sourcePath);
  const outputDir = path.resolve(currentDir, outputPath);

  console.log(`Proto 源目录: ${protoDir}`);
  console.log(`输出目录: ${outputDir}\n`);

  try {
    await genProtoFromLocal(protoDir, outputDir);
    console.log("生成成功");
  } catch (e) {
    console.error(`生成protobuf ts 类型错误:`);
    console.error(e);
    (process as any).exit(1);
  }
};

program
  .name("proto")
  .description("CLI for protobuf generation")
  .version(packageJSON.version);

program
  .command("gen")
  .description("生成protobuf ts类型")
  .option("-s, --source <path>", "proto文件源目录", "proto")
  .option("-o, --output <path>", "生成文件输出目录", "types")
  .action(async (options) => {
    const { source, output } = options;
    await gen(source, output);
  });

program.parse();

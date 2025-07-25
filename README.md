# proto-gen-ts

[![npm version](https://img.shields.io/npm/v/proto-gen-ts.svg)](https://www.npmjs.com/package/proto-gen-ts)
[![CI](https://github.com/Ajin-can/proto-gen-ts/workflows/CI/badge.svg)](https://github.com/Ajin-can/proto-gen-ts/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

一个用于从 Protocol Buffer 文件生成 TypeScript 类型的 CLI 工具。

## 安装

```bash
npm install proto-gen-ts
```

或者使用 npx（推荐）：

```bash
npx proto gen
```

## 使用方法

### 1. 在你的项目中添加 npm script

在你的 `package.json` 文件的 `scripts` 部分添加：

```json
{
  "scripts": {
    "proto:gen": "proto gen"
  }
}
```

### 2. 准备 proto 文件

在你的项目根目录创建 `proto` 文件夹，并将你的 `.proto` 文件放入其中：

```
your-project/
├── proto/
│   ├── user.proto
│   └── message.proto
├── package.json
└── ...
```

### 3. 生成 TypeScript 类型

运行以下命令：

```bash
npm run proto:gen
```

或者直接使用：

```bash
npx proto gen
```

生成的 TypeScript 类型文件将会保存在 `types` 文件夹中。

## 命令选项

```bash
npx proto gen [options]
```

### 选项

- `-s, --source <path>`: 指定 proto 文件源目录（默认: `proto`）
- `-o, --output <path>`: 指定生成文件输出目录（默认: `types`）

### 示例

```bash
# 使用默认目录（proto -> types）
npx proto gen

# 指定自定义源目录和输出目录
npx proto gen -s ./protobuf -o ./generated-types
```

## 项目结构示例

```
your-project/
├── proto/                    # Proto 文件目录
│   ├── user.proto
│   └── message.proto
├── types/                    # 生成的 TypeScript 类型
│   ├── user/
│   │   └── user_pb.ts
│   └── message/
│       └── message_pb.ts
├── package.json
└── src/
    └── index.ts
```

## 要求

- Node.js >= 16.0.0
- 项目中需要有 `proto` 文件夹（或通过 `-s` 选项指定的目录）

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发

```bash
# 克隆项目
git clone https://github.com/Ajin-can/proto-gen-ts.git
cd proto-gen-ts

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 测试CLI
node index.js --help
```

## 许可证

ISC - 详见 [LICENSE](LICENSE) 文件

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-07-24

### Added

- Initial release of proto-gen-ts
- CLI tool for generating TypeScript types from Protocol Buffer files
- Support for proto3 syntax
- Automatic proto file syntax fixing
- Organized output structure by proto file names
- Command line options for custom source and output directories

### Features

- `proto gen` command to generate TypeScript types
- `-s, --source` option to specify proto files directory (default: proto)
- `-o, --output` option to specify output directory (default: types)
- Automatic installation of buf dependencies
- Support for multiple proto files
- Clean temporary file handling

# frontend-builder

> builds frontend
> Author: Pedro M. Dominguez

## Installation

```bash
# Clone or download frontend-builder.ts
chmod +x frontend-builder.ts

# Optional: Create symlink for easy access
ln -s $(pwd)/frontend-builder.ts /usr/local/bin/frontend-builder
```

## Usage

```bash
# Show help
./frontend-builder.ts --help

# Show version
./frontend-builder.ts --version
```

## Commands

### basic

basic frontend scaffolding

**Usage:**
```bash
basic [options]
```

**Examples:**
```bash
1
```

**Required Permissions:**
- `--allow-read` - Read files and directories
- `--allow-write` - Write files and directories
- `--allow-net` - Make network requests
- `--allow-run` - Run subprocesses
- `--allow-env` - Access environment variables


## Global Options

- `--help, -h` - Show help information
- `--version, -v` - Show version information
- `--verbose` - Enable verbose output
- `--dry-run` - Show what would be done without executing

## Features

✅ Color-coded terminal output
✅ Interactive prompts with validation
✅ Built-in validation helpers
✅ Unix Philosophy compliant
✅ Security-first design with explicit permissions
✅ Zero-configuration defaults

## Development

This CLI tool follows the Unix Philosophy:
- **Do one thing well**: builds frontend
- **Composable**: Can be scripted and automated
- **Text-based I/O**: Clear input and output
- **Explicit security**: All permissions documented

## License

Copyright © 2025 Pedro M. Dominguez

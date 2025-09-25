# Inscribe

An Electron application with React and TypeScript for editing image metadata.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

## Dependencies

This application uses ExifTool for image metadata processing, which is licensed under GPL v3.0.
- ExifTool source: https://github.com/exiftool/exiftool
- ExifTool license: GPL v3.0

## Release Process

### Development
```bash
# Normal development - no release triggered
git add .
git commit -m "feat: add new feature"
git push origin main
```

### Release a new version
```bash
# Update version and create tag
npm version patch  # or minor, major
git push origin --tags
```

This will automatically trigger the release workflow and build executables for Windows, macOS, and Linux.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

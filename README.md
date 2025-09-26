# Inscribe

An Electron application with React and TypeScript for editing image metadata.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

## Dependencies

This application uses ExifTool for image metadata processing, which is licensed under GPL v3.0.
- ExifTool source: https://github.com/exiftool/exiftool
- ExifTool license: GPL v3.0

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

#### ExifTool Setup

This application requires ExifTool for image metadata processing. Follow these steps to set it up:

1. Download ExifTool from [https://exiftool.org/](https://exiftool.org/)
2. Extract the downloaded archive
3. Copy the `exiftool_files` folder to `resources/exiftool_dist/`
4. Rename the ExifTool executable to `exiftool.exe` and place it in `resources/exiftool_dist/`

The final directory structure should look like:
```
resources/
└── exiftool_dist/
    ├── exiftool.exe          # Renamed executable
    └── exiftool_files/       # All ExifTool library files
        ├── exiftool.pl
        ├── lib/
        └── ...
```

#### Start Development

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

# Build Resources

This folder contains resources used when building the Electron kiosk application.

## Required Files

### Windows

- `icon.ico` - Windows application icon (256x256 recommended, .ico format)

### macOS

- `icon.icns` - macOS application icon (.icns format)

### Linux

- `icon.png` - PNG icon for Linux (512x512 recommended)

## Creating Icons

1. Start with a high-resolution PNG (1024x1024 or larger)
2. Use a tool like:
   - [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker)
   - [png2icons](https://www.npmjs.com/package/png2icons)
   - Online converters like [ConvertICO](https://convertico.com/)

## Example Command

```bash
npx electron-icon-maker --input=./logo.png --output=./build-resources
```

## Placeholder

Until proper icons are created, the build will use default Electron icons.

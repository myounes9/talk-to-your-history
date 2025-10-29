# Extension Icons

## Required Icons

The extension needs three icon sizes:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Current Status

Placeholder `icon.svg` has been created with a brain emoji (🧠) on a blue background.

## To Generate PNG Icons

### Option 1: Online Tool
1. Go to https://www.figma.com or https://www.canva.com
2. Create a 128x128 canvas with blue background (#3b82f6)
3. Add a brain emoji or icon
4. Export as PNG in all three sizes

### Option 2: Command Line (requires ImageMagick)
```bash
# If you have ImageMagick installed
convert -size 128x128 xc:'#3b82f6' -font DejaVu-Sans -pointsize 80 -fill white -gravity center -annotate +0+0 '🧠' public/icon128.png
convert public/icon128.png -resize 48x48 public/icon48.png
convert public/icon128.png -resize 16x16 public/icon16.png
```

### Option 3: Use icon.svg
The extension will work with the SVG as a fallback, but PNG is recommended for best compatibility.

## Design Guidelines

- Use a memorable icon related to memory/brain/history
- Keep it simple and recognizable at 16x16
- Use the project's primary color (#3b82f6 blue)
- Ensure good contrast for visibility


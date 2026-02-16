# Process Timeline Block

[https://exzent.de](https://exzent.de)

A fully-featured WordPress Gutenberg block for creating interactive process timeline visualizations with customizable bubble graphics, version management, and responsive layouts.

## Features

### Visual Timeline Editor
- **Interactive bubble visualization** - Display your process steps as colorful, scalable bubbles along a horizontal or vertical timeline
- **Dual-sided labels** - Add "Preface" (top/left) and "Client" (bottom/right) descriptions to each bubble with multi-line support
- **Full customization** - Control bubble colors, sizes, positions, connection lines, indicators, fonts, and hover effects
- **Live preview** - See changes instantly in the block editor

### Advanced Settings (Sidebar Panels)

#### Layout & Display
- Configure default desktop and mobile layouts (horizontal/vertical)
- Set responsive breakpoint (320-1600px)
- Toggle view switching buttons
- Toggle version selector buttons

#### Visual Styling
- **Bubble Colors** - Individual color pickers for each phase (Contact, Discovery, Content, UX/UE, Coding, Launch, Support)
- **Timeline Line** - Color, width, and padding controls
- **Connection Lines** - Color, width, line type (solid/dashed/dotted), text padding
- **Text & Indicators** - Text color, font family, indicator style (circle-dot, solid-circle, hollow-circle, square, diamond, none)
- **Hover Effects** - Bubble scale, hover colors, line widths, blend modes (multiply, screen, overlay, etc.)

#### Bubble Editor
- Select any bubble to edit
- Modify phase, size (1-100), and position (X coordinate)
- Add up to **3 Preface descriptions** per bubble
- Add up to **3 Client descriptions** per bubble
- Each description has:
  - Multi-line label text
  - Font size (M, L, XL, XXL, 3XL, 4XL)
  - Font weight (Light, Regular, Black)
  - Line position (X/Y coordinates)
  - Anchor point (-1 to 1, shifts attachment point on bubble)
- Add new bubbles or delete existing ones

#### Version Manager
- **Save versions** - Create named snapshots of your timeline configuration
- **Load versions** - Instantly switch between saved timeline versions
- **Import/Export** - Share timeline configurations as JSON files
- **Active version tracking** - Visual indicator shows which version is active

### Frontend Features

#### View Toggle
- Horizontal and Vertical layout buttons
- Smooth transitions between views
- Automatic responsive switching based on breakpoint

#### Version Switching
- Dynamically generated version buttons
- Click to instantly load any saved version
- Visual active state on current version

#### Responsive Behavior
- Automatically switches layout at configured breakpoint
- Separate mobile and desktop layout preferences
- Optimized for all screen sizes

#### Developer API
Access block functionality via JavaScript:

```javascript
// Find the block element
const block = document.querySelector('.ppt-block');

// Switch views programmatically
block.pptTimeline.setView('vertical'); // or 'horizontal'

// Load a specific version
block.pptTimeline.loadVersion('v1');

// Get current state
const currentView = block.pptTimeline.getView();
const activeVersion = block.pptTimeline.getActiveVersion();

// Listen to custom events
block.addEventListener('ppt:viewChange', (e) => {
  console.log('View changed to:', e.detail.view);
});

block.addEventListener('ppt:versionChange', (e) => {
  console.log('Version changed to:', e.detail.version);
});

block.addEventListener('ppt:responsiveChange', (e) => {
  console.log('Responsive switch:', e.detail);
});
```

### Block Alignment
- Standard block alignment
- **Wide alignment** - Extends to content width
- **Full alignment** - Full viewport width
- Margin and padding spacing controls

## Installation

1. Download or clone this repository
2. Place the `process-timeline-block` folder in your WordPress `wp-content/plugins/` directory
3. Navigate to the plugin directory:
   ```bash
   cd wp-content/plugins/process-timeline-block
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Build the block:
   ```bash
   npm run build
   ```
6. Activate the plugin in WordPress admin under Plugins

## Development

### Build Commands

```bash
# Development build with watch mode
npm start

# Production build
npm run build

# Lint JavaScript
npm run lint:js

# Format code
npm run format
```

### File Structure

```
process-timeline-block/
├── src/
│   ├── block.json          # Block metadata and attributes
│   ├── index.js            # Block registration entry point
│   ├── edit.js             # Editor component (InspectorControls, preview)
│   ├── view.js             # Frontend interactivity
│   ├── timeline-renderer.js # Shared SVG rendering logic
│   ├── default-data.js     # Default timeline data
│   ├── style.scss          # Shared styles (editor + frontend)
│   └── editor.scss         # Editor-only styles
├── process-timeline-block.php # Main plugin file
├── package.json
├── webpack.config.js       # Custom webpack config for view.js
└── README.md
```

## Usage

1. Add the "Process Timeline" block to any post or page
2. Use the **Block Sidebar** (right panel) to configure:
   - Layout and display settings
   - Visual styling (colors, lines, text, indicators)
   - Bubble editor (add/edit/delete bubbles and descriptions)
   - Version manager (save/load timeline versions)
3. Use the **Block Toolbar** to toggle preview mode (horizontal/vertical)
4. Publish and view your interactive timeline on the frontend

## Default Timeline Data

The block comes pre-populated with a complete website development process timeline including phases:
- Contact
- Discovery
- Content
- UX/UE
- Coding
- Launch
- Support

Each phase has multiple bubbles with Preface (studio tasks) and Client (client tasks) descriptions.

## Customization

### Add Custom Phases

Edit `src/default-data.js` to add new phases to the `DEFAULT_PHASES` object:

```javascript
export const DEFAULT_PHASES = {
  // ... existing phases
  customphase: { name: 'CUSTOM PHASE', color: '#ff6b6b' },
};
```

Then update `src/edit.js` to include the new phase in the Bubble Colors panel.

### Modify Default Settings

Edit `DEFAULT_SETTINGS` in `src/default-data.js` to change default visual settings.

### Extend Frontend API

Add new methods to the `block.pptTimeline` object in `src/view.js`.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported (uses ES6+ features)

## Requirements

- WordPress 6.1+
- PHP 7.0+
- Node.js 14+ (for development)

## License

GPL-2.0-or-later

## Credits

Created by **Preface Studios**

Based on the interactive process timeline visualization system with bubble graphics, version management, and responsive layouts.

## Support

For issues, feature requests, or questions, please open an issue on the GitHub repository.

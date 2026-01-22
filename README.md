# Interactive Design Process Chart

A dynamic, interactive timeline visualization tool for design processes. Built with SVG, CSS, and Vanilla JavaScript, it allows designers and clients to visualize project phases and tasks in a beautiful, responsive chart.


## Features

- **Dual View Modes**: Switch between Horizontal and Vertical timeline layouts.
- **Interactive Visualization**: Hover effects (configurable scaling) and click interactions for bubbles.
- **Customizable Visuals**: Floating settings panel to control:
  - Phase colors
  - Timeline line thickness and color
  - Connection line styles (solid, dashed, dotted)
  - Description font sizes (S, M, L, XL)
  - Connection indicator icons (Circle Dot, Square, Diamond, etc.)
  - Text padding and font family
  - Adjustable bubble hover scaling
- **Built-in Editor**: Edit individual bubbles in real-time on the left panel:
  - Update phases, sizes, and positions
  - Edit "Preface" (Studio) and "Client" task descriptions
  - Adjust label positioning and anchor points on bubbles
  - Add or delete bubbles dynamically
- **Data Persistence**: Export edited configurations directly to `data.js`.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/exzenter/design-process-chart.git
   ```
2. Open `index.html` in any modern web browser.

## Customizing Data

You can customize the timeline by editing `data.js` manually or using the built-in editor within the app and clicking the "Export to data.js" button.

### Configuration Structure

The bubbles are defined in the `TIMELINE_STEPS` array:

```javascript
{
  id: 'step-1',
  phase: 'contact',
  x: 2,
  size: 2,
  preface: { label: 'Intro Meeting', lineX: 2, lineY: -7, anchor: 0 },
  client: { label: 'Needs Assessment', lineX: 2, lineY: 7, anchor: 0 }
}
```

## Technologies Used

- **HTML5 & SVG**: Core structure and visualization implementation.
- **Vanilla CSS3**: Layout and rich animations (glassmorphism, sliding panels).
- **Vanilla JavaScript (ES6+)**: Interactive logic and data management.

## License

EXZENT 
// Process Timeline App
// Uses TIMELINE_STEPS from data.js

class ProcessTimeline {
    constructor() {
        this.viewMode = 'horizontal';
        this.settings = {
            colors: {
                contact: '#e63946',
                discovery: '#f4a261',
                content: '#e9c46a',
                uxue: '#8ac926',
                coding: '#43aa8b',
                launch: '#e879a0',
                support: '#adb5bd'
            },
            timelineColor: '#333333',
            timelineWidth: 0.05,
            connectionColor: '#999999',
            connectionWidth: 0.05,
            connectionType: 'dashed',
            connectionPadding: 0.3,
            textColor: '#333333',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif',
            bubbleHoverScale: 1.05
        };
        // Keep a working copy of timeline steps for editing
        this.timelineSteps = JSON.parse(JSON.stringify(window.TIMELINE_STEPS || []));
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSettingsPanel();
        this.setupEditorPanel();
        this.populateBubbleSelector();
        this.render();
    }

    setupEventListeners() {
        // View toggle buttons
        const horizontalBtn = document.getElementById('view-horizontal');
        const verticalBtn = document.getElementById('view-vertical');

        if (horizontalBtn) {
            horizontalBtn.addEventListener('click', () => {
                this.viewMode = 'horizontal';
                this.updateViewMode();
            });
        }

        if (verticalBtn) {
            verticalBtn.addEventListener('click', () => {
                this.viewMode = 'vertical';
                this.updateViewMode();
            });
        }
    }

    setupSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        const toggleBtn = document.getElementById('settings-toggle');
        const closeBtn = document.getElementById('settings-close');
        const resetBtn = document.getElementById('reset-settings');

        // Toggle panel
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('open');
            });
        }

        // Close panel
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        // Bubble color inputs
        Object.keys(this.settings.colors).forEach(phase => {
            const input = document.getElementById(`color-${phase}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.settings.colors[phase] = e.target.value;
                    this.updateStyles();
                });
            }
        });

        // Timeline color
        const timelineColor = document.getElementById('timeline-color');
        if (timelineColor) {
            timelineColor.addEventListener('input', (e) => {
                this.settings.timelineColor = e.target.value;
                this.render();
            });
        }

        // Timeline width
        const timelineWidth = document.getElementById('timeline-width');
        if (timelineWidth) {
            timelineWidth.addEventListener('input', (e) => {
                this.settings.timelineWidth = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
                this.render();
            });
        }

        // Connection color
        const connectionColor = document.getElementById('connection-color');
        if (connectionColor) {
            connectionColor.addEventListener('input', (e) => {
                this.settings.connectionColor = e.target.value;
                this.render();
            });
        }

        // Connection width
        const connectionWidth = document.getElementById('connection-width');
        if (connectionWidth) {
            connectionWidth.addEventListener('input', (e) => {
                this.settings.connectionWidth = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
                this.render();
            });
        }

        // Connection type
        const connectionType = document.getElementById('connection-type');
        if (connectionType) {
            connectionType.addEventListener('change', (e) => {
                this.settings.connectionType = e.target.value;
                this.render();
            });
        }

        // Connection padding
        const connectionPadding = document.getElementById('connection-padding');
        if (connectionPadding) {
            connectionPadding.addEventListener('input', (e) => {
                this.settings.connectionPadding = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
                this.render();
            });
        }

        // Text color
        const textColor = document.getElementById('text-color');
        if (textColor) {
            textColor.addEventListener('input', (e) => {
                this.settings.textColor = e.target.value;
                this.updateStyles();
            });
        }

        // Font family
        const fontFamily = document.getElementById('font-family');
        if (fontFamily) {
            fontFamily.addEventListener('change', (e) => {
                this.settings.fontFamily = e.target.value;
                this.updateStyles();
            });
        }

        // Bubble hover scale
        const bubbleHoverScale = document.getElementById('bubble-hover-scale');
        if (bubbleHoverScale) {
            bubbleHoverScale.addEventListener('input', (e) => {
                this.settings.bubbleHoverScale = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
                this.updateStyles();
            });
        }

        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    setupEditorPanel() {
        const panel = document.getElementById('editor-panel');
        const toggleBtn = document.getElementById('editor-toggle');
        const closeBtn = document.getElementById('editor-close');

        // Toggle panel
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.toggle('open');
            });
        }

        // Close panel
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        // Bubble selector
        const bubbleSelector = document.getElementById('bubble-selector');
        if (bubbleSelector) {
            bubbleSelector.addEventListener('change', (e) => {
                this.selectBubble(e.target.value);
            });
        }

        // Preface checkbox
        const hasPrefaceCheckbox = document.getElementById('edit-has-preface');
        if (hasPrefaceCheckbox) {
            hasPrefaceCheckbox.addEventListener('change', (e) => {
                document.getElementById('preface-controls').style.display =
                    e.target.checked ? 'block' : 'none';
            });
        }

        // Client checkbox
        const hasClientCheckbox = document.getElementById('edit-has-client');
        if (hasClientCheckbox) {
            hasClientCheckbox.addEventListener('change', (e) => {
                document.getElementById('client-controls').style.display =
                    e.target.checked ? 'block' : 'none';
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-bubble');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveBubble();
            });
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-bubble');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteBubble();
            });
        }

        // Add new bubble button
        const addBtn = document.getElementById('add-bubble');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addNewBubble();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Copy button
        const copyBtn = document.getElementById('copy-export');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard();
            });
        }
    }

    populateBubbleSelector() {
        const selector = document.getElementById('bubble-selector');
        if (!selector) return;

        // Clear existing options except first
        while (selector.options.length > 1) {
            selector.remove(1);
        }

        // Add all bubbles
        this.timelineSteps.forEach((step, index) => {
            const option = document.createElement('option');
            option.value = step.id;
            option.textContent = `${step.id} - ${window.PHASES[step.phase]?.name || step.phase} (x: ${step.x})`;
            selector.appendChild(option);
        });
    }

    selectBubble(stepId) {
        if (!stepId) {
            document.getElementById('bubble-editor').style.display = 'none';
            this.currentEditId = null;
            return;
        }

        const step = this.timelineSteps.find(s => s.id === stepId);
        if (!step) return;

        this.currentEditId = stepId;
        document.getElementById('bubble-editor').style.display = 'block';

        // Populate form
        document.getElementById('edit-phase').value = step.phase;
        document.getElementById('edit-size').value = step.size;
        document.getElementById('edit-x').value = step.x;

        // Preface
        const hasPreface = !!step.preface;
        document.getElementById('edit-has-preface').checked = hasPreface;
        document.getElementById('preface-controls').style.display = hasPreface ? 'block' : 'none';

        if (hasPreface) {
            document.getElementById('edit-preface-label').value = step.preface.label;
            document.getElementById('edit-preface-lineX').value = step.preface.lineX;
            document.getElementById('edit-preface-lineY').value = step.preface.lineY;
            document.getElementById('edit-preface-anchor').value = step.preface.anchor || 0;
        } else {
            document.getElementById('edit-preface-label').value = '';
            document.getElementById('edit-preface-lineX').value = step.x;
            document.getElementById('edit-preface-lineY').value = -7;
            document.getElementById('edit-preface-anchor').value = 0;
        }

        // Client
        const hasClient = !!step.client;
        document.getElementById('edit-has-client').checked = hasClient;
        document.getElementById('client-controls').style.display = hasClient ? 'block' : 'none';

        if (hasClient) {
            document.getElementById('edit-client-label').value = step.client.label;
            document.getElementById('edit-client-lineX').value = step.client.lineX;
            document.getElementById('edit-client-lineY').value = step.client.lineY;
            document.getElementById('edit-client-anchor').value = step.client.anchor || 0;
        } else {
            document.getElementById('edit-client-label').value = '';
            document.getElementById('edit-client-lineX').value = step.x;
            document.getElementById('edit-client-lineY').value = 7;
            document.getElementById('edit-client-anchor').value = 0;
        }
    }

    saveBubble() {
        if (!this.currentEditId) return;

        const stepIndex = this.timelineSteps.findIndex(s => s.id === this.currentEditId);
        if (stepIndex === -1) return;

        // Get values
        const phase = document.getElementById('edit-phase').value;
        const size = parseInt(document.getElementById('edit-size').value);
        const x = parseFloat(document.getElementById('edit-x').value);

        const hasPreface = document.getElementById('edit-has-preface').checked;
        const hasClient = document.getElementById('edit-has-client').checked;

        // Build step object
        const step = {
            id: this.currentEditId,
            phase: phase,
            x: x,
            size: size
        };

        if (hasPreface) {
            step.preface = {
                label: document.getElementById('edit-preface-label').value,
                lineX: parseFloat(document.getElementById('edit-preface-lineX').value),
                lineY: parseFloat(document.getElementById('edit-preface-lineY').value),
                anchor: parseFloat(document.getElementById('edit-preface-anchor').value)
            };
        }

        if (hasClient) {
            step.client = {
                label: document.getElementById('edit-client-label').value,
                lineX: parseFloat(document.getElementById('edit-client-lineX').value),
                lineY: parseFloat(document.getElementById('edit-client-lineY').value),
                anchor: parseFloat(document.getElementById('edit-client-anchor').value)
            };
        }

        // Update
        this.timelineSteps[stepIndex] = step;

        // Update global and re-render
        window.TIMELINE_STEPS = this.timelineSteps;
        this.populateBubbleSelector();
        this.render();

        alert('Bubble saved successfully!');
    }

    deleteBubble() {
        if (!this.currentEditId) return;

        if (!confirm('Are you sure you want to delete this bubble?')) return;

        const stepIndex = this.timelineSteps.findIndex(s => s.id === this.currentEditId);
        if (stepIndex === -1) return;

        this.timelineSteps.splice(stepIndex, 1);
        window.TIMELINE_STEPS = this.timelineSteps;

        // Reset UI
        document.getElementById('bubble-selector').value = '';
        document.getElementById('bubble-editor').style.display = 'none';
        this.currentEditId = null;

        this.populateBubbleSelector();
        this.render();

        alert('Bubble deleted successfully!');
    }

    addNewBubble() {
        // Find next step number
        const maxStep = this.timelineSteps.reduce((max, step) => {
            const match = step.id.match(/step-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);

        const newId = `step-${maxStep + 1}`;
        const newX = this.timelineSteps.length > 0
            ? Math.max(...this.timelineSteps.map(s => s.x)) + 2
            : 2;

        const newStep = {
            id: newId,
            phase: 'contact',
            x: newX,
            size: 2
        };

        this.timelineSteps.push(newStep);
        window.TIMELINE_STEPS = this.timelineSteps;

        this.populateBubbleSelector();
        this.render();

        // Select the new bubble
        document.getElementById('bubble-selector').value = newId;
        this.selectBubble(newId);

        alert('New bubble added! Please configure it.');
    }

    exportData() {
        const output = this.generateDataJS();
        const textarea = document.getElementById('export-textarea');
        const outputDiv = document.getElementById('export-output');

        textarea.value = output;
        outputDiv.style.display = 'block';
    }

    generateDataJS() {
        let output = `// Timeline Steps: Bubbles are always centered on the timeline (y=0)\n`;
        output += `// Each step can have 'preface' (top/left) and 'client' (bottom/right) tasks\n`;
        output += `// y positions for labels are offsets from the center line\n`;
        output += `// anchor: -1 (left/top) to 1 (right/bottom) shift on bubble circumference\n\n`;
        output += `const TIMELINE_STEPS = [\n`;

        this.timelineSteps.forEach((step, index) => {
            output += `  {\n`;
            output += `    id: '${step.id}', phase: '${step.phase}', x: ${step.x}, size: ${step.size}`;

            if (step.preface || step.client) {
                output += `,\n`;

                if (step.preface) {
                    const label = step.preface.label.replace(/\n/g, '\\n');
                    output += `    preface: { label: '${label}', lineX: ${step.preface.lineX}, lineY: ${step.preface.lineY}, anchor: ${step.preface.anchor} }`;
                    if (step.client) output += `,\n`;
                    else output += `\n`;
                }

                if (step.client) {
                    const label = step.client.label.replace(/\n/g, '\\n');
                    output += `    client: { label: '${label}', lineX: ${step.client.lineX}, lineY: ${step.client.lineY}, anchor: ${step.client.anchor} }\n`;
                }
            } else {
                output += `\n`;
            }

            output += `  }`;
            if (index < this.timelineSteps.length - 1) output += `,`;
            output += `\n`;
        });

        output += `];\n\n`;
        output += `// Phase Definitions\n`;
        output += `const PHASES = {\n`;

        Object.entries(window.PHASES).forEach(([key, value], index, arr) => {
            output += `  ${key}: { name: '${value.name}', color: '${this.settings.colors[key] || value.color}' }`;
            if (index < arr.length - 1) output += `,`;
            output += `\n`;
        });

        output += `};\n\n`;
        output += `window.TIMELINE_STEPS = TIMELINE_STEPS;\n`;
        output += `window.PHASES = PHASES;\n`;

        return output;
    }

    copyToClipboard() {
        const textarea = document.getElementById('export-textarea');
        textarea.select();
        document.execCommand('copy');
        alert('Copied to clipboard! You can now paste this into data.js');
    }

    updateStyles() {
        // Update CSS variables for colors
        const root = document.documentElement;
        Object.entries(this.settings.colors).forEach(([phase, color]) => {
            root.style.setProperty(`--color-${phase}`, color);
        });

        // Update bubble hover scale
        root.style.setProperty('--bubble-hover-scale', this.settings.bubbleHoverScale);

        // Update body font
        document.body.style.fontFamily = this.settings.fontFamily;

        // Re-render to apply changes
        this.render();
    }

    resetSettings() {
        // Reset to defaults
        this.settings = {
            colors: {
                contact: '#e63946',
                discovery: '#f4a261',
                content: '#e9c46a',
                uxue: '#8ac926',
                coding: '#43aa8b',
                launch: '#e879a0',
                support: '#adb5bd'
            },
            timelineColor: '#333333',
            timelineWidth: 0.05,
            connectionColor: '#999999',
            connectionWidth: 0.05,
            connectionType: 'dashed',
            connectionPadding: 0.3,
            textColor: '#333333',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif',
            bubbleHoverScale: 1.05
        };

        // Update inputs
        Object.entries(this.settings.colors).forEach(([phase, color]) => {
            const input = document.getElementById(`color-${phase}`);
            if (input) input.value = color;
        });

        document.getElementById('timeline-color').value = this.settings.timelineColor;
        document.getElementById('timeline-width').value = this.settings.timelineWidth;
        document.getElementById('timeline-width').nextElementSibling.textContent = this.settings.timelineWidth;
        document.getElementById('connection-color').value = this.settings.connectionColor;
        document.getElementById('connection-width').value = this.settings.connectionWidth;
        document.getElementById('connection-width').nextElementSibling.textContent = this.settings.connectionWidth;
        document.getElementById('connection-type').value = this.settings.connectionType;
        document.getElementById('connection-padding').value = this.settings.connectionPadding;
        document.getElementById('connection-padding').nextElementSibling.textContent = this.settings.connectionPadding;
        document.getElementById('text-color').value = this.settings.textColor;
        document.getElementById('font-family').value = this.settings.fontFamily;
        document.getElementById('bubble-hover-scale').value = this.settings.bubbleHoverScale;
        document.getElementById('bubble-hover-scale').nextElementSibling.textContent = this.settings.bubbleHoverScale;

        // Apply settings
        this.updateStyles();
    }

    updateViewMode() {
        const wrapper = document.querySelector('.timeline-wrapper');
        const horizontalBtn = document.getElementById('view-horizontal');
        const verticalBtn = document.getElementById('view-vertical');

        if (this.viewMode === 'horizontal') {
            wrapper.classList.remove('vertical');
            wrapper.classList.add('horizontal');
            if (horizontalBtn) horizontalBtn.classList.add('active');
            if (verticalBtn) verticalBtn.classList.remove('active');
        } else {
            wrapper.classList.remove('horizontal');
            wrapper.classList.add('vertical');
            if (verticalBtn) verticalBtn.classList.add('active');
            if (horizontalBtn) horizontalBtn.classList.remove('active');
        }

        this.render();
    }

    render() {
        const container = document.getElementById('timeline-svg');
        if (!container) return;

        container.innerHTML = '';

        if (this.viewMode === 'horizontal') {
            this.renderHorizontal(container);
        } else {
            this.renderVertical(container);
        }
    }

    renderHorizontal(container) {
        const width = 50;
        const height = 20;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.classList.add('timeline-svg');

        // Center line
        const centerY = height / 2;
        const timelineLine = this.createLine(0, centerY, width, centerY, this.settings.timelineWidth);
        timelineLine.classList.add('timeline-line');
        timelineLine.setAttribute('stroke', this.settings.timelineColor);
        svg.appendChild(timelineLine);

        // Owner labels
        const prefaceLabel = this.createText(1, centerY - 6.5, 'PREFACE', 0.4);
        prefaceLabel.classList.add('owner-label');
        prefaceLabel.setAttribute('text-anchor', 'start');
        svg.appendChild(prefaceLabel);

        const clientLabel = this.createText(1, centerY + 7, 'CLIENT', 0.4);
        clientLabel.classList.add('owner-label');
        clientLabel.setAttribute('text-anchor', 'start');
        svg.appendChild(clientLabel);

        // Render all steps
        if (window.TIMELINE_STEPS) {
            window.TIMELINE_STEPS.forEach(step => {
                this.renderStep(svg, step, centerY, false);
            });
        }

        container.appendChild(svg);
    }

    renderVertical(container) {
        const width = 20;
        const height = 50;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.classList.add('timeline-svg');

        // Center line
        const centerX = width / 2;
        const timelineLine = this.createLine(centerX, 0, centerX, height, this.settings.timelineWidth);
        timelineLine.classList.add('timeline-line');
        timelineLine.setAttribute('stroke', this.settings.timelineColor);
        svg.appendChild(timelineLine);

        // Owner labels
        // PREFACE on Left, CLIENT on Right
        const prefaceLabel = this.createText(centerX - 6.5, 2, 'PREFACE', 0.4);
        prefaceLabel.classList.add('owner-label');
        prefaceLabel.setAttribute('text-anchor', 'middle');
        svg.appendChild(prefaceLabel);

        const clientLabel = this.createText(centerX + 6.5, 2, 'CLIENT', 0.4);
        clientLabel.classList.add('owner-label');
        clientLabel.setAttribute('text-anchor', 'middle');
        svg.appendChild(clientLabel);

        // Render all steps
        if (window.TIMELINE_STEPS) {
            window.TIMELINE_STEPS.forEach(step => {
                // Transform step coordinates for vertical view
                // x becomes y (down the timeline)
                // y is ignored as all bubbles are on center (0), so x position is centerX

                // Transform Tasks
                const prefaceTask = step.preface ? {
                    ...step.preface,
                    // Original: lineX (horizontal pos), lineY (offset from center)
                    // Vertical: lineX -> lineY (vertical pos), lineY -> lineX (offset from center)
                    // NEGATIVE lineY in horizontal (up/preface) means LEFT in vertical.
                    lineX: centerX - Math.abs(step.preface.lineY),
                    lineY: step.preface.lineX
                } : null;

                const clientTask = step.client ? {
                    ...step.client,
                    // POSITIVE lineY in horizontal (down/client) means RIGHT in vertical
                    lineX: centerX + Math.abs(step.client.lineY),
                    lineY: step.client.lineX
                } : null;

                const verticalStep = {
                    ...step,
                    x: centerX,
                    y: step.x,
                    preface: prefaceTask,
                    client: clientTask
                };

                this.renderStep(svg, verticalStep, centerX, true);
            });
        }

        container.appendChild(svg);
    }

    renderStep(svg, step, centerLine, isVertical = false) {
        const phase = window.PHASES[step.phase];
        const bubbleColor = this.settings.colors[step.phase] || phase.color;
        const bubbleSize = this.getBubbleSize(step.size);
        const radius = bubbleSize / 2;

        // Bubble Position
        const bx = step.x;
        const by = isVertical ? step.y : centerLine; // Horizontal: y is centerLine (offset 0)

        // Draw Bubble
        const circle = this.createCircle(bx, by, radius, bubbleColor);
        circle.classList.add('bubble');
        circle.dataset.id = step.id;
        circle.dataset.phase = step.phase;
        svg.appendChild(circle);

        // Render Connections
        if (step.preface) {
            this.renderConnection(svg, bx, by, step.preface, radius, isVertical);
        }
        if (step.client) {
            this.renderConnection(svg, bx, by, step.client, radius, isVertical);
        }
    }

    renderConnection(svg, bx, by, task, radius, isVertical) {
        const labelX = task.lineX;
        // Horizontal: task.lineY is offset. Vertical: task.lineY is absolute Y
        const labelY = isVertical ? task.lineY : (by + task.lineY);

        // Angle from center to label
        const angle = Math.atan2(labelY - by, labelX - bx);

        // Start point on circumference
        // Add Anchor Shift if present
        // anchor: -1 to 1. 
        // We simply shift the start point along the tangent?
        // Or we adjust x/y based on radius scale.
        // Simple implementation: Shift X coordinate for horizontal, Y for vertical?
        // Let's implement the shift relative to the radius.

        let xShift = 0;
        let yShift = 0;

        if (task.anchor) {
            // Shift perpendicular to the connection direction? 
            // Or just "Left/Right" on the bubble?
            // User asked for "Beginning of bubble left or end of bubble right".
            // Horizontal View: Shift startX.
            if (!isVertical) {
                xShift = task.anchor * radius;
            } else {
                // Vertical View: Shift startY.
                yShift = task.anchor * radius;
            }
        }

        // Basic circumference point
        let startX = bx + radius * Math.cos(angle);
        let startY = by + radius * Math.sin(angle);

        // Apply Shift and Re-project to circle if needed
        // Or just let it slide along the "width" of the circle.
        // If we just add xShift to startX, we might be off the circle.
        // Better: Calculate point on circle for that specific X?

        if (xShift !== 0 && !isVertical) {
            // Set X, solve for Y
            let targetX = bx + xShift;
            // Clamp to radius
            if (targetX > bx + radius) targetX = bx + radius;
            if (targetX < bx - radius) targetX = bx - radius;

            startX = targetX;
            // y = +/- sqrt(r^2 - x^2)
            const dx = startX - bx;
            const dySq = radius * radius - dx * dx;
            const dy = Math.sqrt(Math.max(0, dySq));
            // Keep sign of original angle
            startY = by + (Math.sin(angle) >= 0 ? dy : -dy);
        }

        if (yShift !== 0 && isVertical) {
            // Set Y, solve for X
            let targetY = by + yShift;
            if (targetY > by + radius) targetY = by + radius;
            if (targetY < by - radius) targetY = by - radius;

            startY = targetY;
            const dy = startY - by;
            const dxSq = radius * radius - dy * dy;
            const dx = Math.sqrt(Math.max(0, dxSq));
            startX = bx + (Math.cos(angle) >= 0 ? dx : -dx);
        }

        // Determine dash array based on connection type
        let dashArray = null;
        switch (this.settings.connectionType) {
            case 'dashed':
                dashArray = "0.2, 0.2";
                break;
            case 'dotted':
                dashArray = "0.05, 0.15";
                break;
            case 'solid':
            default:
                dashArray = null;
                break;
        }

        // Calculate line endpoint with padding before text
        // Estimate text dimensions (approximate based on font size and content)
        const fontSize = 0.3;
        const textLines = task.label.split('\n');
        const longestLine = textLines.reduce((max, line) => line.length > max.length ? line : max, '');
        const approxTextWidth = longestLine.length * fontSize * 0.6; // Rough character width estimate
        const approxTextHeight = textLines.length * fontSize * 1.2; // Line height estimate

        // Calculate direction vector from start to label
        const dx = labelX - startX;
        const dy = labelY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Calculate padding distance (text half-width + padding)
        const paddingDistance = (approxTextWidth / 2) + this.settings.connectionPadding;

        // Calculate new endpoint
        const endX = labelX - (dirX * paddingDistance);
        const endY = labelY - (dirY * paddingDistance);

        // Connection Line
        const line = this.createLine(
            startX, startY,
            endX, endY,
            this.settings.connectionWidth,
            dashArray
        );
        line.classList.add('connection-line');
        line.setAttribute('stroke', this.settings.connectionColor);
        svg.appendChild(line);

        // Label Text
        const label = this.createText(labelX, labelY, task.label, 0.3);
        label.classList.add('label-text');
        label.setAttribute('fill', this.settings.textColor);
        svg.appendChild(label);
    }

    getBubbleSize(sizeLevel) {
        const sizes = {
            1: 2,
            2: 3,
            3: 4,
            4: 5,
            5: 6
        };
        return (sizes[sizeLevel] || 3) * 0.8; // Slightly smaller to fix crowding
    }

    createLine(x1, y1, x2, y2, strokeWidth = 0.05, dashArray = null) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke-width', strokeWidth);
        if (dashArray) {
            line.setAttribute('stroke-dasharray', dashArray);
        }
        return line;
    }

    createCircle(cx, cy, r, fill) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        return circle;
    }

    createText(x, y, content, fontSize = 0.4) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('font-size', fontSize);

        // Handle multi-line text
        const lines = content.split('\n');
        if (lines.length > 1) {
            lines.forEach((line, i) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.textContent = line;
                tspan.setAttribute('x', x);
                tspan.setAttribute('dy', i === 0 ? 0 : '1.2em');
                text.appendChild(tspan);
            });
        } else {
            text.textContent = content;
        }

        return text;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ProcessTimeline();
});

// Process Timeline App
// Uses TIMELINE_STEPS from data.js

class ProcessTimeline {
  constructor() {
    this.viewMode = "horizontal";
    this.settings = {
      colors: {
        contact: "#e63946",
        discovery: "#f4a261",
        content: "#e9c46a",
        uxue: "#8ac926",
        coding: "#43aa8b",
        launch: "#e879a0",
        support: "#adb5bd",
      },
      timelineColor: "#333333",
      timelineWidth: 0.18,
      connectionColor: "#999999",
      connectionWidth: 0.03,
      connectionType: "solid",
      connectionPadding: -0.05,
      textColor: "#333333",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      bubbleHoverScale: 1.05,
      indicatorStyle: "solid-circle",
      indicatorSize: 0.1,
      indicatorColor: "#666666",
      indicatorStrokeWidth: 0.05,
      timelinePadding: 0,
      bubbleBlendMode: "multiply",
      connectionHoverColor: "#e63946",
      connectionHoverWidth: 0.1,
      indicatorHoverStroke: 0.1,
      connectionHoverTextScale: 1.0,
    };
    // Keep a working copy of timeline steps for editing
    this.timelineSteps = JSON.parse(
      JSON.stringify(window.TIMELINE_STEPS || []),
    );
    this.currentEditId = null;

    // Version management
    this.versions = {};
    this.activeVersion = null;
    this.isAnimating = false;
    this.previousStepMap = new Map(); // track previous bubble positions for animation

    // Drag state for editing
    this.dragState = {
      isDragging: false,
      dragType: null, // 'bubble', 'label', or 'indicator'
      bubbleId: null,
      taskType: null, // 'preface' or 'client'
      taskIndex: null, // index in the array
      startX: 0,
      startY: 0,
      originalX: 0,
      originalY: 0,
      originalSize: 0,
      originalAnchor: 0,
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSettingsPanel();
    this.setupEditorPanel();
    this.setupBubbleDrag();
    this.setupVersionBar();
    this.loadVersionsFromStorage();
    this.populateBubbleSelector();
    this.render();
  }

  setupEventListeners() {
    // View toggle buttons
    const horizontalBtn = document.getElementById("view-horizontal");
    const verticalBtn = document.getElementById("view-vertical");

    if (horizontalBtn) {
      horizontalBtn.addEventListener("click", () => {
        this.viewMode = "horizontal";
        this.updateViewMode();
      });
    }

    if (verticalBtn) {
      verticalBtn.addEventListener("click", () => {
        this.viewMode = "vertical";
        this.updateViewMode();
      });
    }
  }

  setupSettingsPanel() {
    const panel = document.getElementById("settings-panel");
    const toggleBtn = document.getElementById("settings-toggle");
    const closeBtn = document.getElementById("settings-close");
    const resetBtn = document.getElementById("reset-settings");

    // Toggle panel
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("open");
      });
    }

    // Close panel
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("open");
      });
    }

    // Bubble color inputs
    Object.keys(this.settings.colors).forEach((phase) => {
      const input = document.getElementById(`color-${phase}`);
      if (input) {
        input.addEventListener("input", (e) => {
          this.settings.colors[phase] = e.target.value;
          this.updateStyles();
        });
      }
    });

    // Timeline color
    const timelineColor = document.getElementById("timeline-color");
    if (timelineColor) {
      timelineColor.addEventListener("input", (e) => {
        this.settings.timelineColor = e.target.value;
        this.render();
      });
    }

    // Timeline width
    const timelineWidth = document.getElementById("timeline-width");
    if (timelineWidth) {
      timelineWidth.addEventListener("input", (e) => {
        this.settings.timelineWidth = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.render();
      });
    }

    // Connection color
    const connectionColor = document.getElementById("connection-color");
    if (connectionColor) {
      connectionColor.addEventListener("input", (e) => {
        this.settings.connectionColor = e.target.value;
        this.render();
      });
    }

    // Connection width
    const connectionWidth = document.getElementById("connection-width");
    if (connectionWidth) {
      connectionWidth.addEventListener("input", (e) => {
        this.settings.connectionWidth = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.render();
      });
    }

    // Connection type
    const connectionType = document.getElementById("connection-type");
    if (connectionType) {
      connectionType.addEventListener("change", (e) => {
        this.settings.connectionType = e.target.value;
        this.render();
      });
    }

    // Connection padding
    const connectionPadding = document.getElementById("connection-padding");
    if (connectionPadding) {
      connectionPadding.addEventListener("input", (e) => {
        this.settings.connectionPadding = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.render();
      });
    }

    // Text color
    const textColor = document.getElementById("text-color");
    if (textColor) {
      textColor.addEventListener("input", (e) => {
        this.settings.textColor = e.target.value;
        this.updateStyles();
      });
    }

    // Font family
    const fontFamily = document.getElementById("font-family");
    if (fontFamily) {
      fontFamily.addEventListener("change", (e) => {
        this.settings.fontFamily = e.target.value;
        this.updateStyles();
      });
    }

    // Bubble hover scale
    const bubbleHoverScale = document.getElementById("bubble-hover-scale");
    if (bubbleHoverScale) {
      bubbleHoverScale.addEventListener("input", (e) => {
        this.settings.bubbleHoverScale = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.updateStyles();
      });
    }

    // Indicator style
    const indicatorStyle = document.getElementById("indicator-style");
    if (indicatorStyle) {
      indicatorStyle.addEventListener("change", (e) => {
        this.settings.indicatorStyle = e.target.value;
        this.render();
      });
    }

    // Indicator size
    const indicatorSize = document.getElementById("indicator-size");
    if (indicatorSize) {
      indicatorSize.addEventListener("input", (e) => {
        this.settings.indicatorSize = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.render();
      });
    }

    // Indicator color
    const indicatorColor = document.getElementById("indicator-color");
    if (indicatorColor) {
      indicatorColor.addEventListener("input", (e) => {
        this.settings.indicatorColor = e.target.value;
        this.render();
      });
    }

    // Indicator stroke width
    const indicatorStrokeWidth = document.getElementById(
      "indicator-stroke-width",
    );
    if (indicatorStrokeWidth) {
      indicatorStrokeWidth.addEventListener("input", (e) => {
        this.settings.indicatorStrokeWidth = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.render();
      });
    }

    // Timeline padding
    const timelinePadding = document.getElementById("timeline-padding");
    if (timelinePadding) {
      timelinePadding.addEventListener("input", (e) => {
        this.settings.timelinePadding = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value + "%";
        this.render();
      });
    }

    // Bubble blend mode
    const bubbleBlendMode = document.getElementById("bubble-blend-mode");
    if (bubbleBlendMode) {
      bubbleBlendMode.addEventListener("change", (e) => {
        this.settings.bubbleBlendMode = e.target.value;
        this.render();
      });
    }

    // Connection hover color
    const connectionHoverColor = document.getElementById(
      "connection-hover-color",
    );
    if (connectionHoverColor) {
      connectionHoverColor.addEventListener("input", (e) => {
        this.settings.connectionHoverColor = e.target.value;
        this.updateStyles();
      });
    }

    // Connection hover width
    const connectionHoverWidth = document.getElementById(
      "connection-hover-width",
    );
    if (connectionHoverWidth) {
      connectionHoverWidth.addEventListener("input", (e) => {
        this.settings.connectionHoverWidth = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.updateStyles();
      });
    }

    // Indicator hover stroke
    const indicatorHoverStroke = document.getElementById(
      "indicator-hover-stroke",
    );
    if (indicatorHoverStroke) {
      indicatorHoverStroke.addEventListener("input", (e) => {
        this.settings.indicatorHoverStroke = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.updateStyles();
      });
    }

    // Connection hover text scale
    const connectionHoverTextScale = document.getElementById(
      "connection-hover-text-scale",
    );
    if (connectionHoverTextScale) {
      connectionHoverTextScale.addEventListener("input", (e) => {
        this.settings.connectionHoverTextScale = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = e.target.value;
        this.updateStyles();
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetSettings();
      });
    }
  }

  setupEditorPanel() {
    const panel = document.getElementById("editor-panel");
    const toggleBtn = document.getElementById("editor-toggle");
    const closeBtn = document.getElementById("editor-close");

    // Toggle panel
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("open");
      });
    }

    // Close panel
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("open");
      });
    }

    // Bubble selector
    const bubbleSelector = document.getElementById("bubble-selector");
    if (bubbleSelector) {
      bubbleSelector.addEventListener("change", (e) => {
        this.selectBubble(e.target.value);
      });
    }

    // Preface checkboxes (1-3)
    for (let i = 1; i <= 3; i++) {
      const checkbox = document.getElementById(`edit-has-preface-${i}`);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          document.getElementById(`preface-controls-${i}`).style.display = e
            .target.checked
            ? "block"
            : "none";
        });
      }
    }

    // Client checkboxes (1-3)
    for (let i = 1; i <= 3; i++) {
      const checkbox = document.getElementById(`edit-has-client-${i}`);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          document.getElementById(`client-controls-${i}`).style.display = e
            .target.checked
            ? "block"
            : "none";
        });
      }
    }

    // Save button
    const saveBtn = document.getElementById("save-bubble");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.saveBubble();
      });
    }

    // Delete button
    const deleteBtn = document.getElementById("delete-bubble");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.deleteBubble();
      });
    }

    // Add new bubble button
    const addBtn = document.getElementById("add-bubble");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.addNewBubble();
      });
    }

    // Export button
    const exportBtn = document.getElementById("export-data");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportData();
      });
    }

    // Copy button
    const copyBtn = document.getElementById("copy-export");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        this.copyToClipboard();
      });
    }
  }

  setupBubbleDrag() {
    const container = document.getElementById("timeline-svg");
    if (!container) return;

    // Mouse down on bubble, label, or indicator
    container.addEventListener("mousedown", (e) => {
      // Only allow drag when editor panel is open and in horizontal mode
      const editorPanel = document.getElementById("editor-panel");
      if (!editorPanel.classList.contains("open")) return;
      if (this.viewMode !== "horizontal") return;

      e.preventDefault();

      // Check what we're dragging
      const bubble = e.target.closest(".bubble");
      const label = e.target.closest(".draggable-label");
      const indicator = e.target.closest(".draggable-indicator");

      if (bubble) {
        const bubbleId = bubble.dataset.id;
        const step = this.timelineSteps.find((s) => s.id === bubbleId);
        if (!step) return;

        this.dragState = {
          isDragging: true,
          dragType: "bubble",
          bubbleId: bubbleId,
          taskType: null,
          taskIndex: null,
          startX: e.clientX,
          startY: e.clientY,
          originalX: step.x,
          originalY: 0,
          originalSize: step.size,
          originalAnchor: 0,
        };

        // Select this bubble in the editor
        document.getElementById("bubble-selector").value = bubbleId;
        this.selectBubble(bubbleId);
      } else if (label) {
        const stepId = label.dataset.stepId;
        const taskType = label.dataset.taskType;
        const taskIndex = parseInt(label.dataset.taskIndex);
        const step = this.timelineSteps.find((s) => s.id === stepId);
        if (!step) return;

        const taskArray = Array.isArray(step[taskType])
          ? step[taskType]
          : [step[taskType]];
        const task = taskArray[taskIndex];
        if (!task) return;

        this.dragState = {
          isDragging: true,
          dragType: "label",
          bubbleId: stepId,
          taskType: taskType,
          taskIndex: taskIndex,
          startX: e.clientX,
          startY: e.clientY,
          originalX: task.lineX,
          originalY: task.lineY,
          originalSize: 0,
          originalAnchor: 0,
        };

        // Select this bubble in the editor
        document.getElementById("bubble-selector").value = stepId;
        this.selectBubble(stepId);
      } else if (indicator) {
        const stepId = indicator.dataset.stepId;
        const taskType = indicator.dataset.taskType;
        const taskIndex = parseInt(indicator.dataset.taskIndex);
        const step = this.timelineSteps.find((s) => s.id === stepId);
        if (!step) return;

        const taskArray = Array.isArray(step[taskType])
          ? step[taskType]
          : [step[taskType]];
        const task = taskArray[taskIndex];
        if (!task) return;

        this.dragState = {
          isDragging: true,
          dragType: "indicator",
          bubbleId: stepId,
          taskType: taskType,
          taskIndex: taskIndex,
          startX: e.clientX,
          startY: e.clientY,
          originalX: 0,
          originalY: 0,
          originalSize: 0,
          originalAnchor: task.anchor || 0,
        };

        // Select this bubble in the editor
        document.getElementById("bubble-selector").value = stepId;
        this.selectBubble(stepId);
      }
    });

    // Mouse move - track drag
    document.addEventListener("mousemove", (e) => {
      if (!this.dragState.isDragging) return;

      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;

      // Get SVG dimensions for coordinate conversion
      const svg = document.querySelector(".timeline-svg");
      if (!svg) return;

      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;

      if (this.dragState.dragType === "bubble") {
        // Bubble drag: X = position, Y = size
        const newX = this.dragState.originalX + deltaX * scaleX;
        const sizeChange = -(deltaY / 2);
        let newSize = this.dragState.originalSize + sizeChange;
        newSize = Math.max(1, Math.min(100, newSize));

        const step = this.timelineSteps.find(
          (s) => s.id === this.dragState.bubbleId,
        );
        if (step) {
          step.x = Math.round(newX * 10) / 10;
          step.size = Math.round(newSize * 10) / 10;

          if (this.currentEditId === this.dragState.bubbleId) {
            document.getElementById("edit-x").value = step.x;
            document.getElementById("edit-size").value = step.size;
          }

          window.TIMELINE_STEPS = this.timelineSteps;
          this.render();
        }
      } else if (this.dragState.dragType === "label") {
        // Label drag: X/Y = position
        const newLineX = this.dragState.originalX + deltaX * scaleX;
        const newLineY = this.dragState.originalY + deltaY * scaleY;

        const step = this.timelineSteps.find(
          (s) => s.id === this.dragState.bubbleId,
        );
        if (step) {
          const taskArray = Array.isArray(step[this.dragState.taskType])
            ? step[this.dragState.taskType]
            : [step[this.dragState.taskType]];
          const task = taskArray[this.dragState.taskIndex];
          if (task) {
            task.lineX = Math.round(newLineX * 10) / 10;
            task.lineY = Math.round(newLineY * 10) / 10;

            // Update editor panel
            const idx = this.dragState.taskIndex + 1;
            const prefix =
              this.dragState.taskType === "preface" ? "preface" : "client";
            const lineXEl = document.getElementById(
              `edit-${prefix}-lineX-${idx}`,
            );
            const lineYEl = document.getElementById(
              `edit-${prefix}-lineY-${idx}`,
            );
            if (lineXEl) lineXEl.value = task.lineX;
            if (lineYEl) lineYEl.value = task.lineY;

            window.TIMELINE_STEPS = this.timelineSteps;
            this.render();
          }
        }
      } else if (this.dragState.dragType === "indicator") {
        // Indicator drag: X = anchor (-1 to 1)
        // Every 50px = 1 anchor unit
        const anchorChange = deltaX / 50;
        let newAnchor = this.dragState.originalAnchor + anchorChange;
        newAnchor = Math.max(-1, Math.min(1, newAnchor));
        newAnchor = Math.round(newAnchor * 100) / 100;

        const step = this.timelineSteps.find(
          (s) => s.id === this.dragState.bubbleId,
        );
        if (step) {
          const taskArray = Array.isArray(step[this.dragState.taskType])
            ? step[this.dragState.taskType]
            : [step[this.dragState.taskType]];
          const task = taskArray[this.dragState.taskIndex];
          if (task) {
            task.anchor = newAnchor;

            // Update editor panel
            const idx = this.dragState.taskIndex + 1;
            const prefix =
              this.dragState.taskType === "preface" ? "preface" : "client";
            const anchorEl = document.getElementById(
              `edit-${prefix}-anchor-${idx}`,
            );
            if (anchorEl) anchorEl.value = task.anchor;

            window.TIMELINE_STEPS = this.timelineSteps;
            this.render();
          }
        }
      }
    });

    // Mouse up - end drag
    document.addEventListener("mouseup", () => {
      if (!this.dragState.isDragging) return;

      // Save changes
      window.TIMELINE_STEPS = this.timelineSteps;
      this.populateBubbleSelector();

      // Reset drag state
      this.dragState = {
        isDragging: false,
        dragType: null,
        bubbleId: null,
        taskType: null,
        taskIndex: null,
        startX: 0,
        startY: 0,
        originalX: 0,
        originalY: 0,
        originalSize: 0,
        originalAnchor: 0,
      };
    });
  }

  populateBubbleSelector() {
    const selector = document.getElementById("bubble-selector");
    if (!selector) return;

    // Clear existing options except first
    while (selector.options.length > 1) {
      selector.remove(1);
    }

    // Add all bubbles
    this.timelineSteps.forEach((step, index) => {
      const option = document.createElement("option");
      option.value = step.id;
      option.textContent = `${step.id} - ${window.PHASES[step.phase]?.name || step.phase} (x: ${step.x})`;
      selector.appendChild(option);
    });
  }

  selectBubble(stepId) {
    if (!stepId) {
      document.getElementById("bubble-editor").style.display = "none";
      this.currentEditId = null;
      return;
    }

    const step = this.timelineSteps.find((s) => s.id === stepId);
    if (!step) return;

    this.currentEditId = stepId;
    document.getElementById("bubble-editor").style.display = "block";

    // Populate form
    document.getElementById("edit-phase").value = step.phase;
    document.getElementById("edit-size").value = step.size;
    document.getElementById("edit-x").value = step.x;

    // Normalize preface to array (backward compatibility)
    const prefaceArray = step.preface
      ? Array.isArray(step.preface)
        ? step.preface
        : [step.preface]
      : [];

    // Populate up to 3 preface descriptions
    for (let i = 1; i <= 3; i++) {
      const hasData = i <= prefaceArray.length;
      const checkbox = document.getElementById(`edit-has-preface-${i}`);
      const controls = document.getElementById(`preface-controls-${i}`);

      checkbox.checked = hasData;
      controls.style.display = hasData ? "block" : "none";

      if (hasData) {
        const data = prefaceArray[i - 1];
        document.getElementById(`edit-preface-label-${i}`).value =
          data.label || "";
        document.getElementById(`edit-preface-size-${i}`).value =
          data.fontSize || "M";
        document.getElementById(`edit-preface-weight-${i}`).value =
          data.fontWeight || "regular";
        document.getElementById(`edit-preface-lineX-${i}`).value = data.lineX;
        document.getElementById(`edit-preface-lineY-${i}`).value = data.lineY;
        document.getElementById(`edit-preface-anchor-${i}`).value =
          data.anchor || 0;
      } else {
        document.getElementById(`edit-preface-label-${i}`).value = "";
        document.getElementById(`edit-preface-size-${i}`).value = "M";
        document.getElementById(`edit-preface-weight-${i}`).value = "regular";
        document.getElementById(`edit-preface-lineX-${i}`).value = step.x;
        document.getElementById(`edit-preface-lineY-${i}`).value =
          -7 - (i - 1) * 1.5;
        document.getElementById(`edit-preface-anchor-${i}`).value = 0;
      }
    }

    // Normalize client to array (backward compatibility)
    const clientArray = step.client
      ? Array.isArray(step.client)
        ? step.client
        : [step.client]
      : [];

    // Populate up to 3 client descriptions
    for (let i = 1; i <= 3; i++) {
      const hasData = i <= clientArray.length;
      const checkbox = document.getElementById(`edit-has-client-${i}`);
      const controls = document.getElementById(`client-controls-${i}`);

      checkbox.checked = hasData;
      controls.style.display = hasData ? "block" : "none";

      if (hasData) {
        const data = clientArray[i - 1];
        document.getElementById(`edit-client-label-${i}`).value =
          data.label || "";
        document.getElementById(`edit-client-size-${i}`).value =
          data.fontSize || "M";
        document.getElementById(`edit-client-weight-${i}`).value =
          data.fontWeight || "regular";
        document.getElementById(`edit-client-lineX-${i}`).value = data.lineX;
        document.getElementById(`edit-client-lineY-${i}`).value = data.lineY;
        document.getElementById(`edit-client-anchor-${i}`).value =
          data.anchor || 0;
      } else {
        document.getElementById(`edit-client-label-${i}`).value = "";
        document.getElementById(`edit-client-size-${i}`).value = "M";
        document.getElementById(`edit-client-weight-${i}`).value = "regular";
        document.getElementById(`edit-client-lineX-${i}`).value = step.x;
        document.getElementById(`edit-client-lineY-${i}`).value =
          7 + (i - 1) * 1.5;
        document.getElementById(`edit-client-anchor-${i}`).value = 0;
      }
    }
  }

  saveBubble() {
    if (!this.currentEditId) return;

    const stepIndex = this.timelineSteps.findIndex(
      (s) => s.id === this.currentEditId,
    );
    if (stepIndex === -1) return;

    // Get values
    const phase = document.getElementById("edit-phase").value;
    const size = parseFloat(document.getElementById("edit-size").value);
    const x = parseFloat(document.getElementById("edit-x").value);

    // Build step object
    const step = {
      id: this.currentEditId,
      phase: phase,
      x: x,
      size: size,
    };

    // Collect preface descriptions
    const prefaceArray = [];
    for (let i = 1; i <= 3; i++) {
      const isChecked = document.getElementById(
        `edit-has-preface-${i}`,
      ).checked;
      if (isChecked) {
        prefaceArray.push({
          label: document.getElementById(`edit-preface-label-${i}`).value,
          fontSize: document.getElementById(`edit-preface-size-${i}`).value,
          fontWeight: document.getElementById(`edit-preface-weight-${i}`).value,
          lineX: parseFloat(
            document.getElementById(`edit-preface-lineX-${i}`).value,
          ),
          lineY: parseFloat(
            document.getElementById(`edit-preface-lineY-${i}`).value,
          ),
          anchor: parseFloat(
            document.getElementById(`edit-preface-anchor-${i}`).value,
          ),
        });
      }
    }

    // Collect client descriptions
    const clientArray = [];
    for (let i = 1; i <= 3; i++) {
      const isChecked = document.getElementById(`edit-has-client-${i}`).checked;
      if (isChecked) {
        clientArray.push({
          label: document.getElementById(`edit-client-label-${i}`).value,
          fontSize: document.getElementById(`edit-client-size-${i}`).value,
          fontWeight: document.getElementById(`edit-client-weight-${i}`).value,
          lineX: parseFloat(
            document.getElementById(`edit-client-lineX-${i}`).value,
          ),
          lineY: parseFloat(
            document.getElementById(`edit-client-lineY-${i}`).value,
          ),
          anchor: parseFloat(
            document.getElementById(`edit-client-anchor-${i}`).value,
          ),
        });
      }
    }

    // Add arrays to step if they have items
    if (prefaceArray.length > 0) {
      step.preface = prefaceArray.length === 1 ? prefaceArray[0] : prefaceArray;
    }
    if (clientArray.length > 0) {
      step.client = clientArray.length === 1 ? clientArray[0] : clientArray;
    }

    // Update
    this.timelineSteps[stepIndex] = step;

    // Update global and re-render
    window.TIMELINE_STEPS = this.timelineSteps;
    this.populateBubbleSelector();
    this.render();
  }

  deleteBubble() {
    if (!this.currentEditId) return;

    if (!confirm("Are you sure you want to delete this bubble?")) return;

    const stepIndex = this.timelineSteps.findIndex(
      (s) => s.id === this.currentEditId,
    );
    if (stepIndex === -1) return;

    this.timelineSteps.splice(stepIndex, 1);
    window.TIMELINE_STEPS = this.timelineSteps;

    // Reset UI
    document.getElementById("bubble-selector").value = "";
    document.getElementById("bubble-editor").style.display = "none";
    this.currentEditId = null;

    this.populateBubbleSelector();
    this.render();

    alert("Bubble deleted successfully!");
  }

  addNewBubble() {
    // Find next step number
    const maxStep = this.timelineSteps.reduce((max, step) => {
      const match = step.id.match(/step-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);

    const newId = `step-${maxStep + 1}`;
    const newX =
      this.timelineSteps.length > 0
        ? Math.max(...this.timelineSteps.map((s) => s.x)) + 2
        : 2;

    const newStep = {
      id: newId,
      phase: "contact",
      x: newX,
      size: 2,
    };

    this.timelineSteps.push(newStep);
    window.TIMELINE_STEPS = this.timelineSteps;

    this.populateBubbleSelector();
    this.render();

    // Select the new bubble
    document.getElementById("bubble-selector").value = newId;
    this.selectBubble(newId);

    alert("New bubble added! Please configure it.");
  }

  exportData() {
    const output = this.generateDataJS();
    const textarea = document.getElementById("export-textarea");
    const outputDiv = document.getElementById("export-output");

    textarea.value = output;
    outputDiv.style.display = "block";
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
          const prefaceArray = Array.isArray(step.preface)
            ? step.preface
            : [step.preface];

          if (prefaceArray.length === 1) {
            const task = prefaceArray[0];
            const label = task.label.replace(/\n/g, "\\n");
            const size = task.fontSize || "M";
            const weight = task.fontWeight || "regular";
            output += `    preface: { label: '${label}', fontSize: '${size}', fontWeight: '${weight}', lineX: ${task.lineX}, lineY: ${task.lineY}, anchor: ${task.anchor} }`;
          } else {
            output += `    preface: [\n`;
            prefaceArray.forEach((task, i) => {
              const label = task.label.replace(/\n/g, "\\n");
              const size = task.fontSize || "M";
              const weight = task.fontWeight || "regular";
              output += `      { label: '${label}', fontSize: '${size}', fontWeight: '${weight}', lineX: ${task.lineX}, lineY: ${task.lineY}, anchor: ${task.anchor} }`;
              if (i < prefaceArray.length - 1) output += `,\n`;
            });
            output += `\n    ]`;
          }

          if (step.client) output += `,\n`;
          else output += `\n`;
        }

        if (step.client) {
          const clientArray = Array.isArray(step.client)
            ? step.client
            : [step.client];

          if (clientArray.length === 1) {
            const task = clientArray[0];
            const label = task.label.replace(/\n/g, "\\n");
            const size = task.fontSize || "M";
            const weight = task.fontWeight || "regular";
            output += `    client: { label: '${label}', fontSize: '${size}', fontWeight: '${weight}', lineX: ${task.lineX}, lineY: ${task.lineY}, anchor: ${task.anchor} }\n`;
          } else {
            output += `    client: [\n`;
            clientArray.forEach((task, i) => {
              const label = task.label.replace(/\n/g, "\\n");
              const size = task.fontSize || "M";
              const weight = task.fontWeight || "regular";
              output += `      { label: '${label}', fontSize: '${size}', fontWeight: '${weight}', lineX: ${task.lineX}, lineY: ${task.lineY}, anchor: ${task.anchor} }`;
              if (i < clientArray.length - 1) output += `,\n`;
            });
            output += `\n    ]\n`;
          }
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

  // ---- Version Management ----

  setupVersionBar() {
    const saveBtn = document.getElementById("save-version-btn");
    const deleteBtn = document.getElementById("delete-version-btn");
    const importBtn = document.getElementById("import-version-btn");
    const exportBtn = document.getElementById("export-version-btn");
    const importFile = document.getElementById("import-version-file");

    if (saveBtn) saveBtn.addEventListener("click", () => this.saveVersion());
    if (deleteBtn)
      deleteBtn.addEventListener("click", () => this.deleteVersion());
    if (importBtn)
      importBtn.addEventListener("click", () => importFile.click());
    if (exportBtn)
      exportBtn.addEventListener("click", () => this.exportVersions());
    if (importFile)
      importFile.addEventListener("change", (e) => this.importVersions(e));
  }

  loadVersionsFromStorage() {
    try {
      const stored = localStorage.getItem("timeline-versions");
      if (stored) {
        this.versions = JSON.parse(stored);
      }
    } catch (e) {
      this.versions = {};
    }
    this.renderVersionButtons();
  }

  persistVersions() {
    try {
      localStorage.setItem("timeline-versions", JSON.stringify(this.versions));
    } catch (e) {
      console.warn("Could not save versions to localStorage");
    }
  }

  saveVersion() {
    const input = document.getElementById("version-name-input");
    let name = (input.value || "").trim();
    if (!name) {
      name = "v" + (Object.keys(this.versions).length + 1);
    }
    this.versions[name] = {
      steps: JSON.parse(JSON.stringify(this.timelineSteps)),
      settings: JSON.parse(JSON.stringify(this.settings)),
      savedAt: new Date().toISOString(),
    };
    this.activeVersion = name;
    this.persistVersions();
    this.renderVersionButtons();
    input.value = "";
  }

  deleteVersion() {
    if (!this.activeVersion) {
      alert("Select a version to delete first.");
      return;
    }
    if (!confirm(`Delete version "${this.activeVersion}"?`)) return;
    delete this.versions[this.activeVersion];
    this.activeVersion = null;
    this.persistVersions();
    this.renderVersionButtons();
  }

  switchToVersion(name) {
    const version = this.versions[name];
    if (!version) return;

    // Snapshot current state for animation diffing
    this.snapshotCurrentState();

    this.activeVersion = name;
    this.timelineSteps = JSON.parse(JSON.stringify(version.steps));
    if (version.settings) {
      this.settings = JSON.parse(JSON.stringify(version.settings));
    }
    window.TIMELINE_STEPS = this.timelineSteps;

    this.renderVersionButtons();
    this.populateBubbleSelector();
    this.renderAnimated();
  }

  snapshotCurrentState() {
    this.previousStepMap = new Map();
    for (const step of this.timelineSteps) {
      this.previousStepMap.set(step.id, JSON.parse(JSON.stringify(step)));
    }
  }

  renderAnimated() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const container = document.getElementById("timeline-svg");
    if (!container) {
      this.isAnimating = false;
      return;
    }

    const oldSvg = container.querySelector("svg");
    const prevIds = new Set(this.previousStepMap.keys());
    const newIds = new Set(this.timelineSteps.map((s) => s.id));

    // IDs that are removed
    const removedIds = [...prevIds].filter((id) => !newIds.has(id));
    // IDs that are added
    const addedIds = [...newIds].filter((id) => !prevIds.has(id));
    // IDs that persist (may move/resize)
    const persistIds = [...newIds].filter((id) => prevIds.has(id));

    // Animate out removed bubbles
    if (oldSvg && removedIds.length > 0) {
      removedIds.forEach((id) => {
        const bubble = oldSvg.querySelector(`.bubble[data-id="${id}"]`);
        if (bubble) bubble.classList.add("bubble-exit");
        // Also fade out related connections/labels
        oldSvg
          .querySelectorAll(`.connection-line[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-exit"));
        oldSvg
          .querySelectorAll(`.label-text[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-exit"));
        oldSvg
          .querySelectorAll(`.draggable-indicator[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-exit"));
      });
    }

    // Wait for exit animations, then render new state
    const exitDuration = removedIds.length > 0 ? 500 : 0;

    setTimeout(() => {
      // Full render of new state
      this.render();

      const newSvg = container.querySelector("svg");
      if (!newSvg) {
        this.isAnimating = false;
        return;
      }

      // Animate persisting bubbles from old position to new
      persistIds.forEach((id) => {
        const oldStep = this.previousStepMap.get(id);
        const newStep = this.timelineSteps.find((s) => s.id === id);
        if (!oldStep || !newStep) return;

        const bubble = newSvg.querySelector(`.bubble[data-id="${id}"]`);
        if (!bubble) return;

        const oldRadius = this.getBubbleSize(oldStep.size) / 2;
        const newRadius = this.getBubbleSize(newStep.size) / 2;
        const centerY = 10; // horizontal centerLine

        // If position or size changed, animate
        if (oldStep.x !== newStep.x || oldStep.size !== newStep.size) {
          // Set to old position first
          bubble.setAttribute("cx", oldStep.x);
          bubble.setAttribute("cy", centerY);
          bubble.setAttribute("r", oldRadius);

          // Force reflow
          bubble.getBoundingClientRect();

          // Animate to new position
          bubble.style.transition = "cx 0.6s ease, cy 0.6s ease, r 0.6s ease";
          bubble.setAttribute("cx", newStep.x);
          bubble.setAttribute("cy", centerY);
          bubble.setAttribute("r", newRadius);
        }
      });

      // Animate in new bubbles
      addedIds.forEach((id) => {
        const bubble = newSvg.querySelector(`.bubble[data-id="${id}"]`);
        if (bubble) bubble.classList.add("bubble-enter");
        newSvg
          .querySelectorAll(`.connection-line[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-enter"));
        newSvg
          .querySelectorAll(`.label-text[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-enter"));
        newSvg
          .querySelectorAll(`.draggable-indicator[data-step-id="${id}"]`)
          .forEach((el) => el.classList.add("connection-enter"));
      });

      // Clean up animation state
      setTimeout(() => {
        this.isAnimating = false;
        this.previousStepMap.clear();
      }, 700);
    }, exitDuration);
  }

  exportVersions() {
    if (Object.keys(this.versions).length === 0) {
      alert("No saved versions to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(this.versions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timeline-versions.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importVersions(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (typeof imported === "object" && imported !== null) {
          // Merge imported versions
          Object.assign(this.versions, imported);
          this.persistVersions();
          this.renderVersionButtons();
          alert(`Imported ${Object.keys(imported).length} version(s).`);
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  renderVersionButtons() {
    const container = document.getElementById("version-buttons");
    if (!container) return;
    container.innerHTML = "";

    Object.keys(this.versions).forEach((name) => {
      const btn = document.createElement("button");
      btn.className =
        "version-btn" + (name === this.activeVersion ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", () => this.switchToVersion(name));
      container.appendChild(btn);
    });
  }

  copyToClipboard() {
    const textarea = document.getElementById("export-textarea");
    textarea.select();
    document.execCommand("copy");
    alert("Copied to clipboard! You can now paste this into data.js");
  }

  updateStyles() {
    // Update CSS variables for colors
    const root = document.documentElement;
    Object.entries(this.settings.colors).forEach(([phase, color]) => {
      root.style.setProperty(`--color-${phase}`, color);
    });

    // Update bubble hover scale
    root.style.setProperty(
      "--bubble-hover-scale",
      this.settings.bubbleHoverScale,
    );

    // Update connection hover styles
    root.style.setProperty(
      "--connection-hover-color",
      this.settings.connectionHoverColor,
    );
    root.style.setProperty(
      "--connection-hover-width",
      this.settings.connectionHoverWidth,
    );
    root.style.setProperty(
      "--indicator-hover-stroke",
      this.settings.indicatorHoverStroke,
    );
    root.style.setProperty(
      "--connection-hover-text-scale",
      this.settings.connectionHoverTextScale,
    );

    // Update body font
    document.body.style.fontFamily = this.settings.fontFamily;

    // Re-render to apply changes
    this.render();
  }

  resetSettings() {
    // Reset to defaults
    this.settings = {
      colors: {
        contact: "#e63946",
        discovery: "#f4a261",
        content: "#e9c46a",
        uxue: "#8ac926",
        coding: "#43aa8b",
        launch: "#e879a0",
        support: "#adb5bd",
      },
      timelineColor: "#333333",
      timelineWidth: 0.18,
      connectionColor: "#999999",
      connectionWidth: 0.03,
      connectionType: "solid",
      connectionPadding: -0.05,
      textColor: "#333333",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      bubbleHoverScale: 1.05,
      indicatorStyle: "solid-circle",
      indicatorSize: 0.1,
      indicatorColor: "#666666",
      indicatorStrokeWidth: 0.05,
      timelinePadding: 0,
      bubbleBlendMode: "multiply",
      connectionHoverColor: "#e63946",
      connectionHoverWidth: 0.1,
      indicatorHoverStroke: 0.1,
      connectionHoverTextScale: 1.0,
    };

    // Update inputs
    Object.entries(this.settings.colors).forEach(([phase, color]) => {
      const input = document.getElementById(`color-${phase}`);
      if (input) input.value = color;
    });

    document.getElementById("timeline-color").value =
      this.settings.timelineColor;
    document.getElementById("timeline-width").value =
      this.settings.timelineWidth;
    document.getElementById("timeline-width").nextElementSibling.textContent =
      this.settings.timelineWidth;
    document.getElementById("connection-color").value =
      this.settings.connectionColor;
    document.getElementById("connection-width").value =
      this.settings.connectionWidth;
    document.getElementById("connection-width").nextElementSibling.textContent =
      this.settings.connectionWidth;
    document.getElementById("connection-type").value =
      this.settings.connectionType;
    document.getElementById("connection-padding").value =
      this.settings.connectionPadding;
    document.getElementById(
      "connection-padding",
    ).nextElementSibling.textContent = this.settings.connectionPadding;
    document.getElementById("text-color").value = this.settings.textColor;
    document.getElementById("font-family").value = this.settings.fontFamily;
    document.getElementById("bubble-hover-scale").value =
      this.settings.bubbleHoverScale;
    document.getElementById(
      "bubble-hover-scale",
    ).nextElementSibling.textContent = this.settings.bubbleHoverScale;
    document.getElementById("indicator-style").value =
      this.settings.indicatorStyle;
    document.getElementById("indicator-size").value =
      this.settings.indicatorSize;
    document.getElementById("indicator-size").nextElementSibling.textContent =
      this.settings.indicatorSize;
    document.getElementById("indicator-color").value =
      this.settings.indicatorColor;
    document.getElementById("indicator-stroke-width").value =
      this.settings.indicatorStrokeWidth;
    document.getElementById(
      "indicator-stroke-width",
    ).nextElementSibling.textContent = this.settings.indicatorStrokeWidth;
    document.getElementById("timeline-padding").value =
      this.settings.timelinePadding;
    document.getElementById("timeline-padding").nextElementSibling.textContent =
      this.settings.timelinePadding + "%";
    if (document.getElementById("bubble-blend-mode")) {
      document.getElementById("bubble-blend-mode").value =
        this.settings.bubbleBlendMode;
    }

    if (document.getElementById("connection-hover-color")) {
      document.getElementById("connection-hover-color").value =
        this.settings.connectionHoverColor;
    }

    if (document.getElementById("connection-hover-width")) {
      document.getElementById("connection-hover-width").value =
        this.settings.connectionHoverWidth;
      document.getElementById(
        "connection-hover-width",
      ).nextElementSibling.textContent = this.settings.connectionHoverWidth;
    }

    if (document.getElementById("indicator-hover-stroke")) {
      document.getElementById("indicator-hover-stroke").value =
        this.settings.indicatorHoverStroke;
      document.getElementById(
        "indicator-hover-stroke",
      ).nextElementSibling.textContent = this.settings.indicatorHoverStroke;
    }

    if (document.getElementById("connection-hover-text-scale")) {
      document.getElementById("connection-hover-text-scale").value =
        this.settings.connectionHoverTextScale;
      document.getElementById(
        "connection-hover-text-scale",
      ).nextElementSibling.textContent = this.settings.connectionHoverTextScale;
    }

    // Apply settings
    this.updateStyles();
  }

  updateViewMode() {
    const wrapper = document.querySelector(".timeline-wrapper");
    const horizontalBtn = document.getElementById("view-horizontal");
    const verticalBtn = document.getElementById("view-vertical");

    if (this.viewMode === "horizontal") {
      wrapper.classList.remove("vertical");
      wrapper.classList.add("horizontal");
      if (horizontalBtn) horizontalBtn.classList.add("active");
      if (verticalBtn) verticalBtn.classList.remove("active");
    } else {
      wrapper.classList.remove("horizontal");
      wrapper.classList.add("vertical");
      if (verticalBtn) verticalBtn.classList.add("active");
      if (horizontalBtn) horizontalBtn.classList.remove("active");
    }

    this.render();
  }

  render() {
    const container = document.getElementById("timeline-svg");
    if (!container) return;

    container.innerHTML = "";

    if (this.viewMode === "horizontal") {
      this.renderHorizontal(container);
    } else {
      this.renderVertical(container);
    }
  }

  renderHorizontal(container) {
    const width = 50;
    const height = 20;

    // Calculate padding offset
    const paddingPercent = this.settings.timelinePadding / 100;
    const paddingX = width * paddingPercent;
    const lineStartX = paddingX;
    const lineEndX = width - paddingX;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.classList.add("timeline-svg");

    // Center line (with padding)
    const centerY = height / 2;
    const timelineLine = this.createLine(
      lineStartX,
      centerY,
      lineEndX,
      centerY,
      this.settings.timelineWidth,
    );
    timelineLine.classList.add("timeline-line");
    timelineLine.setAttribute("stroke", this.settings.timelineColor);
    svg.appendChild(timelineLine);

    // Owner labels
    const prefaceLabel = this.createText(1, centerY - 6.5, "PREFACE", 0.4);
    prefaceLabel.classList.add("owner-label");
    prefaceLabel.setAttribute("text-anchor", "start");
    svg.appendChild(prefaceLabel);

    const clientLabel = this.createText(1, centerY + 7, "CLIENT", 0.4);
    clientLabel.classList.add("owner-label");
    clientLabel.setAttribute("text-anchor", "start");
    svg.appendChild(clientLabel);

    // Render all steps
    if (window.TIMELINE_STEPS) {
      // Sort steps by size (descending) so smaller bubbles are rendered on top
      const sortedSteps = [...window.TIMELINE_STEPS].sort(
        (a, b) => b.size - a.size,
      );

      sortedSteps.forEach((step) => {
        this.renderStep(svg, step, centerY, false);
      });
    }

    container.appendChild(svg);
  }

  renderVertical(container) {
    const width = 20;
    const height = 50;

    // Calculate padding offset
    const paddingPercent = this.settings.timelinePadding / 100;
    const paddingY = height * paddingPercent;
    const lineStartY = paddingY;
    const lineEndY = height - paddingY;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.classList.add("timeline-svg");

    // Center line (with padding)
    const centerX = width / 2;
    const timelineLine = this.createLine(
      centerX,
      lineStartY,
      centerX,
      lineEndY,
      this.settings.timelineWidth,
    );
    timelineLine.classList.add("timeline-line");
    timelineLine.setAttribute("stroke", this.settings.timelineColor);
    svg.appendChild(timelineLine);

    // Owner labels
    // PREFACE on Left, CLIENT on Right
    const prefaceLabel = this.createText(centerX - 6.5, 2, "PREFACE", 0.4);
    prefaceLabel.classList.add("owner-label");
    prefaceLabel.setAttribute("text-anchor", "middle");
    svg.appendChild(prefaceLabel);

    const clientLabel = this.createText(centerX + 6.5, 2, "CLIENT", 0.4);
    clientLabel.classList.add("owner-label");
    clientLabel.setAttribute("text-anchor", "middle");
    svg.appendChild(clientLabel);

    // Render all steps
    if (window.TIMELINE_STEPS) {
      // Sort steps by size (descending) so smaller bubbles are rendered on top
      const sortedSteps = [...window.TIMELINE_STEPS].sort(
        (a, b) => b.size - a.size,
      );

      sortedSteps.forEach((step) => {
        // Transform step coordinates for vertical view
        // x becomes y (down the timeline)
        // y is ignored as all bubbles are on center (0), so x position is centerX

        // Transform Tasks
        // Transform Tasks
        let prefaceTask = null;
        if (step.preface) {
          const prefaceArray = Array.isArray(step.preface)
            ? step.preface
            : [step.preface];
          prefaceTask = prefaceArray.map((task) => ({
            ...task,
            // Original: lineX (horizontal pos), lineY (offset from center)
            // Vertical: lineX -> lineY (vertical pos), lineY -> lineX (offset from center)
            // NEGATIVE lineY in horizontal (up/preface) means LEFT in vertical.
            lineX: centerX - Math.abs(task.lineY),
            lineY: task.lineX,
          }));
          // Keep as object if it was single, to match structure expected by renderStep (which we will also update, but consistency helps)
          // Actually, let's just pass arrays to renderStep always, it will be easier.
        }

        let clientTask = null;
        if (step.client) {
          const clientArray = Array.isArray(step.client)
            ? step.client
            : [step.client];
          clientTask = clientArray.map((task) => ({
            ...task,
            // POSITIVE lineY in horizontal (down/client) means RIGHT in vertical
            lineX: centerX + Math.abs(task.lineY),
            lineY: task.lineX,
          }));
        }

        const verticalStep = {
          ...step,
          x: centerX,
          y: step.x,
          preface: prefaceTask,
          client: clientTask,
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
    circle.classList.add("bubble");
    circle.dataset.id = step.id;
    circle.dataset.phase = step.phase;
    circle.style.mixBlendMode = this.settings.bubbleBlendMode;

    // Add hover listeners
    const handleHoverEnter = () => {
      const lines = svg.querySelectorAll(
        `.connection-line[data-step-id="${step.id}"]`,
      );
      const labels = svg.querySelectorAll(
        `.label-text[data-step-id="${step.id}"]`,
      );
      const indicators = svg.querySelectorAll(
        `.draggable-indicator[data-step-id="${step.id}"]`,
      );

      // Highlight current bubble
      circle.classList.add("bubble-highlighted");

      lines.forEach((line) => line.classList.add("highlighted"));
      labels.forEach((label) => label.classList.add("highlighted"));
      indicators.forEach((indicator) => indicator.classList.add("highlighted"));
    };

    const handleHoverLeave = () => {
      const lines = svg.querySelectorAll(
        `.connection-line[data-step-id="${step.id}"]`,
      );
      const labels = svg.querySelectorAll(
        `.label-text[data-step-id="${step.id}"]`,
      );
      const indicators = svg.querySelectorAll(
        `.draggable-indicator[data-step-id="${step.id}"]`,
      );

      // Un-Highlight current bubble
      circle.classList.remove("bubble-highlighted");

      lines.forEach((line) => line.classList.remove("highlighted"));
      labels.forEach((label) => label.classList.remove("highlighted"));
      indicators.forEach((indicator) =>
        indicator.classList.remove("highlighted"),
      );
    };

    circle.addEventListener("mouseenter", handleHoverEnter);
    circle.addEventListener("mouseleave", handleHoverLeave);

    svg.appendChild(circle);

    // Render Connections
    if (step.preface) {
      const prefaceArray = Array.isArray(step.preface)
        ? step.preface
        : [step.preface];
      prefaceArray.forEach((task, index) => {
        this.renderConnection(
          svg,
          bx,
          by,
          task,
          radius,
          isVertical,
          step.id,
          "preface",
          index,
        );
      });
    }
    if (step.client) {
      const clientArray = Array.isArray(step.client)
        ? step.client
        : [step.client];
      clientArray.forEach((task, index) => {
        this.renderConnection(
          svg,
          bx,
          by,
          task,
          radius,
          isVertical,
          step.id,
          "client",
          index,
        );
      });
    }
  }

  renderConnection(
    svg,
    bx,
    by,
    task,
    radius,
    isVertical,
    stepId,
    owner,
    taskIndex,
  ) {
    const labelX = task.lineX;
    // Horizontal: task.lineY is offset. Vertical: task.lineY is absolute Y
    const labelY = isVertical ? task.lineY : by + task.lineY;

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
      case "dashed":
        dashArray = "0.2, 0.2";
        break;
      case "dotted":
        dashArray = "0.05, 0.15";
        break;
      case "solid":
      default:
        dashArray = null;
        break;
    }

    // Map font size setting to numeric value
    const sizeMap = {
      M: 0.3,
      L: 0.4,
      XL: 0.5,
      XXL: 0.6,
      "3XL": 0.7,
      "4XL": 0.8,
    };
    const fontSize = sizeMap[task.fontSize] || sizeMap["M"];

    // Map font weight setting
    const weightMap = { light: 300, regular: 400, black: 900 };
    const fontWeight = weightMap[task.fontWeight] || weightMap["regular"];

    const textLines = task.label.split("\n");
    const longestLine = textLines.reduce(
      (max, line) => (line.length > max.length ? line : max),
      "",
    );

    // Calculate Precise Bounding Box
    // charWidth is approx 0.6 of fontSize. Line height is 1.2.
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize * 1.2;

    const rectW = longestLine.length * charWidth;
    const rectH = textLines.length * lineHeight;

    // Bounding box is centered on (labelX, labelY)
    const halfW = rectW / 2;
    const halfH = rectH / 2;

    // Calculate intersection of line from (startX, startY) to (labelX, labelY) with the rect
    const dxLine = labelX - startX;
    const dyLine = labelY - startY;
    const angleLine = Math.atan2(dyLine, dxLine);

    // Find distance from (labelX, labelY) to rect edge along angleLine-PI
    // We use the reverse angle because we want the distance from the center of the text to the edge
    const revAngle = angleLine + Math.PI;
    const cos = Math.cos(revAngle);
    const sin = Math.sin(revAngle);

    // Calculate distance to horizontal and vertical edges
    let dBox = 0;
    if (Math.abs(cos) * halfH > Math.abs(sin) * halfW) {
      // Intersects vertical edge
      dBox = halfW / Math.abs(cos);
    } else {
      // Intersects horizontal edge
      dBox = halfH / Math.abs(sin);
    }

    // Add padding
    const paddingDistance = dBox + this.settings.connectionPadding;

    // Calculate new endpoint (startX/startY to endX/endY)
    // Distance from start to label
    const distToLabel = Math.sqrt(dxLine * dxLine + dyLine * dyLine);
    const shrinkFactor = (distToLabel - paddingDistance) / distToLabel;

    const endX = startX + dxLine * Math.max(0, shrinkFactor);
    const endY = startY + dyLine * Math.max(0, shrinkFactor);

    // Connection Line
    const line = this.createLine(
      startX,
      startY,
      endX,
      endY,
      this.settings.connectionWidth,
      dashArray,
    );
    line.classList.add("connection-line");
    line.setAttribute("stroke", this.settings.connectionColor);
    line.dataset.stepId = stepId;
    svg.appendChild(line);

    // Indicator Icon at start point (where line touches bubble)
    const indicator = this.renderIndicator(
      svg,
      startX,
      startY,
      this.settings.indicatorStyle,
      this.settings.indicatorColor,
    );
    if (indicator) {
      indicator.classList.add("draggable-indicator");
      indicator.dataset.stepId = stepId;
      indicator.dataset.taskType = owner;
      indicator.dataset.taskIndex = taskIndex;

      // Add reverse hover logic to indicators
      indicator.addEventListener("mouseenter", () => {
        const bubble = svg.querySelector(`.bubble[data-id="${stepId}"]`);
        if (bubble) bubble.dispatchEvent(new Event("mouseenter"));
      });

      indicator.addEventListener("mouseleave", () => {
        const bubble = svg.querySelector(`.bubble[data-id="${stepId}"]`);
        if (bubble) bubble.dispatchEvent(new Event("mouseleave"));
      });
    }

    // Label Text
    const label = this.createText(labelX, labelY, task.label, fontSize);
    label.classList.add("label-text", "draggable-label");
    label.setAttribute("fill", this.settings.textColor);
    label.setAttribute("font-weight", fontWeight);
    label.dataset.stepId = stepId;
    label.dataset.taskType = owner;
    label.dataset.taskIndex = taskIndex;

    // Add reverse hover logic to text labels
    // Find the step object to access properties, or we can just find the bubble element by ID
    label.addEventListener("mouseenter", () => {
      const bubble = svg.querySelector(`.bubble[data-id="${stepId}"]`);
      if (bubble) bubble.dispatchEvent(new Event("mouseenter"));
    });

    label.addEventListener("mouseleave", () => {
      const bubble = svg.querySelector(`.bubble[data-id="${stepId}"]`);
      if (bubble) bubble.dispatchEvent(new Event("mouseleave"));
    });

    // Vertically center the text block manually if multi-line
    if (textLines.length > 1) {
      // The default createText adds tspans starting at labelY
      // To center, we should shift the first tspan
      const firstTspan = label.querySelector("tspan");
      if (firstTspan) {
        const totalHeight = (textLines.length - 1) * 1.2; // in em unit approx
        // This is tricky with SVG units.
        // Alternatively, we just offset the text element's Y
        const yOffset = (-(textLines.length - 1) * fontSize * 1.2) / 2;
        label.setAttribute("transform", `translate(0, ${yOffset})`);
        label.setAttribute("text-anchor", "middle");
      }
    } else {
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("text-anchor", "middle");
    }

    svg.appendChild(label);
  }

  renderIndicator(svg, x, y, style, color) {
    if (style === "none") return null;

    const size = this.settings.indicatorSize;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    switch (style) {
      case "circle-dot":
        const outer = this.createCircle(x, y, size, "none");
        outer.setAttribute("stroke", color);
        outer.setAttribute("stroke-width", this.settings.indicatorStrokeWidth);
        group.appendChild(outer);

        const dot = this.createCircle(x, y, 0.1, color);
        group.appendChild(dot);
        break;

      case "solid-circle":
        const solid = this.createCircle(x, y, size, color);
        group.appendChild(solid);
        break;

      case "hollow-circle":
        const hollow = this.createCircle(x, y, size, "none");
        hollow.setAttribute("stroke", color);
        hollow.setAttribute("stroke-width", this.settings.indicatorStrokeWidth);
        group.appendChild(hollow);
        break;

      case "square":
        const square = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        square.setAttribute("x", x - size);
        square.setAttribute("y", y - size);
        square.setAttribute("width", size * 2);
        square.setAttribute("height", size * 2);
        square.setAttribute("fill", color);
        group.appendChild(square);
        break;

      case "diamond":
        const diamond = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon",
        );
        const points = `${x},${y - size * 1.2} ${x + size * 1.2},${y} ${x},${y + size * 1.2} ${x - size * 1.2},${y}`;
        diamond.setAttribute("points", points);
        diamond.setAttribute("fill", color);
        group.appendChild(diamond);
        break;
    }

    svg.appendChild(group);
    return group;
  }

  getBubbleSize(sizeLevel) {
    // sizeLevel is now 1-100 continuous
    // Map to SVG units: 1 = 1.0, 100 = 8.0 (linear interpolation)
    const minSize = 1.0;
    const maxSize = 8.0;
    const size = minSize + ((sizeLevel - 1) / 99) * (maxSize - minSize);
    return size;
  }

  createLine(x1, y1, x2, y2, strokeWidth = 0.05, dashArray = null) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke-width", strokeWidth);
    if (dashArray) {
      line.setAttribute("stroke-dasharray", dashArray);
    }
    return line;
  }

  createCircle(cx, cy, r, fill) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", fill);
    return circle;
  }

  createText(x, y, content, fontSize = 0.4) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", fontSize);

    // Handle multi-line text
    const lines = content.split("\n");
    if (lines.length > 1) {
      lines.forEach((line, i) => {
        const tspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        tspan.textContent = line;
        tspan.setAttribute("x", x);
        tspan.setAttribute("dy", i === 0 ? 0 : "1.2em");
        text.appendChild(tspan);
      });
    } else {
      text.textContent = content;
    }

    return text;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new ProcessTimeline();
});

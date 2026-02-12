import { useEffect, useRef, useState } from "@wordpress/element";
import {
  useBlockProps,
  InspectorControls,
  BlockControls,
} from "@wordpress/block-editor";
import {
  PanelBody,
  PanelRow,
  TextControl,
  SelectControl,
  RangeControl,
  ToggleControl,
  Button,
  ButtonGroup,
  ToolbarGroup,
  ToolbarButton,
  ColorPicker,
  ColorIndicator,
  BaseControl,
  TextareaControl,
  Dropdown,
} from "@wordpress/components";
import "./editor.scss";
import { renderTimeline } from "./timeline-renderer";
import {
  DEFAULT_STEPS,
  DEFAULT_PHASES,
  DEFAULT_SETTINGS,
} from "./default-data";

export default function Edit({ attributes, setAttributes }) {
  const {
    timelineSteps,
    phases,
    settings,
    versions,
    activeVersion,
    responsiveBreakpoint,
    mobileLayout,
    desktopLayout,
    showViewToggle,
    showVersionButtons,
  } = attributes;

  const blockProps = useBlockProps({ className: "ppt-block ppt-editor" });
  const containerRef = useRef();
  const [previewMode, setPreviewMode] = useState("horizontal");
  const [selectedBubble, setSelectedBubble] = useState("");
  const [editMode, setEditMode] = useState(false);
  const dragStateRef = useRef({
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
  });

  // Initialize defaults on first insert
  useEffect(() => {
    if (!timelineSteps || timelineSteps.length === 0) {
      setAttributes({
        timelineSteps: JSON.parse(JSON.stringify(DEFAULT_STEPS)),
        phases: JSON.parse(JSON.stringify(DEFAULT_PHASES)),
        settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      });
    }
  }, []);

  // Render timeline preview
  useEffect(() => {
    if (
      containerRef.current &&
      timelineSteps &&
      timelineSteps.length > 0 &&
      settings &&
      phases
    ) {
      renderTimeline(
        containerRef.current,
        timelineSteps,
        phases,
        settings,
        previewMode,
      );
    }
  }, [timelineSteps, phases, settings, previewMode]);

  // Setup drag-and-drop when edit mode is enabled
  useEffect(() => {
    if (!editMode || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const svg = container.querySelector("svg");
    if (!svg) {
      return;
    }

    const handleMouseDown = (e) => {
      if (previewMode !== "horizontal") {
        return; // Only allow drag in horizontal mode
      }

      const bubble = e.target.closest(".bubble");
      const label = e.target.closest(".label-text");
      const indicator = e.target.closest(".draggable-indicator");

      if (bubble) {
        const bubbleId = bubble.dataset.id;
        const step = (timelineSteps || []).find((s) => s.id === bubbleId);
        if (!step) {
          return;
        }

        e.preventDefault();
        e.stopPropagation(); // Stop Gutenberg from intercepting
        dragStateRef.current = {
          isDragging: true,
          dragType: "bubble",
          bubbleId,
          taskType: null,
          taskIndex: null,
          startX: e.clientX,
          startY: e.clientY,
          originalX: step.x,
          originalY: 0,
          originalSize: step.size,
          originalAnchor: 0,
        };
        setSelectedBubble(bubbleId);
      } else if (label) {
        const stepId = label.dataset.stepId;
        const taskType = label.dataset.taskType;
        const taskIndex = parseInt(label.dataset.taskIndex);
        const step = (timelineSteps || []).find((s) => s.id === stepId);
        if (!step) {
          return;
        }

        const taskArray = Array.isArray(step[taskType])
          ? step[taskType]
          : [step[taskType]];
        const task = taskArray[taskIndex];
        if (!task) {
          return;
        }

        e.preventDefault();
        e.stopPropagation(); // Stop Gutenberg from intercepting
        dragStateRef.current = {
          isDragging: true,
          dragType: "label",
          bubbleId: stepId,
          taskType,
          taskIndex,
          startX: e.clientX,
          startY: e.clientY,
          originalX: task.lineX,
          originalY: task.lineY,
          originalSize: 0,
          originalAnchor: 0,
        };
        setSelectedBubble(stepId);
      } else if (indicator) {
        const stepId = indicator.dataset.stepId;
        const taskType = indicator.dataset.taskType;
        const taskIndex = parseInt(indicator.dataset.taskIndex);
        const step = (timelineSteps || []).find((s) => s.id === stepId);
        if (!step) {
          return;
        }

        const taskArray = Array.isArray(step[taskType])
          ? step[taskType]
          : [step[taskType]];
        const task = taskArray[taskIndex];
        if (!task) {
          return;
        }

        e.preventDefault();
        e.stopPropagation(); // Stop Gutenberg from intercepting
        dragStateRef.current = {
          isDragging: true,
          dragType: "indicator",
          bubbleId: stepId,
          taskType,
          taskIndex,
          startX: e.clientX,
          startY: e.clientY,
          originalX: 0,
          originalY: 0,
          originalSize: 0,
          originalAnchor: task.anchor || 0,
        };
        setSelectedBubble(stepId);
      }
    };

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging) {
        return;
      }

      const deltaX = e.clientX - dragStateRef.current.startX;
      const deltaY = e.clientY - dragStateRef.current.startY;

      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;

      if (dragStateRef.current.dragType === "bubble") {
        const newX = dragStateRef.current.originalX + deltaX * scaleX;
        const sizeChange = -(deltaY / 2);
        let newSize = dragStateRef.current.originalSize + sizeChange;
        newSize = Math.max(1, Math.min(100, newSize));

        const newSteps = (timelineSteps || []).map((s) => {
          if (s.id === dragStateRef.current.bubbleId) {
            return {
              ...s,
              x: Math.round(newX * 10) / 10,
              size: Math.round(newSize * 10) / 10,
            };
          }
          return s;
        });
        setAttributes({ timelineSteps: newSteps });
      } else if (dragStateRef.current.dragType === "label") {
        const newLineX = dragStateRef.current.originalX + deltaX * scaleX;
        const newLineY = dragStateRef.current.originalY + deltaY * scaleY;

        const newSteps = (timelineSteps || []).map((s) => {
          if (s.id === dragStateRef.current.bubbleId) {
            const taskArray = Array.isArray(s[dragStateRef.current.taskType])
              ? s[dragStateRef.current.taskType]
              : [s[dragStateRef.current.taskType]];
            const updatedTasks = taskArray.map((task, idx) => {
              if (idx === dragStateRef.current.taskIndex) {
                return {
                  ...task,
                  lineX: Math.round(newLineX * 10) / 10,
                  lineY: Math.round(newLineY * 10) / 10,
                };
              }
              return task;
            });
            return {
              ...s,
              [dragStateRef.current.taskType]:
                updatedTasks.length === 1 ? updatedTasks[0] : updatedTasks,
            };
          }
          return s;
        });
        setAttributes({ timelineSteps: newSteps });
      } else if (dragStateRef.current.dragType === "indicator") {
        const anchorChange = deltaX / 50;
        let newAnchor = dragStateRef.current.originalAnchor + anchorChange;
        newAnchor = Math.max(-1, Math.min(1, newAnchor));
        newAnchor = Math.round(newAnchor * 100) / 100;

        const newSteps = (timelineSteps || []).map((s) => {
          if (s.id === dragStateRef.current.bubbleId) {
            const taskArray = Array.isArray(s[dragStateRef.current.taskType])
              ? s[dragStateRef.current.taskType]
              : [s[dragStateRef.current.taskType]];
            const updatedTasks = taskArray.map((task, idx) => {
              if (idx === dragStateRef.current.taskIndex) {
                return { ...task, anchor: newAnchor };
              }
              return task;
            });
            return {
              ...s,
              [dragStateRef.current.taskType]:
                updatedTasks.length === 1 ? updatedTasks[0] : updatedTasks,
            };
          }
          return s;
        });
        setAttributes({ timelineSteps: newSteps });
      }
    };

    const handleMouseUp = () => {
      dragStateRef.current = {
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
    };

    // Prevent Gutenberg's native HTML5 drag on the block when in edit mode
    const blockWrapper = container.closest(".wp-block");
    const preventDragStart = (e) => {
      if (dragStateRef.current.isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Also intercept pointerdown on the SVG to call setPointerCapture,
    // which prevents Gutenberg's own pointer-based block dragging.
    const handlePointerDown = (e) => {
      const bubble = e.target.closest(".bubble");
      const label = e.target.closest(".label-text");
      const indicator = e.target.closest(".draggable-indicator");
      if (bubble || label || indicator) {
        e.stopPropagation();
        // Capture the pointer so all subsequent pointer events go to the SVG,
        // preventing Gutenberg from seeing them.
        svg.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerUp = (e) => {
      if (svg.hasPointerCapture(e.pointerId)) {
        svg.releasePointerCapture(e.pointerId);
      }
    };

    // Use capture phase to intercept before Gutenberg
    svg.addEventListener("mousedown", handleMouseDown, true);
    svg.addEventListener("pointerdown", handlePointerDown, true);
    svg.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Prevent native drag on the block wrapper and the SVG itself
    if (blockWrapper) {
      blockWrapper.setAttribute("draggable", "false");
      blockWrapper.addEventListener("dragstart", preventDragStart, true);
    }
    svg.addEventListener("dragstart", preventDragStart, true);

    return () => {
      svg.removeEventListener("mousedown", handleMouseDown, true);
      svg.removeEventListener("pointerdown", handlePointerDown, true);
      svg.removeEventListener("pointerup", handlePointerUp, true);
      svg.removeEventListener("dragstart", preventDragStart, true);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (blockWrapper) {
        blockWrapper.removeAttribute("draggable");
        blockWrapper.removeEventListener("dragstart", preventDragStart, true);
      }
    };
  }, [editMode, timelineSteps, previewMode, setAttributes]);

  // Helpers
  const updateSetting = (key, value) => {
    setAttributes({ settings: { ...settings, [key]: value } });
  };

  const updateColor = (phase, color) => {
    const newColors = { ...(settings.colors || {}), [phase]: color };
    setAttributes({ settings: { ...settings, colors: newColors } });
  };

  const getStep = () => {
    if (!selectedBubble) return null;
    return (timelineSteps || []).find((s) => s.id === selectedBubble);
  };

  const updateStep = (stepId, updates) => {
    const newSteps = (timelineSteps || []).map((s) =>
      s.id === stepId ? { ...s, ...updates } : s,
    );
    setAttributes({ timelineSteps: newSteps });
  };

  const addBubble = () => {
    const steps = timelineSteps || [];
    const maxNum = steps.reduce((max, s) => {
      const m = s.id.match(/step-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    const newId = `step-${maxNum + 1}`;
    const newX = steps.length > 0 ? Math.max(...steps.map((s) => s.x)) + 2 : 2;
    const newStep = { id: newId, phase: "contact", x: newX, size: 2 };
    setAttributes({ timelineSteps: [...steps, newStep] });
    setSelectedBubble(newId);
  };

  const deleteBubble = () => {
    if (!selectedBubble) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this bubble?")) return;
    setAttributes({
      timelineSteps: (timelineSteps || []).filter(
        (s) => s.id !== selectedBubble,
      ),
    });
    setSelectedBubble("");
  };

  // Version management
  const saveVersion = (name) => {
    if (!name) return;
    const newVersions = {
      ...(versions || {}),
      [name]: {
        steps: JSON.parse(JSON.stringify(timelineSteps)),
        settings: JSON.parse(JSON.stringify(settings)),
        savedAt: new Date().toISOString(),
      },
    };
    setAttributes({ versions: newVersions, activeVersion: name });
  };

  const loadVersion = (name) => {
    const v = (versions || {})[name];
    if (!v) return;
    setAttributes({
      timelineSteps: JSON.parse(JSON.stringify(v.steps)),
      settings: JSON.parse(JSON.stringify(v.settings)),
      activeVersion: name,
    });
  };

  const deleteVersion = (name) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete version "${name}"?`)) return;
    const newVersions = { ...(versions || {}) };
    delete newVersions[name];
    setAttributes({
      versions: newVersions,
      activeVersion: activeVersion === name ? "" : activeVersion,
    });
  };

  const importVersions = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (typeof imported === "object" && imported !== null) {
            setAttributes({ versions: { ...(versions || {}), ...imported } });
          }
        } catch {
          // eslint-disable-next-line no-alert
          window.alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportVersions = () => {
    const blob = new Blob([JSON.stringify(versions || {}, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timeline-versions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentStep = getStep();
  const phaseKeys = Object.keys(phases || DEFAULT_PHASES);

  return (
    <div {...blockProps}>
      <InspectorControls>
        {/* ===== LAYOUT & DISPLAY ===== */}
        <PanelBody title="Layout & Display" initialOpen={true}>
          <SelectControl
            label="Default Desktop Layout"
            value={desktopLayout}
            options={[
              { label: "Horizontal", value: "horizontal" },
              { label: "Vertical", value: "vertical" },
            ]}
            onChange={(val) => setAttributes({ desktopLayout: val })}
          />
          <SelectControl
            label="Default Mobile Layout"
            value={mobileLayout}
            options={[
              { label: "Vertical", value: "vertical" },
              { label: "Horizontal", value: "horizontal" },
            ]}
            onChange={(val) => setAttributes({ mobileLayout: val })}
          />
          <RangeControl
            label="Responsive Breakpoint (px)"
            value={responsiveBreakpoint}
            onChange={(val) => setAttributes({ responsiveBreakpoint: val })}
            min={320}
            max={1600}
            step={10}
          />
          <ToggleControl
            label="Show View Toggle Buttons"
            checked={showViewToggle}
            onChange={(val) => setAttributes({ showViewToggle: val })}
          />
          <ToggleControl
            label="Show Version Buttons"
            checked={showVersionButtons}
            onChange={(val) => setAttributes({ showVersionButtons: val })}
          />
        </PanelBody>

        {/* ===== BUBBLE COLORS ===== */}
        <PanelBody title="Bubble Colors" initialOpen={false}>
          {phaseKeys.map((key) => (
            <BaseControl
              key={key}
              label={(phases || DEFAULT_PHASES)[key]?.name || key}>
              <PanelRow>
                <ColorIndicator
                  colorValue={settings?.colors?.[key] || "#ccc"}
                />
                <Dropdown
                  renderToggle={({ isOpen, onToggle }) => (
                    <Button
                      onClick={onToggle}
                      aria-expanded={isOpen}
                      variant="secondary"
                      size="small">
                      Change
                    </Button>
                  )}
                  renderContent={() => (
                    <ColorPicker
                      color={settings?.colors?.[key] || "#ccc"}
                      onChange={(c) => updateColor(key, c)}
                    />
                  )}
                />
              </PanelRow>
            </BaseControl>
          ))}
        </PanelBody>

        {/* ===== TIMELINE LINE ===== */}
        <PanelBody title="Timeline Line" initialOpen={false}>
          <BaseControl label="Line Color">
            <Dropdown
              renderToggle={({ isOpen, onToggle }) => (
                <PanelRow>
                  <ColorIndicator
                    colorValue={settings?.timelineColor || "#333"}
                  />
                  <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="secondary"
                    size="small">
                    Change
                  </Button>
                </PanelRow>
              )}
              renderContent={() => (
                <ColorPicker
                  color={settings?.timelineColor || "#333"}
                  onChange={(c) => updateSetting("timelineColor", c)}
                />
              )}
            />
          </BaseControl>
          <RangeControl
            label="Line Width"
            value={settings?.timelineWidth || 0.18}
            onChange={(val) => updateSetting("timelineWidth", val)}
            min={0.01}
            max={0.5}
            step={0.01}
          />
          <RangeControl
            label="Padding %"
            value={settings?.timelinePadding || 0}
            onChange={(val) => updateSetting("timelinePadding", val)}
            min={0}
            max={30}
            step={1}
          />
        </PanelBody>

        {/* ===== CONNECTION LINES ===== */}
        <PanelBody title="Connection Lines" initialOpen={false}>
          <BaseControl label="Color">
            <Dropdown
              renderToggle={({ isOpen, onToggle }) => (
                <PanelRow>
                  <ColorIndicator
                    colorValue={settings?.connectionColor || "#999"}
                  />
                  <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="secondary"
                    size="small">
                    Change
                  </Button>
                </PanelRow>
              )}
              renderContent={() => (
                <ColorPicker
                  color={settings?.connectionColor || "#999"}
                  onChange={(c) => updateSetting("connectionColor", c)}
                />
              )}
            />
          </BaseControl>
          <RangeControl
            label="Width"
            value={settings?.connectionWidth || 0.03}
            onChange={(val) => updateSetting("connectionWidth", val)}
            min={0.01}
            max={0.2}
            step={0.01}
          />
          <SelectControl
            label="Line Type"
            value={settings?.connectionType || "solid"}
            options={[
              { label: "Solid", value: "solid" },
              { label: "Dashed", value: "dashed" },
              { label: "Dotted", value: "dotted" },
            ]}
            onChange={(val) => updateSetting("connectionType", val)}
          />
          <RangeControl
            label="Text Padding"
            value={settings?.connectionPadding ?? -0.05}
            onChange={(val) => updateSetting("connectionPadding", val)}
            min={-1}
            max={1}
            step={0.05}
          />
        </PanelBody>

        {/* ===== TEXT & INDICATORS ===== */}
        <PanelBody title="Text & Indicators" initialOpen={false}>
          <BaseControl label="Text Color">
            <Dropdown
              renderToggle={({ isOpen, onToggle }) => (
                <PanelRow>
                  <ColorIndicator colorValue={settings?.textColor || "#333"} />
                  <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="secondary"
                    size="small">
                    Change
                  </Button>
                </PanelRow>
              )}
              renderContent={() => (
                <ColorPicker
                  color={settings?.textColor || "#333"}
                  onChange={(c) => updateSetting("textColor", c)}
                />
              )}
            />
          </BaseControl>
          <SelectControl
            label="Font Family"
            value={settings?.fontFamily || "system"}
            options={[
              {
                label: "System Default",
                value:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              },
              { label: "Arial", value: "Arial, sans-serif" },
              { label: "Times New Roman", value: "'Times New Roman', serif" },
              { label: "Courier New", value: "'Courier New', monospace" },
              { label: "Georgia", value: "Georgia, serif" },
              { label: "Verdana", value: "Verdana, sans-serif" },
            ]}
            onChange={(val) => updateSetting("fontFamily", val)}
          />
          <RangeControl
            label="Label Distance (Horizontal Mode)"
            help="Adjusts height/vertical spacing of labels from timeline"
            value={settings?.labelDistanceHorizontal ?? 1.0}
            onChange={(val) => updateSetting("labelDistanceHorizontal", val)}
            min={0.1}
            max={2.0}
            step={0.05}
          />
          <RangeControl
            label="Label Distance (Vertical Mode)"
            help="Adjusts width/horizontal spacing of labels from timeline"
            value={settings?.labelDistanceVertical ?? 1.0}
            onChange={(val) => updateSetting("labelDistanceVertical", val)}
            min={0.1}
            max={2.0}
            step={0.05}
          />
          <SelectControl
            label="Indicator Style"
            value={settings?.indicatorStyle || "solid-circle"}
            options={[
              { label: "None", value: "none" },
              { label: "Circle Dot", value: "circle-dot" },
              { label: "Solid Circle", value: "solid-circle" },
              { label: "Hollow Circle", value: "hollow-circle" },
              { label: "Square", value: "square" },
              { label: "Diamond", value: "diamond" },
            ]}
            onChange={(val) => updateSetting("indicatorStyle", val)}
          />
          <RangeControl
            label="Indicator Size"
            value={settings?.indicatorSize || 0.1}
            onChange={(val) => updateSetting("indicatorSize", val)}
            min={0.05}
            max={1}
            step={0.05}
          />
          <BaseControl label="Indicator Color">
            <Dropdown
              renderToggle={({ isOpen, onToggle }) => (
                <PanelRow>
                  <ColorIndicator
                    colorValue={settings?.indicatorColor || "#666"}
                  />
                  <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="secondary"
                    size="small">
                    Change
                  </Button>
                </PanelRow>
              )}
              renderContent={() => (
                <ColorPicker
                  color={settings?.indicatorColor || "#666"}
                  onChange={(c) => updateSetting("indicatorColor", c)}
                />
              )}
            />
          </BaseControl>
          <RangeControl
            label="Indicator Stroke Width"
            value={settings?.indicatorStrokeWidth || 0.05}
            onChange={(val) => updateSetting("indicatorStrokeWidth", val)}
            min={0.01}
            max={0.2}
            step={0.01}
          />
        </PanelBody>

        {/* ===== HOVER EFFECTS ===== */}
        <PanelBody title="Hover Effects" initialOpen={false}>
          <RangeControl
            label="Bubble Hover Scale"
            value={settings?.bubbleHoverScale || 1.05}
            onChange={(val) => updateSetting("bubbleHoverScale", val)}
            min={1}
            max={1.5}
            step={0.05}
          />
          <BaseControl label="Hover Line Color">
            <Dropdown
              renderToggle={({ isOpen, onToggle }) => (
                <PanelRow>
                  <ColorIndicator
                    colorValue={settings?.connectionHoverColor || "#e63946"}
                  />
                  <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="secondary"
                    size="small">
                    Change
                  </Button>
                </PanelRow>
              )}
              renderContent={() => (
                <ColorPicker
                  color={settings?.connectionHoverColor || "#e63946"}
                  onChange={(c) => updateSetting("connectionHoverColor", c)}
                />
              )}
            />
          </BaseControl>
          <RangeControl
            label="Hover Line Width"
            value={settings?.connectionHoverWidth || 0.1}
            onChange={(val) => updateSetting("connectionHoverWidth", val)}
            min={0.01}
            max={0.3}
            step={0.01}
          />
          <RangeControl
            label="Indicator Hover Stroke"
            value={settings?.indicatorHoverStroke || 0.1}
            onChange={(val) => updateSetting("indicatorHoverStroke", val)}
            min={0.01}
            max={0.3}
            step={0.01}
          />
          <RangeControl
            label="Hover Text Scale"
            value={settings?.connectionHoverTextScale || 1.0}
            onChange={(val) => updateSetting("connectionHoverTextScale", val)}
            min={1.0}
            max={1.5}
            step={0.05}
          />
          <SelectControl
            label="Blend Mode"
            value={settings?.bubbleBlendMode || "multiply"}
            options={[
              { label: "Normal", value: "normal" },
              { label: "Multiply", value: "multiply" },
              { label: "Screen", value: "screen" },
              { label: "Overlay", value: "overlay" },
              { label: "Darken", value: "darken" },
              { label: "Lighten", value: "lighten" },
              { label: "Color Dodge", value: "color-dodge" },
              { label: "Color Burn", value: "color-burn" },
              { label: "Hard Light", value: "hard-light" },
              { label: "Soft Light", value: "soft-light" },
              { label: "Difference", value: "difference" },
              { label: "Exclusion", value: "exclusion" },
            ]}
            onChange={(val) => updateSetting("bubbleBlendMode", val)}
          />
        </PanelBody>

        {/* ===== BUBBLE EDITOR ===== */}
        <PanelBody title="Bubble Editor" initialOpen={false}>
          <SelectControl
            label="Select Bubble"
            value={selectedBubble}
            options={[
              { label: "-- Choose a bubble --", value: "" },
              ...(timelineSteps || []).map((s) => ({
                label: `${s.id} - ${
                  (phases || {})[s.phase]?.name || s.phase
                } (x:${s.x})`,
                value: s.id,
              })),
            ]}
            onChange={setSelectedBubble}
          />

          {currentStep && (
            <div className="ppt-bubble-editor">
              <SelectControl
                label="Phase"
                value={currentStep.phase}
                options={phaseKeys.map((k) => ({
                  label: (phases || DEFAULT_PHASES)[k]?.name || k,
                  value: k,
                }))}
                onChange={(val) => updateStep(currentStep.id, { phase: val })}
              />
              <RangeControl
                label="Size"
                value={currentStep.size}
                onChange={(val) => updateStep(currentStep.id, { size: val })}
                min={1}
                max={100}
                step={0.5}
              />
              <RangeControl
                label="Position X"
                value={currentStep.x}
                onChange={(val) => updateStep(currentStep.id, { x: val })}
                min={0}
                max={50}
                step={0.1}
              />

              {/* Preface descriptions */}
              <BubbleTaskEditor
                label="Preface"
                tasks={currentStep.preface}
                stepId={currentStep.id}
                stepX={currentStep.x}
                side="preface"
                updateStep={updateStep}
              />

              {/* Client descriptions */}
              <BubbleTaskEditor
                label="Client"
                tasks={currentStep.client}
                stepId={currentStep.id}
                stepX={currentStep.x}
                side="client"
                updateStep={updateStep}
              />

              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <Button
                  variant="primary"
                  onClick={() => {}}
                  style={{ flex: 1 }}
                  disabled>
                  Auto-saved
                </Button>
                <Button
                  variant="secondary"
                  isDestructive
                  onClick={deleteBubble}
                  style={{ flex: 1 }}>
                  Delete
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={addBubble}
            style={{ width: "100%", marginTop: "12px" }}>
            + Add New Bubble
          </Button>
        </PanelBody>

        {/* ===== VERSION MANAGER ===== */}
        <PanelBody title="Version Manager" initialOpen={false}>
          <VersionManager
            versions={versions || {}}
            activeVersion={activeVersion}
            onSave={saveVersion}
            onLoad={loadVersion}
            onDelete={deleteVersion}
            onImport={importVersions}
            onExport={exportVersions}
          />
        </PanelBody>
      </InspectorControls>

      {/* Block toolbar view toggle */}
      <BlockControls>
        <ToolbarGroup>
          <ToolbarButton
            icon="arrow-right-alt"
            label="Horizontal Preview"
            isPressed={previewMode === "horizontal"}
            onClick={() => setPreviewMode("horizontal")}
          />
          <ToolbarButton
            icon="arrow-down-alt"
            label="Vertical Preview"
            isPressed={previewMode === "vertical"}
            onClick={() => setPreviewMode("vertical")}
          />
        </ToolbarGroup>
      </BlockControls>

      {/* Preview area */}
      <div className={`ppt-preview ppt-preview--${previewMode}`}>
        <div className="ppt-preview-controls">
          <ButtonGroup>
            <Button
              variant={previewMode === "horizontal" ? "primary" : "secondary"}
              onClick={() => setPreviewMode("horizontal")}
              size="small">
              Horizontal
            </Button>
            <Button
              variant={previewMode === "vertical" ? "primary" : "secondary"}
              onClick={() => setPreviewMode("vertical")}
              size="small">
              Vertical
            </Button>
          </ButtonGroup>

          <ToggleControl
            label="Edit Mode (Drag & Drop)"
            checked={editMode}
            onChange={setEditMode}
            help={
              editMode
                ? "Drag bubbles to move/resize. Drag labels to position. Drag indicators to adjust anchor."
                : "Enable to interactively edit bubbles, labels, and indicators."
            }
          />

          {Object.keys(versions || {}).length > 0 && (
            <div className="ppt-preview-versions">
              {Object.keys(versions).map((name) => (
                <Button
                  key={name}
                  variant={activeVersion === name ? "primary" : "tertiary"}
                  onClick={() => loadVersion(name)}
                  size="small">
                  {name}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div
          className={`ppt-timeline-wrapper ppt-timeline-wrapper--${previewMode}${
            editMode ? " edit-mode" : ""
          }`}
          ref={containerRef}
        />
      </div>
    </div>
  );
}

/* ========== Bubble Task Editor Sub-component ========== */

function BubbleTaskEditor({ label, tasks, stepId, stepX, side, updateStep }) {
  const taskArray = tasks ? (Array.isArray(tasks) ? tasks : [tasks]) : [];

  const updateTask = (index, field, value) => {
    const newArr = [...taskArray];
    newArr[index] = { ...newArr[index], [field]: value };
    const result = newArr.length === 1 ? newArr[0] : newArr;
    updateStep(stepId, { [side]: result });
  };

  const addTask = () => {
    const defaultLineY =
      side === "preface"
        ? -7 - taskArray.length * 1.5
        : 7 + taskArray.length * 1.5;
    const newTask = {
      label: "New Task",
      fontSize: "M",
      fontWeight: "regular",
      lineX: stepX,
      lineY: defaultLineY,
      anchor: 0,
    };
    const newArr = [...taskArray, newTask];
    const result = newArr.length === 1 ? newArr[0] : newArr;
    updateStep(stepId, { [side]: result });
  };

  const removeTask = (index) => {
    const newArr = taskArray.filter((_, i) => i !== index);
    if (newArr.length === 0) {
      updateStep(stepId, { [side]: undefined });
    } else {
      const result = newArr.length === 1 ? newArr[0] : newArr;
      updateStep(stepId, { [side]: result });
    }
  };

  return (
    <div className="ppt-task-section">
      <div className="ppt-task-section-header">
        <strong>
          {label} Descriptions ({taskArray.length})
        </strong>
        {taskArray.length < 3 && (
          <Button variant="link" onClick={addTask} size="small">
            + Add
          </Button>
        )}
      </div>
      {taskArray.map((task, idx) => (
        <div key={idx} className="ppt-task-item">
          <div className="ppt-task-item-header">
            <span>
              {label} {idx + 1}
            </span>
            <Button
              variant="link"
              isDestructive
              onClick={() => removeTask(idx)}
              size="small">
              Remove
            </Button>
          </div>
          <TextareaControl
            label="Label"
            value={task.label || ""}
            onChange={(val) => updateTask(idx, "label", val)}
            rows={2}
          />
          <SelectControl
            label="Font Size"
            value={task.fontSize || "M"}
            options={[
              { label: "M", value: "M" },
              { label: "L", value: "L" },
              { label: "XL", value: "XL" },
              { label: "XXL", value: "XXL" },
              { label: "3XL", value: "3XL" },
              { label: "4XL", value: "4XL" },
            ]}
            onChange={(val) => updateTask(idx, "fontSize", val)}
          />
          <SelectControl
            label="Font Weight"
            value={task.fontWeight || "regular"}
            options={[
              { label: "Light", value: "light" },
              { label: "Regular", value: "regular" },
              { label: "Black", value: "black" },
            ]}
            onChange={(val) => updateTask(idx, "fontWeight", val)}
          />
          <RangeControl
            label="Line X"
            value={task.lineX ?? stepX}
            onChange={(val) => updateTask(idx, "lineX", val)}
            min={0}
            max={50}
            step={0.1}
          />
          <RangeControl
            label="Line Y"
            value={task.lineY ?? 0}
            onChange={(val) => updateTask(idx, "lineY", val)}
            min={-15}
            max={15}
            step={0.1}
          />
          <RangeControl
            label="Anchor"
            value={task.anchor ?? 0}
            onChange={(val) => updateTask(idx, "anchor", val)}
            min={-1}
            max={1}
            step={0.05}
          />
        </div>
      ))}
    </div>
  );
}

/* ========== Version Manager Sub-component ========== */

function VersionManager({
  versions,
  activeVersion,
  onSave,
  onLoad,
  onDelete,
  onImport,
  onExport,
}) {
  const [versionName, setVersionName] = useState("");

  const handleSave = () => {
    const name = versionName.trim() || `v${Object.keys(versions).length + 1}`;
    onSave(name);
    setVersionName("");
  };

  const versionKeys = Object.keys(versions);

  return (
    <div className="ppt-version-manager">
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <TextControl
          value={versionName}
          onChange={setVersionName}
          placeholder="Version name..."
          style={{ flex: 1 }}
        />
        <Button variant="primary" onClick={handleSave} size="small">
          Save
        </Button>
      </div>

      {versionKeys.length > 0 && (
        <div className="ppt-version-list">
          {versionKeys.map((name) => (
            <div
              key={name}
              className={`ppt-version-item ${
                name === activeVersion ? "active" : ""
              }`}>
              <Button
                variant={name === activeVersion ? "primary" : "secondary"}
                onClick={() => onLoad(name)}
                size="small"
                style={{ flex: 1 }}>
                {name}
              </Button>
              <Button
                variant="tertiary"
                isDestructive
                onClick={() => onDelete(name)}
                size="small">
                X
              </Button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <Button
          variant="secondary"
          onClick={onImport}
          size="small"
          style={{ flex: 1 }}>
          Import
        </Button>
        <Button
          variant="secondary"
          onClick={onExport}
          size="small"
          style={{ flex: 1 }}>
          Export
        </Button>
      </div>
    </div>
  );
}

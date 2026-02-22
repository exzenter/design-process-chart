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
  DEFAULT_PHASE_ORDER,
  DEFAULT_SETTINGS,
  generatePhaseKey,
} from "./default-data";

export default function Edit({ attributes, setAttributes }) {
  const {
    timelineSteps,
    phases,
    phaseOrder: phaseOrderAttr,
    settings,
    versions,
    activeVersion,
    responsiveBreakpoint,
    mobileLayout,
    desktopLayout,
    showViewToggle,
    showVersionButtons,
    usePxMode,
  } = attributes;

  // Ordered list of phase keys – fall back to DEFAULT_PHASE_ORDER if not yet stored
  const phaseOrder =
    phaseOrderAttr && phaseOrderAttr.length > 0
      ? phaseOrderAttr
      : Object.keys(phases && Object.keys(phases).length ? phases : DEFAULT_PHASES);

  const blockProps = useBlockProps({
    className: `ppt-block ppt-editor${usePxMode ? " ppt-block--px-mode" : ""}`,
  });
  const containerRef = useRef();
  const [previewMode, setPreviewMode] = useState("horizontal");
  const [selectedBubble, setSelectedBubble] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [isCarrying, setIsCarrying] = useState(false);
  const stepsRef = useRef(timelineSteps);
  stepsRef.current = timelineSteps;
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
        phaseOrder: [...DEFAULT_PHASE_ORDER],
        settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      });
    } else if (!phaseOrderAttr || phaseOrderAttr.length === 0) {
      // Migrate existing blocks: derive order from current phases
      setAttributes({
        phaseOrder: Object.keys(phases && Object.keys(phases).length ? phases : DEFAULT_PHASES),
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

  // Click-to-pick, move, click-to-drop editing.
  // First click on a bubble/label/indicator picks it up.
  // Mouse movement updates position. Second click drops it.
  // Escape key cancels. No drag events needed — no Gutenberg conflict.
  // Uses stepsRef so this effect only re-runs on editMode/previewMode change,
  // NOT on every timelineSteps update (which would kill the carrying state).
  useEffect(() => {
    if (!editMode || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const getSvg = () => container.querySelector("svg");

    const handleClick = (e) => {
      const svg = getSvg();
      if (!svg || !container.contains(e.target)) {
        return;
      }
      if (previewMode !== "horizontal") {
        return;
      }

      // If already carrying something, drop it
      if (dragStateRef.current.isDragging) {
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
        setIsCarrying(false);
        return;
      }

      // Otherwise, try to pick something up
      const bubble = e.target.closest(".bubble");
      const label = e.target.closest(".label-text");
      const indicator = e.target.closest(".draggable-indicator");

      if (!bubble && !label && !indicator) {
        return;
      }

      const steps = stepsRef.current || [];

      if (bubble) {
        const bubbleId = bubble.dataset.id;
        const step = steps.find((s) => s.id === bubbleId);
        if (!step) {
          return;
        }
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
        setIsCarrying(true);
      } else if (label) {
        const stepId = label.dataset.stepId;
        const taskType = label.dataset.taskType;
        const taskIndex = parseInt(label.dataset.taskIndex);
        const step = steps.find((s) => s.id === stepId);
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
        setIsCarrying(true);
      } else if (indicator) {
        const stepId = indicator.dataset.stepId;
        const taskType = indicator.dataset.taskType;
        const taskIndex = parseInt(indicator.dataset.taskIndex);
        const step = steps.find((s) => s.id === stepId);
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
        setIsCarrying(true);
      }
    };

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging) {
        return;
      }

      const svg = getSvg();
      if (!svg) {
        return;
      }

      const deltaX = e.clientX - dragStateRef.current.startX;
      const deltaY = e.clientY - dragStateRef.current.startY;

      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;

      const steps = stepsRef.current || [];

      if (dragStateRef.current.dragType === "bubble") {
        const newX = dragStateRef.current.originalX + deltaX * scaleX;
        const sizeChange = -(deltaY / 2);
        let newSize = dragStateRef.current.originalSize + sizeChange;
        newSize = Math.max(1, Math.min(100, newSize));

        const newSteps = steps.map((s) => {
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

        const newSteps = steps.map((s) => {
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
              [dragStateRef.current.taskType]: updatedTasks,
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

        const newSteps = steps.map((s) => {
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
              [dragStateRef.current.taskType]: updatedTasks,
            };
          }
          return s;
        });
        setAttributes({ timelineSteps: newSteps });
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dragStateRef.current.isDragging) {
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
        setIsCarrying(false);
      }
    };

    // click on container (bubble phase — no conflict with Gutenberg drag)
    container.addEventListener("click", handleClick);
    // mousemove on document so it works even outside the SVG area
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editMode, previewMode, setAttributes]);

  // Helpers
  const updateSetting = (key, value) => {
    setAttributes({ settings: { ...settings, [key]: value } });
  };

  const updateColor = (phase, color) => {
    const newColors = { ...(settings.colors || {}), [phase]: color };
    setAttributes({ settings: { ...settings, colors: newColors } });
  };

  // ── Phase Manager helpers ──────────────────────────────────────────
  const MAX_PHASES = 20;

  const addPhase = () => {
    if (phaseOrder.length >= MAX_PHASES) return;
    const key = generatePhaseKey();
    const newPhases = { ...(phases || {}), [key]: { name: "NEW PHASE", color: "#aaaaaa" } };
    const newOrder = [...phaseOrder, key];
    const newColors = { ...(settings?.colors || {}), [key]: "#aaaaaa" };
    setAttributes({
      phases: newPhases,
      phaseOrder: newOrder,
      settings: { ...settings, colors: newColors },
    });
  };

  const deletePhase = (key) => {
    if (phaseOrder.length <= 1) return; // keep at least 1
    const newPhases = { ...(phases || {}) };
    delete newPhases[key];
    const newOrder = phaseOrder.filter((k) => k !== key);
    const fallback = newOrder[0];
    // Reassign steps that used the deleted phase
    const newSteps = (timelineSteps || []).map((s) =>
      s.phase === key ? { ...s, phase: fallback } : s
    );
    const newColors = { ...(settings?.colors || {}) };
    delete newColors[key];
    setAttributes({
      phases: newPhases,
      phaseOrder: newOrder,
      timelineSteps: newSteps,
      settings: { ...settings, colors: newColors },
    });
    if (selectedBubble) {
      const sel = (timelineSteps || []).find((s) => s.id === selectedBubble);
      if (sel && sel.phase === key) {
        // force re-render via no-op; state already updated
      }
    }
  };

  const updatePhaseName = (key, name) => {
    const newPhases = {
      ...(phases || {}),
      [key]: { ...(phases || {})[key], name },
    };
    setAttributes({ phases: newPhases });
  };

  const updatePhaseColor = (key, color) => {
    const newPhases = {
      ...(phases || {}),
      [key]: { ...(phases || {})[key], color },
    };
    const newColors = { ...(settings?.colors || {}), [key]: color };
    setAttributes({
      phases: newPhases,
      settings: { ...settings, colors: newColors },
    });
  };

  const movePhase = (key, direction) => {
    const idx = phaseOrder.indexOf(key);
    if (idx < 0) return;
    const newOrder = [...phaseOrder];
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    setAttributes({ phaseOrder: newOrder });
  };
  // ──────────────────────────────────────────────────────────────────

  const LABEL_SIZE_DEFAULTS = {
    S: { fontSize: 0.22, letterSpacing: 0, fontWeight: 400 },
    M: { fontSize: 0.30, letterSpacing: 0, fontWeight: 400 },
    L: { fontSize: 0.40, letterSpacing: 0, fontWeight: 400 },
    XL: { fontSize: 0.50, letterSpacing: 0, fontWeight: 400 },
    XXL: { fontSize: 0.60, letterSpacing: 0, fontWeight: 400 },
    "3XL": { fontSize: 0.70, letterSpacing: 0, fontWeight: 400 },
    "4XL": { fontSize: 0.80, letterSpacing: 0, fontWeight: 400 },
  };

  const updateLabelTypography = (sizeKey, field, value) => {
    const current = settings?.labelTypography || {};
    const existing = { ...LABEL_SIZE_DEFAULTS[sizeKey], ...(current[sizeKey] || {}) };
    updateSetting("labelTypography", {
      ...current,
      [sizeKey]: { ...existing, [field]: value },
    });
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
    const newStep = { id: newId, phase: phaseOrder[0] || "contact", x: newX, size: 2 };
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

  // Build a URL-safe slug from any string
  const toSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Colour palette for auto-generated phases
  const HEADING_PALETTE = [
    "#e63946",
    "#f4a261",
    "#e9c46a",
    "#8ac926",
    "#43aa8b",
    "#4895ef",
    "#e879a0",
    "#9b5de5",
    "#f15bb5",
    "#00bbf9",
  ];

  const importFromHeadings = () => {
    // Try the editor iframe first, fall back to main document
    const editorDoc =
      document.querySelector(".editor-canvas__iframe")?.contentDocument ||
      document.querySelector("iframe[name='editor-canvas']")?.contentDocument ||
      document;

    const rawHeadings = Array.from(
      editorDoc.querySelectorAll(
        ".is-root-container h2, .is-root-container h3, .is-root-container h4, .is-root-container h5, .is-root-container h6," +
        ".editor-styles-wrapper h2, .editor-styles-wrapper h3, .editor-styles-wrapper h4, .editor-styles-wrapper h5, .editor-styles-wrapper h6",
      ),
    );

    const validHeadings = rawHeadings.filter(el => el.textContent.trim());

    if (validHeadings.length === 0) {
      // eslint-disable-next-line no-alert
      window.alert("Keine H2–H6 Überschriften auf dieser Seite gefunden.");
      return;
    }

    const totalHeadings = validHeadings.length;
    const rangeStart = 2; // Margin from left
    const rangeEnd = 48;   // Margin from right
    const spacing = totalHeadings > 1 ? (rangeEnd - rangeStart) / (totalHeadings - 1) : 0;

    const newPhases = {};
    const newOrder = [];
    const newColors = {};
    const newSteps = [];
    let paletteIdx = 0;
    let currentPhaseKey = null;

    validHeadings.forEach((el, index) => {
      const level = parseInt(el.tagName[1], 10); // 2…6
      const text = el.textContent.trim();

      const xPos = totalHeadings > 1 ? rangeStart + (index * spacing) : 25;
      const roundedX = Math.round(xPos * 10) / 10;

      // Determine heading id for smooth-scroll
      const effectiveId = (el.id && !el.id.startsWith("block-")) ? el.id : null;
      const headingId = effectiveId || toSlug(text) || `heading-${index + 1}`;

      if (level === 2) {
        // New phase
        const phaseKey = toSlug(text) || `phase-${Date.now()}-${paletteIdx}`;
        const color = HEADING_PALETTE[paletteIdx % HEADING_PALETTE.length];
        paletteIdx++;

        newPhases[phaseKey] = { name: text.toUpperCase(), color };
        newOrder.push(phaseKey);
        newColors[phaseKey] = color;
        currentPhaseKey = phaseKey;

        // H2 → large phase bubble
        newSteps.push({
          id: `step-${index + 1}`,
          phase: phaseKey,
          x: roundedX,
          size: 60,
          headingId,
          descriptions: [
            {
              label: text,
              fontSize: "XL",
              fontWeight: "black",
              lineX: roundedX,
              lineY: -9,
              anchor: 0,
              headingId,
            },
          ],
        });
      } else {
        // H3–H6 → smaller step in current phase
        if (!currentPhaseKey) {
          // No H2 parent yet – create a default phase
          const phaseKey = "intro";
          if (!newPhases[phaseKey]) {
            const color = HEADING_PALETTE[paletteIdx % HEADING_PALETTE.length];
            paletteIdx++;
            newPhases[phaseKey] = { name: "INTRO", color };
            newOrder.push(phaseKey);
            newColors[phaseKey] = color;
          }
          currentPhaseKey = phaseKey;
        }

        const sizeByLevel = { 3: 30, 4: 18, 5: 12, 6: 8 };
        const fontByLevel = { 3: "L", 4: "M", 5: "S", 6: "S" };
        const bubbleSize = sizeByLevel[level] || 15;
        const fontSize = fontByLevel[level] || "S";

        const lineY = (index + 1) % 2 === 0 ? 8 : -8; // alternate above/below
        newSteps.push({
          id: `step-${index + 1}`,
          phase: currentPhaseKey,
          x: roundedX,
          size: bubbleSize,
          headingId,
          descriptions: [
            {
              label: text,
              fontSize,
              fontWeight: "regular",
              lineX: roundedX,
              lineY,
              anchor: 0,
              headingId,
            },
          ],
        });
      }
    });

    if (newSteps.length === 0) {
      // eslint-disable-next-line no-alert
      window.alert("Keine verwertbaren Überschriften gefunden.");
      return;
    }

    // Apply the new data and save as a version
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const versionName = `Headings – ${dd}.${mm}.${yyyy}`;

    // Temporarily update attributes, then save version
    const newVersionData = {
      steps: JSON.parse(JSON.stringify(newSteps)),
      settings: JSON.parse(JSON.stringify(settings)),
      phases: JSON.parse(JSON.stringify(newPhases)),
      phaseOrder: [...newOrder],
      savedAt: new Date().toISOString(),
    };

    const newVersions = {
      ...(versions || {}),
      [versionName]: newVersionData,
    };

    setAttributes({
      timelineSteps: newSteps,
      phases: newPhases,
      phaseOrder: newOrder,
      settings: { ...settings, colors: newColors },
      versions: newVersions,
      activeVersion: versionName,
    });
  };

  const currentStep = getStep();

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
          <ToggleControl
            label="Use Fixed PX Sizing"
            help="Switch all rem-based layout sizes to fixed px values. Enable this on sites that don't use a standard rem scale."
            checked={!!usePxMode}
            onChange={(val) => setAttributes({ usePxMode: val })}
          />
          <RangeControl
            label="Horizontal Max Width (px)"
            help="0 = no limit. Constrains the timeline width in horizontal mode."
            value={settings?.horizontalMaxWidth ?? 0}
            onChange={(val) => updateSetting("horizontalMaxWidth", val)}
            min={0}
            max={3000}
            step={10}
          />
          <RangeControl
            label="Vertical Max Height (px)"
            help="0 = no limit. Constrains the timeline height in vertical mode."
            value={settings?.verticalMaxHeight ?? 0}
            onChange={(val) => updateSetting("verticalMaxHeight", val)}
            min={0}
            max={5000}
            step={10}
          />
          <RangeControl
            label="Crop Top % (Horizontal)"
            help="Trims whitespace from the top in horizontal mode."
            value={settings?.cropTop ?? 0}
            onChange={(val) => updateSetting("cropTop", val)}
            min={0}
            max={65}
            step={1}
          />
          <RangeControl
            label="Crop Bottom % (Horizontal)"
            help="Trims whitespace from the bottom in horizontal mode."
            value={settings?.cropBottom ?? 0}
            onChange={(val) => updateSetting("cropBottom", val)}
            min={0}
            max={65}
            step={1}
          />
          <RangeControl
            label="Crop Left % (Vertical)"
            help="Trims whitespace from the left in vertical mode."
            value={settings?.cropLeft ?? 0}
            onChange={(val) => updateSetting("cropLeft", val)}
            min={0}
            max={45}
            step={1}
          />
          <RangeControl
            label="Crop Right % (Vertical)"
            help="Trims whitespace from the right in vertical mode."
            value={settings?.cropRight ?? 0}
            onChange={(val) => updateSetting("cropRight", val)}
            min={0}
            max={45}
            step={1}
          />
        </PanelBody>

        {/* ===== PHASE MANAGER ===== */}
        <PanelBody title="Phase Manager" initialOpen={false}>
          <p style={{ fontSize: "11px", color: "#666", margin: "0 0 8px" }}>
            {phaseOrder.length} / {MAX_PHASES} Phasen
          </p>
          {phaseOrder.map((key, idx) => {
            const ph = (phases || DEFAULT_PHASES)[key] || { name: key, color: "#cccccc" };
            const phColor = (settings?.colors?.[key]) || ph.color || "#cccccc";
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "8px",
                  marginBottom: "8px",
                  background: "#f6f7f7",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ColorIndicator colorValue={phColor} />
                  <TextControl
                    value={ph.name}
                    onChange={(val) => updatePhaseName(key, val)}
                    style={{ flex: 1, margin: 0 }}
                  />
                  <Dropdown
                    renderToggle={({ isOpen, onToggle }) => (
                      <Button
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        variant="secondary"
                        size="small">
                        Farbe
                      </Button>
                    )}
                    renderContent={() => (
                      <ColorPicker
                        color={phColor}
                        onChange={(c) => updatePhaseColor(key, c)}
                      />
                    )}
                  />
                </div>
                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    variant="tertiary"
                    disabled={idx === 0}
                    onClick={() => movePhase(key, "up")}
                    aria-label="Nach oben">
                    ↑
                  </Button>
                  <Button
                    size="small"
                    variant="tertiary"
                    disabled={idx === phaseOrder.length - 1}
                    onClick={() => movePhase(key, "down")}
                    aria-label="Nach unten">
                    ↓
                  </Button>
                  <Button
                    size="small"
                    variant="tertiary"
                    isDestructive
                    disabled={phaseOrder.length <= 1}
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      if (window.confirm(`Phase "${ph.name}" löschen?`)) {
                        deletePhase(key);
                      }
                    }}
                    aria-label="Phase löschen">
                    ✕
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            variant="secondary"
            onClick={addPhase}
            disabled={phaseOrder.length >= MAX_PHASES}
            style={{ width: "100%" }}>
            + Phase hinzufügen
          </Button>
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
            value={settings?.timelineWidth ?? 0.18}
            onChange={(val) => updateSetting("timelineWidth", val)}
            min={0}
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

        {/* ===== CURVE PATH (Horizontal Mode) ===== */}
        <PanelBody title="Curve Path (Horizontal)" initialOpen={false}>
          <ToggleControl
            label="Enable Curved Timeline"
            help="Draw the timeline as a curve instead of a straight line (horizontal mode only)"
            checked={settings?.curveEnabled || false}
            onChange={(val) => updateSetting("curveEnabled", val)}
          />

          {settings?.curveEnabled && (
            <>
              <BaseControl
                label="Bezier Curve Editor"
                help="Drag the control handles to shape the curve. Endpoints stay at the edges.">
                <div
                  style={{
                    background: "#f0f0f0",
                    padding: "12px",
                    borderRadius: "4px",
                    marginTop: "8px",
                  }}>
                  {(() => {
                    const pts = settings?.curvePoints || [
                      { x: 0, y: 0.5 },
                      { x: 0.33, y: 0.3 },
                      { x: 0.67, y: 0.7 },
                      { x: 1, y: 0.5 },
                    ];
                    // Ensure exactly 4 points
                    const safePts =
                      pts.length === 4
                        ? pts
                        : [
                          { x: 0, y: 0.5 },
                          { x: 0.33, y: 0.3 },
                          { x: 0.67, y: 0.7 },
                          { x: 1, y: 0.5 },
                        ];
                    const pointLabels = [
                      "Start",
                      "Control 1",
                      "Control 2",
                      "End",
                    ];
                    const pointColors = ["#333", "#e63946", "#e63946", "#333"];

                    return (
                      <>
                        <svg
                          viewBox="0 0 100 50"
                          style={{
                            width: "100%",
                            height: "120px",
                            background: "white",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            cursor: "default",
                          }}>
                          {/* Grid */}
                          <line
                            x1="0"
                            y1="25"
                            x2="100"
                            y2="25"
                            stroke="#ddd"
                            strokeWidth="0.5"
                          />
                          <line
                            x1="50"
                            y1="0"
                            x2="50"
                            y2="50"
                            stroke="#ddd"
                            strokeWidth="0.5"
                          />

                          {/* Handle lines */}
                          <line
                            x1={safePts[0].x * 100}
                            y1={safePts[0].y * 50}
                            x2={safePts[1].x * 100}
                            y2={safePts[1].y * 50}
                            stroke="#aaa"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                          />
                          <line
                            x1={safePts[3].x * 100}
                            y1={safePts[3].y * 50}
                            x2={safePts[2].x * 100}
                            y2={safePts[2].y * 50}
                            stroke="#aaa"
                            strokeWidth="0.8"
                            strokeDasharray="2,2"
                          />

                          {/* Cubic bezier curve */}
                          <path
                            d={`M ${safePts[0].x * 100} ${safePts[0].y * 50
                              } C ${safePts[1].x * 100} ${safePts[1].y * 50}, ${safePts[2].x * 100
                              } ${safePts[2].y * 50}, ${safePts[3].x * 100} ${safePts[3].y * 50
                              }`}
                            stroke={settings?.timelineColor || "#333"}
                            strokeWidth="2"
                            fill="none"
                          />

                          {/* Control points */}
                          {safePts.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.x * 100}
                              cy={pt.y * 50}
                              r={i === 1 || i === 2 ? "3.5" : "3"}
                              fill={pointColors[i]}
                              stroke="white"
                              strokeWidth="1"
                              style={{ cursor: "pointer" }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const svg = e.currentTarget.ownerSVGElement;
                                const rect = svg.getBoundingClientRect();

                                const handleMove = (moveE) => {
                                  let x =
                                    (moveE.clientX - rect.left) / rect.width;
                                  let y =
                                    (moveE.clientY - rect.top) / rect.height;
                                  // Lock endpoint X positions
                                  if (i === 0) x = 0;
                                  if (i === 3) x = 1;
                                  const newPoints = [...safePts];
                                  newPoints[i] = {
                                    x: Math.max(0, Math.min(1, x)),
                                    y: Math.max(0, Math.min(1, y)),
                                  };
                                  updateSetting("curvePoints", newPoints);
                                };

                                const handleUp = () => {
                                  document.removeEventListener(
                                    "mousemove",
                                    handleMove,
                                  );
                                  document.removeEventListener(
                                    "mouseup",
                                    handleUp,
                                  );
                                };

                                document.addEventListener(
                                  "mousemove",
                                  handleMove,
                                );
                                document.addEventListener("mouseup", handleUp);
                              }}
                            />
                          ))}
                        </svg>

                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            color: "#666",
                          }}>
                          <strong>Drag</strong> endpoints and control handles to
                          shape the curve
                        </div>

                        {safePts.map((pt, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                              marginTop: "8px",
                              padding: "6px",
                              background: "white",
                              borderRadius: "3px",
                            }}>
                            <span
                              style={{
                                fontSize: "11px",
                                minWidth: "65px",
                                color: pointColors[i],
                                fontWeight:
                                  i === 1 || i === 2 ? "bold" : "normal",
                              }}>
                              {pointLabels[i]}:
                            </span>
                            <span style={{ fontSize: "10px", color: "#999" }}>
                              X
                            </span>
                            <input
                              type="number"
                              value={Math.round(pt.x * 100)}
                              onChange={(e) => {
                                const newPoints = [...safePts];
                                newPoints[i] = {
                                  ...newPoints[i],
                                  x: Number(e.target.value) / 100,
                                };
                                updateSetting("curvePoints", newPoints);
                              }}
                              min="0"
                              max="100"
                              step="1"
                              disabled={i === 0 || i === 3}
                              style={{ width: "50px", fontSize: "11px" }}
                            />
                            <span style={{ fontSize: "10px", color: "#999" }}>
                              Y
                            </span>
                            <input
                              type="number"
                              value={Math.round(pt.y * 100)}
                              onChange={(e) => {
                                const newPoints = [...safePts];
                                newPoints[i] = {
                                  ...newPoints[i],
                                  y: Number(e.target.value) / 100,
                                };
                                updateSetting("curvePoints", newPoints);
                              }}
                              min="0"
                              max="100"
                              step="1"
                              style={{ width: "50px", fontSize: "11px" }}
                            />
                          </div>
                        ))}

                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "8px",
                          }}>
                          <Button
                            variant="secondary"
                            isSmall
                            onClick={() => {
                              updateSetting("curvePoints", [
                                { x: 0, y: 0.5 },
                                { x: 0.33, y: 0.3 },
                                { x: 0.67, y: 0.7 },
                                { x: 1, y: 0.5 },
                              ]);
                            }}>
                            Reset S-Curve
                          </Button>
                          <Button
                            variant="secondary"
                            isSmall
                            onClick={() => {
                              updateSetting("curvePoints", [
                                { x: 0, y: 0.5 },
                                { x: 0.33, y: 0.5 },
                                { x: 0.67, y: 0.5 },
                                { x: 1, y: 0.5 },
                              ]);
                            }}>
                            Reset Straight
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </BaseControl>
            </>
          )}
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

        {/* ===== LABEL TYPOGRAPHY ===== */}
        <PanelBody title="Label Typography" initialOpen={false}>
          {Object.keys(LABEL_SIZE_DEFAULTS).map((sizeKey) => {
            const typog = {
              ...LABEL_SIZE_DEFAULTS[sizeKey],
              ...(settings?.labelTypography?.[sizeKey] || {}),
            };
            return (
              <div
                key={sizeKey}
                style={{
                  borderBottom: "1px solid #e0e0e0",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#1e1e1e",
                    marginBottom: "6px",
                  }}>
                  Size: {sizeKey}
                </div>
                <RangeControl
                  label="Font Size"
                  value={typog.fontSize}
                  onChange={(v) =>
                    updateLabelTypography(sizeKey, "fontSize", v)
                  }
                  min={0.05}
                  max={1.5}
                  step={0.01}
                />
                <RangeControl
                  label="Letter Spacing"
                  value={typog.letterSpacing}
                  onChange={(v) =>
                    updateLabelTypography(sizeKey, "letterSpacing", v)
                  }
                  min={-0.05}
                  max={0.15}
                  step={0.005}
                />
                <RangeControl
                  label="Font Weight"
                  value={typog.fontWeight}
                  onChange={(v) =>
                    updateLabelTypography(sizeKey, "fontWeight", v)
                  }
                  min={100}
                  max={900}
                  step={100}
                />
              </div>
            );
          })}
          <p style={{ fontSize: "11px", color: "#757575", marginTop: "4px" }}>
            Note: per-label <em>light</em> (300) and <em>black</em> (900)
            weights override the Font Weight here.
          </p>
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

        {/* ===== ENTRY ANIMATION ===== */}
        <PanelBody title="Entry Animation" initialOpen={false}>
          <ToggleControl
            label="Enable Entry Animation"
            help="Bubbles and indicators animate in when scrolled into view."
            checked={settings?.entryAnimation !== false}
            onChange={(val) => updateSetting("entryAnimation", val)}
          />
          {settings?.entryAnimation !== false && (
            <>
              <RangeControl
                label="Visibility Threshold (%)"
                help="How much of the block must be visible before animation starts."
                value={Math.round(
                  (settings?.entryAnimationThreshold ?? 0.5) * 100,
                )}
                onChange={(val) =>
                  updateSetting("entryAnimationThreshold", val / 100)
                }
                min={10}
                max={100}
                step={5}
              />
              <RangeControl
                label="Bubble Duration (ms)"
                value={settings?.entryBubbleDuration ?? 600}
                onChange={(val) => updateSetting("entryBubbleDuration", val)}
                min={100}
                max={2000}
                step={50}
              />
              <RangeControl
                label="Bubble Stagger (ms)"
                help="Delay between each bubble appearing."
                value={settings?.entryBubbleStagger ?? 80}
                onChange={(val) => updateSetting("entryBubbleStagger", val)}
                min={0}
                max={500}
                step={10}
              />
              <RangeControl
                label="Indicator Duration (ms)"
                value={settings?.entryIndicatorDuration ?? 400}
                onChange={(val) => updateSetting("entryIndicatorDuration", val)}
                min={100}
                max={2000}
                step={50}
              />
              <RangeControl
                label="Indicator Stagger (ms)"
                help="Delay between each indicator/label appearing."
                value={settings?.entryIndicatorStagger ?? 60}
                onChange={(val) => updateSetting("entryIndicatorStagger", val)}
                min={0}
                max={500}
                step={10}
              />
              <RangeControl
                label="Indicator Start Delay (ms)"
                help="Extra delay after all bubbles finish before indicators start."
                value={settings?.entryIndicatorDelay ?? 200}
                onChange={(val) => updateSetting("entryIndicatorDelay", val)}
                min={0}
                max={1000}
                step={50}
              />
              <SelectControl
                label="Easing"
                value={settings?.entryEasing || "ease-out"}
                options={[
                  { label: "Ease Out", value: "ease-out" },
                  { label: "Ease In Out", value: "ease-in-out" },
                  { label: "Ease Out Back (Bounce)", value: "ease-out-back" },
                  { label: "Linear", value: "linear" },
                ]}
                onChange={(val) => updateSetting("entryEasing", val)}
              />
            </>
          )}
        </PanelBody>

        {/* ===== BUBBLE EDITOR ===== */}
        <PanelBody title="Bubble Editor" initialOpen={false}>
          <SelectControl
            label="Select Bubble"
            value={selectedBubble}
            options={[
              { label: "-- Choose a bubble --", value: "" },
              ...(timelineSteps || []).map((s) => ({
                label: `${s.id} - ${(phases || {})[s.phase]?.name || s.phase
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
                options={phaseOrder.map((k) => ({
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

              {/* Unified descriptions */}
              <BubbleTaskEditor
                tasks={currentStep.descriptions ?? currentStep.preface ?? currentStep.client}
                stepId={currentStep.id}
                stepX={currentStep.x}
                updateStep={updateStep}
                legacyPreface={currentStep.preface}
                legacyClient={currentStep.client}
              />

              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <Button
                  variant="primary"
                  onClick={() => { }}
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
            onOverwrite={saveVersion}
            onImport={importVersions}
            onExport={exportVersions}
            onImportHeadings={importFromHeadings}
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
            label="Edit Mode (Click to Move)"
            checked={editMode}
            onChange={setEditMode}
            help={
              editMode
                ? "Click a bubble to pick it up, move mouse, click again to drop. Click labels/indicators too. Press Escape to cancel."
                : "Enable to interactively reposition bubbles, labels, and indicators."
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
          className={`ppt-timeline-wrapper ppt-timeline-wrapper--${previewMode}${editMode ? " edit-mode" : ""
            }${isCarrying ? " carrying" : ""}`}
          ref={containerRef}
        />
      </div>
    </div>
  );
}

/* ========== Bubble Task Editor Sub-component ========== */

function BubbleTaskEditor({ tasks, stepId, stepX, updateStep, legacyPreface, legacyClient }) {
  // Resolve task array: prefer descriptions, fall back to legacy preface+client merge
  let taskArray;
  if (tasks !== undefined && !legacyPreface && !legacyClient) {
    taskArray = tasks ? (Array.isArray(tasks) ? tasks : [tasks]) : [];
  } else if (legacyPreface || legacyClient) {
    const pre = legacyPreface ? (Array.isArray(legacyPreface) ? legacyPreface : [legacyPreface]) : [];
    const cli = legacyClient ? (Array.isArray(legacyClient) ? legacyClient : [legacyClient]) : [];
    taskArray = [...pre, ...cli];
  } else {
    taskArray = tasks ? (Array.isArray(tasks) ? tasks : [tasks]) : [];
  }

  const saveDescs = (newArr) => {
    if (newArr.length === 0) {
      updateStep(stepId, { descriptions: undefined, preface: undefined, client: undefined });
    } else {
      updateStep(stepId, { descriptions: newArr, preface: undefined, client: undefined });
    }
  };

  const updateTask = (index, field, value) => {
    const newArr = [...taskArray];
    newArr[index] = { ...newArr[index], [field]: value };
    saveDescs(newArr);
  };

  const addTask = () => {
    const idx = taskArray.length;
    // Alternate above/below: even index = above (negative), odd = below (positive)
    const defaultLineY = idx % 2 === 0 ? -7 - Math.floor(idx / 2) * 1.5 : 7 + Math.floor(idx / 2) * 1.5;
    const newTask = {
      label: "New Description",
      fontSize: "M",
      fontWeight: "regular",
      lineX: stepX,
      lineY: defaultLineY,
      anchor: 0,
    };
    saveDescs([...taskArray, newTask]);
  };

  const removeTask = (index) => {
    saveDescs(taskArray.filter((_, i) => i !== index));
  };

  return (
    <div className="ppt-task-section">
      <div className="ppt-task-section-header">
        <strong>Descriptions ({taskArray.length})</strong>
        {taskArray.length < 6 && (
          <Button variant="link" onClick={addTask} size="small">
            + Add
          </Button>
        )}
      </div>
      {taskArray.map((task, idx) => (
        <div key={idx} className="ppt-task-item">
          <div className="ppt-task-item-header">
            <span>
              {task.lineY < 0 ? "↑ Above" : "↓ Below"} {idx + 1}
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
            label="Line Y (neg = above, pos = below)"
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
  onOverwrite,
  onImport,
  onExport,
  onImportHeadings,
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
              className={`ppt-version-item ${name === activeVersion ? "active" : ""
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
                onClick={() => onOverwrite(name)}
                size="small">
                ↻
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

      <div style={{ marginTop: "10px" }}>
        <Button
          variant="secondary"
          onClick={onImportHeadings}
          size="small"
          style={{ width: "100%" }}
          title="Scannt H2–H6 Überschriften der Seite und erstellt daraus eine neue Version">
          🔍 Aus Seitenstruktur
        </Button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
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

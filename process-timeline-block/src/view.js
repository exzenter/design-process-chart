/**
 * Frontend interactivity for the Process Timeline block.
 * Handles view toggling, version switching with animation, responsive layout,
 * and scroll-triggered entry animations.
 */

import { renderTimeline } from "./timeline-renderer";

const SVG_NS = "http://www.w3.org/2000/svg";

document.addEventListener("DOMContentLoaded", () => {
  const blocks = document.querySelectorAll(".ppt-block");
  blocks.forEach((block) => initBlock(block));
});

/* ========== Easing helpers ========== */
const EASINGS = {
  linear: (t) => t,
  "ease-out": (t) => 1 - Math.pow(1 - t, 3),
  "ease-in-out": (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  "ease-out-back": (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Run the entry animation on a rendered SVG.
 * Phase 1: bubbles pop in left-to-right (or top-to-bottom in vertical).
 * Phase 2: indicators + labels + connection lines fade/slide in, staggered.
 */
function playEntryAnimation(container, settings, viewMode) {
  const svg = container.querySelector("svg");
  if (!svg) return;

  const ease = EASINGS[settings.entryEasing] || EASINGS["ease-out"];
  const bubbleDuration = settings.entryBubbleDuration ?? 600;
  const bubbleStagger = settings.entryBubbleStagger ?? 80;
  const indicatorDuration = settings.entryIndicatorDuration ?? 400;
  const indicatorStagger = settings.entryIndicatorStagger ?? 60;
  const indicatorDelay = settings.entryIndicatorDelay ?? 200;

  // Collect bubbles sorted by position (left-to-right or top-to-bottom)
  const bubbles = [...svg.querySelectorAll(".bubble")];
  bubbles.sort((a, b) => {
    if (viewMode === "vertical") {
      return +a.getAttribute("cy") - +b.getAttribute("cy");
    }
    return +a.getAttribute("cx") - +b.getAttribute("cx");
  });

  // Store target radii, then set to 0
  const bubbleData = bubbles.map((el) => {
    const r = +el.getAttribute("r");
    el.setAttribute("r", 0);
    el.style.opacity = "0";
    return { el, targetR: r };
  });

  // Collect indicators, lines, labels — group by step, sort by bubble order
  const bubbleOrder = bubbles.map((b) => b.dataset.id);
  const orderIndex = {};
  bubbleOrder.forEach((id, i) => {
    orderIndex[id] = i;
  });

  const indicatorEls = [...svg.querySelectorAll(".draggable-indicator")];
  const lineEls = [...svg.querySelectorAll(".connection-line")];
  const labelEls = [...svg.querySelectorAll(".label-text")];

  // Sort all by their step's bubble order
  const sortByStep = (a, b) => {
    const ai = orderIndex[a.dataset.stepId] ?? 999;
    const bi = orderIndex[b.dataset.stepId] ?? 999;
    return ai - bi;
  };
  indicatorEls.sort(sortByStep);
  lineEls.sort(sortByStep);
  labelEls.sort(sortByStep);

  // Hide all indicators/lines/labels
  indicatorEls.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "scale(0)";
    el.style.transformOrigin = "center";
    el.style.transformBox = "fill-box";
  });
  lineEls.forEach((el) => {
    el.style.opacity = "0";
  });
  labelEls.forEach((el) => {
    el.style.opacity = "0";
  });

  const totalBubbleTime = bubbleDuration + bubbleStagger * (bubbles.length - 1);
  const phase2Start = totalBubbleTime + indicatorDelay;
  const maxSecondaryIndex =
    Math.max(indicatorEls.length, lineEls.length, labelEls.length, 1) - 1;
  const totalDuration =
    phase2Start + indicatorDuration + indicatorStagger * maxSecondaryIndex;

  const startTime = performance.now();

  const tick = (now) => {
    const elapsed = now - startTime;

    // Phase 1: bubbles
    bubbleData.forEach((bd, i) => {
      const delay = i * bubbleStagger;
      const localT = Math.min(
        Math.max((elapsed - delay) / bubbleDuration, 0),
        1,
      );
      const e = ease(localT);
      bd.el.setAttribute("r", bd.targetR * e);
      bd.el.style.opacity = String(Math.min(e * 1.4, 0.7));
    });

    // Phase 2: indicators, lines, labels
    if (elapsed > phase2Start) {
      const phase2Elapsed = elapsed - phase2Start;

      indicatorEls.forEach((el, i) => {
        const delay = i * indicatorStagger;
        const localT = Math.min(
          Math.max((phase2Elapsed - delay) / indicatorDuration, 0),
          1,
        );
        const e = ease(localT);
        el.style.opacity = String(e);
        el.style.transform = `scale(${e})`;
      });

      lineEls.forEach((el, i) => {
        const delay = i * indicatorStagger;
        const localT = Math.min(
          Math.max((phase2Elapsed - delay) / indicatorDuration, 0),
          1,
        );
        const e = ease(localT);
        el.style.opacity = String(e);
      });

      labelEls.forEach((el) => {
        // Match label to its indicator's stagger index via data attributes
        const key =
          el.dataset.stepId +
          "_" +
          el.dataset.taskType +
          "_" +
          el.dataset.taskIndex;
        const matchIdx = indicatorEls.findIndex(
          (ind) =>
            ind.dataset.stepId +
              "_" +
              ind.dataset.taskType +
              "_" +
              ind.dataset.taskIndex ===
            key,
        );
        const delay = (matchIdx >= 0 ? matchIdx : 0) * indicatorStagger;
        const localT = Math.min(
          Math.max((phase2Elapsed - delay) / indicatorDuration, 0),
          1,
        );
        const e = ease(localT);
        el.style.opacity = String(e);
      });
    }

    if (elapsed < totalDuration) {
      requestAnimationFrame(tick);
    } else {
      // Cleanup inline styles
      bubbleData.forEach((bd) => {
        bd.el.style.opacity = "";
      });
      indicatorEls.forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.transformBox = "";
      });
      lineEls.forEach((el) => {
        el.style.opacity = "";
      });
      labelEls.forEach((el) => {
        el.style.opacity = "";
      });
    }
  };

  requestAnimationFrame(tick);
}

/**
 * Capture numeric SVG attributes from all rendered elements, keyed by role + step id.
 *
 * @param {SVGElement|null} svg - The SVG element to snapshot.
 * @return {Object} Map of element keys to position data.
 */
function captureSnapshot(svg) {
  const snap = {};
  if (!svg) {
    return snap;
  }

  // Bubbles
  svg.querySelectorAll(".bubble").forEach((el) => {
    const id = el.dataset.id;
    snap["bubble_" + id] = {
      el,
      cx: +el.getAttribute("cx"),
      cy: +el.getAttribute("cy"),
      r: +el.getAttribute("r"),
      fill: el.getAttribute("fill"),
    };
  });

  // Connection lines
  svg.querySelectorAll(".connection-line").forEach((el) => {
    const key =
      "line_" +
      el.dataset.stepId +
      "_" +
      el.dataset.taskType +
      "_" +
      el.dataset.taskIndex;
    snap[key] = {
      el,
      x1: +el.getAttribute("x1"),
      y1: +el.getAttribute("y1"),
      x2: +el.getAttribute("x2"),
      y2: +el.getAttribute("y2"),
    };
  });

  // Indicators
  svg.querySelectorAll(".draggable-indicator").forEach((el) => {
    const key =
      "ind_" +
      el.dataset.stepId +
      "_" +
      el.dataset.taskType +
      "_" +
      el.dataset.taskIndex;
    const shape = el.querySelector("circle, rect, polygon");
    if (shape) {
      let cx, cy;
      if (shape.tagName === "circle") {
        cx = +shape.getAttribute("cx");
        cy = +shape.getAttribute("cy");
      } else if (shape.tagName === "rect") {
        cx = +shape.getAttribute("x") + +shape.getAttribute("width") / 2;
        cy = +shape.getAttribute("y") + +shape.getAttribute("height") / 2;
      } else if (shape.tagName === "polygon") {
        const pts = shape
          .getAttribute("points")
          .split(" ")
          .map((p) => p.split(",").map(Number));
        cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      }
      snap[key] = { el, cx, cy };
    }
  });

  // Labels
  svg.querySelectorAll(".label-text").forEach((el) => {
    const key =
      "label_" +
      el.dataset.stepId +
      "_" +
      el.dataset.taskType +
      "_" +
      el.dataset.taskIndex;
    snap[key] = { el, x: +el.getAttribute("x"), y: +el.getAttribute("y") };
  });

  return snap;
}

/**
 * Animate the transition between old and new SVG states.
 *
 * @param {HTMLElement} container    - The timeline container element.
 * @param {Object}      oldSnap     - Snapshot of old SVG positions.
 * @param {Set}         oldStepIds  - Set of step IDs from the old state.
 * @param {Array}       newSteps    - New step data array.
 * @param {Object}      phases      - Phase definitions.
 * @param {Object}      newSettings - New visual settings.
 * @param {string}      viewMode    - 'horizontal' or 'vertical'.
 * @param {Function}    onComplete  - Callback when animation finishes.
 */
function animateTransition(
  container,
  oldSnap,
  oldStepIds,
  newSteps,
  phases,
  newSettings,
  viewMode,
  onComplete,
) {
  // Render the new state
  renderTimeline(container, newSteps, phases, newSettings, viewMode);

  const newSvg = container.querySelector("svg");
  if (!newSvg) {
    onComplete();
    return;
  }

  const newSnap = captureSnapshot(newSvg);
  const newIds = new Set(newSteps.map((s) => s.id));
  const removedIds = [...oldStepIds].filter((id) => !newIds.has(id));

  const duration = 600;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const tweens = [];

  // --- Bubbles ---
  for (const key of Object.keys(newSnap)) {
    if (!key.startsWith("bubble_")) {
      continue;
    }
    const nw = newSnap[key];
    const ol = oldSnap[key];
    if (ol) {
      tweens.push({
        type: "bubble",
        el: nw.el,
        from: { cx: ol.cx, cy: ol.cy, r: ol.r },
        to: { cx: nw.cx, cy: nw.cy, r: nw.r },
      });
      nw.el.setAttribute("cx", ol.cx);
      nw.el.setAttribute("cy", ol.cy);
      nw.el.setAttribute("r", ol.r);
    } else {
      tweens.push({
        type: "bubble-enter",
        el: nw.el,
        to: { cx: nw.cx, cy: nw.cy, r: nw.r },
      });
      nw.el.setAttribute("r", 0);
      nw.el.style.opacity = "0";
    }
  }

  // --- Lines ---
  for (const key of Object.keys(newSnap)) {
    if (!key.startsWith("line_")) {
      continue;
    }
    const nw = newSnap[key];
    const ol = oldSnap[key];
    if (ol) {
      tweens.push({
        type: "line",
        el: nw.el,
        from: { x1: ol.x1, y1: ol.y1, x2: ol.x2, y2: ol.y2 },
        to: { x1: nw.x1, y1: nw.y1, x2: nw.x2, y2: nw.y2 },
      });
      nw.el.setAttribute("x1", ol.x1);
      nw.el.setAttribute("y1", ol.y1);
      nw.el.setAttribute("x2", ol.x2);
      nw.el.setAttribute("y2", ol.y2);
    } else {
      tweens.push({ type: "fade-in", el: nw.el });
      nw.el.style.opacity = "0";
    }
  }

  // --- Indicators ---
  for (const key of Object.keys(newSnap)) {
    if (!key.startsWith("ind_")) {
      continue;
    }
    const nw = newSnap[key];
    const ol = oldSnap[key];
    if (ol && nw.cx != null && ol.cx != null) {
      const dx = nw.cx - ol.cx;
      const dy = nw.cy - ol.cy;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        tweens.push({
          type: "indicator",
          el: nw.el,
          from: { dx: -dx, dy: -dy },
          to: { dx: 0, dy: 0 },
        });
        nw.el.setAttribute("transform", `translate(${-dx}, ${-dy})`);
      }
    } else {
      tweens.push({ type: "fade-in", el: nw.el });
      nw.el.style.opacity = "0";
    }
  }

  // --- Labels ---
  for (const key of Object.keys(newSnap)) {
    if (!key.startsWith("label_")) {
      continue;
    }
    const nw = newSnap[key];
    const ol = oldSnap[key];
    if (ol) {
      const dx = nw.x - ol.x;
      const dy = nw.y - ol.y;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        tweens.push({
          type: "label",
          el: nw.el,
          from: { dx: -dx, dy: -dy },
          to: { dx: 0, dy: 0 },
          existingTransform: nw.el.getAttribute("transform") || "",
        });
      }
    } else {
      tweens.push({ type: "fade-in", el: nw.el });
      nw.el.style.opacity = "0";
    }
  }

  // --- Ghost elements for removed bubbles ---
  removedIds.forEach((id) => {
    const oldBubble = oldSnap["bubble_" + id];
    if (oldBubble) {
      const ghost = document.createElementNS(SVG_NS, "circle");
      ghost.setAttribute("cx", oldBubble.cx);
      ghost.setAttribute("cy", oldBubble.cy);
      ghost.setAttribute("r", oldBubble.r);
      ghost.setAttribute("fill", oldBubble.fill || "#999");
      ghost.style.opacity = "0.7";
      newSvg.appendChild(ghost);
      tweens.push({
        type: "bubble-exit",
        el: ghost,
        from: { r: oldBubble.r },
      });
    }

    // Ghost lines for removed steps
    for (const key of Object.keys(oldSnap)) {
      if (key.startsWith("line_" + id + "_")) {
        const ol = oldSnap[key];
        const ghostLine = document.createElementNS(SVG_NS, "line");
        ghostLine.setAttribute("x1", ol.x1);
        ghostLine.setAttribute("y1", ol.y1);
        ghostLine.setAttribute("x2", ol.x2);
        ghostLine.setAttribute("y2", ol.y2);
        ghostLine.setAttribute("stroke", ol.el.getAttribute("stroke"));
        ghostLine.setAttribute(
          "stroke-width",
          ol.el.getAttribute("stroke-width"),
        );
        const dash = ol.el.getAttribute("stroke-dasharray");
        if (dash) {
          ghostLine.setAttribute("stroke-dasharray", dash);
        }
        newSvg.appendChild(ghostLine);
        tweens.push({ type: "fade-out", el: ghostLine });
      }
    }
  });

  // --- Animation loop ---
  const startTime = performance.now();

  const tick = (now) => {
    const elapsed = now - startTime;
    const rawT = Math.min(elapsed / duration, 1);
    const t = easeInOut(rawT);

    for (const tw of tweens) {
      switch (tw.type) {
        case "bubble": {
          tw.el.setAttribute("cx", tw.from.cx + (tw.to.cx - tw.from.cx) * t);
          tw.el.setAttribute("cy", tw.from.cy + (tw.to.cy - tw.from.cy) * t);
          tw.el.setAttribute("r", tw.from.r + (tw.to.r - tw.from.r) * t);
          break;
        }
        case "bubble-enter": {
          tw.el.setAttribute("r", tw.to.r * t);
          tw.el.style.opacity = String(t * 0.7);
          break;
        }
        case "bubble-exit": {
          tw.el.setAttribute("r", Math.max(0, tw.from.r * (1 - t)));
          tw.el.style.opacity = String((1 - t) * 0.7);
          break;
        }
        case "line": {
          tw.el.setAttribute("x1", tw.from.x1 + (tw.to.x1 - tw.from.x1) * t);
          tw.el.setAttribute("y1", tw.from.y1 + (tw.to.y1 - tw.from.y1) * t);
          tw.el.setAttribute("x2", tw.from.x2 + (tw.to.x2 - tw.from.x2) * t);
          tw.el.setAttribute("y2", tw.from.y2 + (tw.to.y2 - tw.from.y2) * t);
          break;
        }
        case "indicator": {
          const dx = tw.from.dx + (tw.to.dx - tw.from.dx) * t;
          const dy = tw.from.dy + (tw.to.dy - tw.from.dy) * t;
          tw.el.setAttribute("transform", `translate(${dx}, ${dy})`);
          break;
        }
        case "label": {
          const dx = tw.from.dx + (tw.to.dx - tw.from.dx) * t;
          const dy = tw.from.dy + (tw.to.dy - tw.from.dy) * t;
          tw.el.setAttribute(
            "transform",
            `translate(${dx}, ${dy}) ${tw.existingTransform}`,
          );
          break;
        }
        case "fade-in": {
          tw.el.style.opacity = String(t);
          break;
        }
        case "fade-out": {
          tw.el.style.opacity = String(1 - t);
          break;
        }
      }
    }

    if (rawT < 1) {
      requestAnimationFrame(tick);
    } else {
      // Cleanup
      for (const tw of tweens) {
        if (tw.type === "bubble-exit" || tw.type === "fade-out") {
          tw.el.remove();
        }
        if (tw.type === "indicator") {
          tw.el.removeAttribute("transform");
        }
        if (tw.type === "label") {
          tw.el.setAttribute("transform", tw.existingTransform);
        }
        if (tw.type === "bubble-enter" || tw.type === "fade-in") {
          tw.el.style.opacity = "";
        }
      }
      onComplete();
    }
  };

  requestAnimationFrame(tick);
}

function initBlock(block) {
  const container = block.querySelector(".ppt-timeline-container");
  if (!container) {
    return;
  }

  // Parse data from attributes
  let steps, phases, settings, versions, responsive;
  try {
    steps = JSON.parse(block.dataset.steps || "[]");
    phases = JSON.parse(block.dataset.phases || "{}");
    settings = JSON.parse(block.dataset.settings || "{}");
    versions = JSON.parse(block.dataset.versions || "{}");
    responsive = JSON.parse(block.dataset.responsive || "{}");
  } catch {
    return;
  }

  const breakpoint = responsive.breakpoint || 768;
  const mobileLayout = responsive.mobileLayout || "vertical";
  const desktopLayout = responsive.desktopLayout || "horizontal";

  let currentView =
    window.innerWidth <= breakpoint ? mobileLayout : desktopLayout;
  let currentSteps = steps;
  let currentSettings = settings;
  let activeVersion = "";
  let isAnimating = false;

  // Render function (no animation)
  const render = () => {
    renderTimeline(
      container,
      currentSteps,
      phases,
      currentSettings,
      currentView,
    );
    updateUI();
  };

  // Update button states without re-rendering
  const updateUI = () => {
    const wrapper = block.querySelector(".ppt-timeline-wrapper");
    if (wrapper) {
      wrapper.classList.remove(
        "ppt-timeline-wrapper--horizontal",
        "ppt-timeline-wrapper--vertical",
      );
      wrapper.classList.add(`ppt-timeline-wrapper--${currentView}`);
    }

    block.querySelectorAll(".ppt-view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === currentView);
    });

    block.querySelectorAll(".ppt-version-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.version === activeVersion);
    });
  };

  // Animated render for version switching
  const renderAnimated = (newSteps, newSettings) => {
    if (isAnimating) {
      return;
    }
    isAnimating = true;

    // Capture old state before re-render
    const oldSvg = container.querySelector("svg");
    const oldSnap = captureSnapshot(oldSvg);
    const oldStepIds = new Set(currentSteps.map((s) => s.id));

    // Update current data
    currentSteps = newSteps;
    currentSettings = newSettings;

    // Animate the transition
    animateTransition(
      container,
      oldSnap,
      oldStepIds,
      currentSteps,
      phases,
      currentSettings,
      currentView,
      () => {
        isAnimating = false;
      },
    );

    updateUI();
  };

  // View toggle buttons
  block.querySelectorAll(".ppt-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      render();

      block.dispatchEvent(
        new CustomEvent("ppt:viewChange", {
          detail: { view: currentView },
          bubbles: true,
        }),
      );
    });
  });

  // Build version buttons
  const versionContainer = block.querySelector(".ppt-version-buttons");
  if (versionContainer && Object.keys(versions).length > 0) {
    Object.keys(versions).forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "ppt-version-btn";
      btn.textContent = name;
      btn.dataset.version = name;
      btn.addEventListener("click", () => {
        const v = versions[name];
        if (!v) {
          return;
        }
        activeVersion = name;
        const newSettings = v.settings ? v.settings : currentSettings;
        renderAnimated(v.steps, newSettings);

        block.dispatchEvent(
          new CustomEvent("ppt:versionChange", {
            detail: { version: name },
            bubbles: true,
          }),
        );
      });
      versionContainer.appendChild(btn);
    });
  }

  // Responsive: switch layout on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newView =
        window.innerWidth <= breakpoint ? mobileLayout : desktopLayout;
      if (newView !== currentView) {
        currentView = newView;
        render();

        block.dispatchEvent(
          new CustomEvent("ppt:responsiveChange", {
            detail: { view: currentView, width: window.innerWidth },
            bubbles: true,
          }),
        );
      }
    }, 150);
  });

  // Expose API for external JS
  block.pptTimeline = {
    setView(view) {
      if (view === "horizontal" || view === "vertical") {
        currentView = view;
        render();
      }
    },
    loadVersion(name) {
      const v = versions[name];
      if (v) {
        activeVersion = name;
        const newSettings = v.settings ? v.settings : currentSettings;
        renderAnimated(v.steps, newSettings);
      }
    },
    getView() {
      return currentView;
    },
    getActiveVersion() {
      return activeVersion;
    },
  };

  // Initial render — with optional entry animation via IntersectionObserver
  const entryEnabled = currentSettings.entryAnimation !== false;
  let hasAnimatedEntry = false;

  if (entryEnabled && typeof IntersectionObserver !== "undefined") {
    const threshold = currentSettings.entryAnimationThreshold ?? 0.5;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedEntry) {
            hasAnimatedEntry = true;
            observer.disconnect();
            render();
            playEntryAnimation(container, currentSettings, currentView);
          }
        });
      },
      { threshold },
    );
    observer.observe(block);
    // Render hidden initially so the block takes up space
    render();
    const svg = container.querySelector("svg");
    if (svg) {
      svg.style.opacity = "0";
    }
  } else {
    render();
  }
}

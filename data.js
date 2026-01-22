// Timeline Steps: Bubbles are always centered on the timeline (y=0)
// Each step can have 'preface' (top/left) and 'client' (bottom/right) tasks
// y positions for labels are offsets from the center line
// anchor: -1 (left/top) to 1 (right/bottom) shift on bubble circumference

const TIMELINE_STEPS = [
  // CONTACT Phase
  {
    id: 'step-1', phase: 'contact', x: 2, size: 2,
    preface: { label: 'Intro Meeting', lineX: 2, lineY: -7, anchor: 0 },
    client: { label: 'Needs Assessment', lineX: 2, lineY: 7, anchor: 0 }
  },

  // DISCOVERY Phase
  {
    id: 'step-2', phase: 'discovery', x: 7, size: 2,
    preface: { label: 'Research', lineX: 6, lineY: -8, anchor: -0.5 },
    client: { label: 'Needs Assessment\nFeedback', lineX: 6, lineY: 7, anchor: -0.3 }
  },
  {
    id: 'step-3', phase: 'discovery', x: 9, size: 2,
    client: { label: 'Draft\nIdeas', lineX: 9, lineY: 8, anchor: 0 }
  },
  {
    id: 'step-4', phase: 'discovery', x: 10, size: 2,
    preface: { label: 'Site Map\nWireframes', lineX: 10, lineY: -7.5, anchor: 0 }
  },
  {
    id: 'step-5', phase: 'discovery', x: 13, size: 2,
    preface: { label: 'UX Position\nBrand', lineX: 13, lineY: -8.5, anchor: 0 }
  },

  // CONTENT Phase
  {
    id: 'step-6', phase: 'content', x: 15.5, size: 2,
    client: { label: 'UX Design +\nWireframes\nReview', lineX: 15, lineY: 8, anchor: -0.2 }
  },
  {
    id: 'step-7', phase: 'content', x: 17, size: 2,
    preface: { label: 'Template Pages\nUI Design', lineX: 17, lineY: -8.5, anchor: 0 }
  },
  {
    id: 'step-8', phase: 'content', x: 19, size: 2,
    client: { label: 'Template Pages\nUI Design Review', lineX: 19, lineY: 8.5, anchor: 0 }
  },
  {
    id: 'step-9', phase: 'content', x: 20.5, size: 2,
    preface: { label: 'Build\nReal CSS Theme\nPrototype', lineX: 21, lineY: -7.5, anchor: 0.2 }
  },

  // CODING Phase
  {
    id: 'step-10', phase: 'coding', x: 23, size: 2,
    client: { label: 'Prototype\nFeedback', lineX: 23, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-11', phase: 'coding', x: 25, size: 3,
    preface: { label: 'Front & Backend\nCoding', lineX: 25, lineY: -8, anchor: 0 }
  },
  {
    id: 'step-12', phase: 'coding', x: 27, size: 2,
    client: { label: 'Build\nReview', lineX: 27, lineY: 8, anchor: 0 }
  },
  {
    id: 'step-13', phase: 'coding', x: 29, size: 2,
    preface: { label: 'Testing &\nWordPress', lineX: 29.5, lineY: -7, anchor: 0.2 }
  },

  // LAUNCH Phase
  {
    id: 'step-14', phase: 'launch', x: 31, size: 2,
    client: { label: 'Final Review', lineX: 31, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-15', phase: 'launch', x: 33, size: 2,
    preface: { label: 'Cross Platform\nBrowser Testing', lineX: 33, lineY: -8, anchor: 0 }
  },
  {
    id: 'step-16', phase: 'launch', x: 34.5, size: 2,
    client: { label: 'Approval\n+ Launch', lineX: 35, lineY: 8, anchor: 0.2 }
  },
  {
    id: 'step-17', phase: 'launch', x: 36, size: 2,
    preface: { label: 'SEO\nWebmaster\nTools', lineX: 36.5, lineY: -7, anchor: 0.2 }
  },

  // SUPPORT Phase
  {
    id: 'step-18', phase: 'support', x: 38, size: 2,
    client: { label: 'Monitoring\nReporting', lineX: 38, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-19', phase: 'support', x: 40, size: 2,
    preface: { label: 'Search Engine\nOptimization', lineX: 40, lineY: -7.5, anchor: 0 }
  },
  {
    id: 'step-20', phase: 'support', x: 42, size: 2,
    client: { label: 'Minor Bug\nFixes & Content\nUpdates', lineX: 42, lineY: 8.5, anchor: 0 }
  },
  {
    id: 'step-21', phase: 'support', x: 43.5, size: 2,
    preface: { label: 'Ongoing\nMaintenance/Content', lineX: 43.5, lineY: -7, anchor: 0 }
  },
  {
    id: 'step-22', phase: 'support', x: 45.5, size: 2,
    client: { label: 'Ongoing Hosting\nSupport & Consultation', lineX: 45.5, lineY: 7.5, anchor: 0 }
  }
];

// Phase Definitions
const PHASES = {
  contact: { name: 'CONTACT', color: '#e63946' },
  discovery: { name: 'DISCOVERY', color: '#f4a261' },
  content: { name: 'CONTENT', color: '#e9c46a' },
  uxue: { name: 'UX/UE', color: '#8ac926' },
  coding: { name: 'CODING', color: '#43aa8b' },
  launch: { name: 'LAUNCH', color: '#e879a0' },
  support: { name: 'SUPPORT', color: '#adb5bd' }
};

// Create legacy BUBBLES array for compatibility if needed, 
// though app.js will be updated to use TIMELINE_STEPS directly.
window.TIMELINE_STEPS = TIMELINE_STEPS;
window.PHASES = PHASES;

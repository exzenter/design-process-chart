// Timeline Steps: Bubbles are always centered on the timeline (y=0)
// Each step can have 'descriptions': array of label objects
// lineY < 0 = above bubble, lineY > 0 = below bubble
// anchor: -1 (left) to 1 (right) shift on bubble circumference

const TIMELINE_STEPS = [
  {
    id: 'step-1', phase: 'contact', x: 2, size: 2,
    descriptions: [
      { label: 'Intro Meeting', fontSize: 'M', fontWeight: 'regular', lineX: 2, lineY: -7, anchor: 0 },
      { label: 'Needs Assessment', fontSize: 'M', fontWeight: 'regular', lineX: 2, lineY: 7, anchor: 0 }
    ]
  },
  {
    id: 'step-2', phase: 'discovery', x: 7, size: 2,
    descriptions: [
      { label: 'Research', fontSize: 'M', fontWeight: 'regular', lineX: 6, lineY: -8, anchor: -0.5 },
      { label: 'Needs Assessment\nFeedback', fontSize: 'M', fontWeight: 'regular', lineX: 6, lineY: 7, anchor: -0.3 }
    ]
  },
  {
    id: 'step-3', phase: 'discovery', x: 9, size: 2,
    descriptions: { label: 'Draft\nIdeas', fontSize: 'M', fontWeight: 'regular', lineX: 9, lineY: 8, anchor: 0 }
  },
  {
    id: 'step-4', phase: 'discovery', x: 10.7, size: 100,
    descriptions: { label: 'Site Map\nWireframes', fontSize: 'M', fontWeight: 'regular', lineX: 10, lineY: -7.5, anchor: 0 }
  },
  {
    id: 'step-5', phase: 'discovery', x: 13.1, size: 53,
    descriptions: { label: 'UX Position\nBrand', fontSize: 'M', fontWeight: 'regular', lineX: 13, lineY: -8.5, anchor: 0 }
  },
  {
    id: 'step-6', phase: 'content', x: 15.6, size: 29.5,
    descriptions: { label: 'UX Design +\nWireframes\nReview', fontSize: 'M', fontWeight: 'regular', lineX: 15, lineY: 8, anchor: -0.2 }
  },
  {
    id: 'step-7', phase: 'content', x: 17, size: 17,
    descriptions: { label: 'Template Pages\nUI Design', fontSize: 'M', fontWeight: 'regular', lineX: 17, lineY: -8.5, anchor: 0 }
  },
  {
    id: 'step-8', phase: 'content', x: 18.8, size: 27.5,
    descriptions: { label: 'Template Pages\nUI Design Review', fontSize: 'M', fontWeight: 'regular', lineX: 19, lineY: 8.5, anchor: 0 }
  },
  {
    id: 'step-9', phase: 'content', x: 21.1, size: 18,
    descriptions: { label: 'Build\nReal CSS Theme\nPrototype', fontSize: 'M', fontWeight: 'regular', lineX: 21, lineY: -7.5, anchor: 0.2 }
  },
  {
    id: 'step-10', phase: 'coding', x: 23.2, size: 35,
    descriptions: { label: 'Prototype\nFeedback', fontSize: 'M', fontWeight: 'regular', lineX: 23, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-11', phase: 'coding', x: 25.4, size: 12.5,
    descriptions: { label: 'Front & Backend\nCoding', fontSize: 'M', fontWeight: 'regular', lineX: 25, lineY: -8, anchor: 0 }
  },
  {
    id: 'step-12', phase: 'coding', x: 27.2, size: 17,
    descriptions: { label: 'Build\nReview', fontSize: 'M', fontWeight: 'regular', lineX: 27, lineY: 8, anchor: 0 }
  },
  {
    id: 'step-13', phase: 'coding', x: 29.3, size: 41,
    descriptions: { label: 'Testing &\nWordPress', fontSize: 'M', fontWeight: 'black', lineX: 29.1, lineY: -5.6, anchor: 0.64 }
  },
  {
    id: 'step-14', phase: 'launch', x: 31.1, size: 2,
    descriptions: { label: 'Final Review', fontSize: 'M', fontWeight: 'regular', lineX: 31, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-15', phase: 'launch', x: 32.9, size: 49,
    descriptions: { label: 'Cross Platform\nBrowser Testing', fontSize: '3XL', fontWeight: 'regular', lineX: 33, lineY: -8, anchor: 0 }
  },
  {
    id: 'step-16', phase: 'launch', x: 35, size: 68.5,
    descriptions: { label: 'Approval\n+ Launch', fontSize: 'M', fontWeight: 'regular', lineX: 35, lineY: 8, anchor: 0.2 }
  },
  {
    id: 'step-17', phase: 'launch', x: 37.5, size: 34,
    descriptions: { label: 'SEO\nWebmaster\nTools', fontSize: '4XL', fontWeight: 'light', lineX: 36.4, lineY: -5.6, anchor: 0.2 }
  },
  {
    id: 'step-18', phase: 'support', x: 39.3, size: 12.5,
    descriptions: { label: 'Monitoring\nReporting', fontSize: 'M', fontWeight: 'regular', lineX: 38, lineY: 7.5, anchor: 0 }
  },
  {
    id: 'step-19', phase: 'support', x: 40.9, size: 32.5,
    descriptions: { label: 'Search Engine\nOptimization', fontSize: 'M', fontWeight: 'regular', lineX: 40, lineY: -7.5, anchor: 0 }
  },
  {
    id: 'step-20', phase: 'support', x: 41.1, size: 6.5,
    descriptions: { label: 'Minor Bug\nFixes & Content\nUpdates', fontSize: 'M', fontWeight: 'regular', lineX: 42, lineY: 8.5, anchor: 0 }
  },
  {
    id: 'step-21', phase: 'support', x: 43.7, size: 34.5,
    descriptions: { label: 'Ongoing\nMaintenance/Content', fontSize: 'M', fontWeight: 'regular', lineX: 43.5, lineY: -7, anchor: 0 }
  },
  {
    id: 'step-22', phase: 'support', x: 45.5, size: 2,
    descriptions: { label: 'Ongoing Hosting\nSupport & Consultation', fontSize: 'M', fontWeight: 'regular', lineX: 45.5, lineY: 7.5, anchor: 0 }
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

window.TIMELINE_STEPS = TIMELINE_STEPS;
window.PHASES = PHASES;

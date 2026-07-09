import { Group } from '../types';

export const PROGRAM_VERSION = 2;

const ORIENTATION_GROUPS: Group[] = [
  { id: 'orientation', name: 'Orientation', required: 12, category: 'orientation', completed: 0 },
];

const CLINICAL_GROUPS: Group[] = [
  { id: 'cbisa', name: 'CBISA', required: 24, category: 'clinical', completed: 0 },
  { id: 'healthy-relationships', name: 'Healthy Relationships', required: 16, category: 'clinical', completed: 0 },
  { id: 'rebt', name: 'REBT', required: 24, category: 'clinical', completed: 0 },
  { id: 'living-in-balance', name: 'Living In Balance', required: 24, category: 'clinical', completed: 0 },
  { id: 'seeking-safety', name: 'Seeking Safety', required: 21, category: 'clinical', completed: 0 },
  { id: 'self-discovery-identity', name: 'Self Discovery & Identity', required: 24, category: 'clinical', completed: 0 },
  { id: 'sedona-method', name: 'Sedona Method', required: 5, category: 'clinical', completed: 0 },
  { id: 'positive-parenting', name: 'Positive Parenting', required: 8, category: 'clinical', completed: 0 },
];

const SUPPORT_GROUPS: Group[] = [
  { id: 'vocational', name: 'Vocational', required: 1, category: 'support', completed: 0 },
  { id: 'career-training', name: 'Career Training', required: 3, category: 'support', completed: 0 },
  { id: 'housing', name: 'Housing', required: 4, category: 'support', completed: 0 },
  { id: 'employment-group', name: 'Employment Group', required: 35, category: 'support', completed: 0 },
];

const ALL_GROUPS: Group[] = [
  ...ORIENTATION_GROUPS,
  ...CLINICAL_GROUPS,
  ...SUPPORT_GROUPS,
];

// Return a fresh copy of all groups (shallow clone to avoid mutation)
export function getAllGroups(): Group[] {
  return ALL_GROUPS.map(g => ({ ...g }));
}

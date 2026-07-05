export interface Group {
  id: string;
  name: string;
  required: number;
  category: GroupCategory;
  completed: number;
  recurring?: boolean;
  note?: string;
  custom?: boolean;
  time?: string;
}

export type GroupCategory = 'orientation' | 'clinical' | 'mandatory' | 'after30' | 'support' | 'other';

export interface Category {
  id: GroupCategory;
  label: string;
  icon: React.ComponentType;
}

export interface CheckIn {
  groupId: string;
  date: string;
  notes: string;
  timestamp: number;
  signature: string | null;
}

export interface CheckInsRecord {
  [key: string]: CheckIn;
}

export interface Settings {
  startDate: string;
  notifications: boolean;
  programStartDate: string;
  lastPassDate: string | null;
  passHistory: string[];
  passHistoryLabels?: string[];
  reminderTime: string;
  reminderDays: number[];
}

export interface ExportData {
  program: Group[];
  checkIns: CheckInsRecord;
  settings: Settings;
  exportDate: string;
}

export type Page = 'dashboard' | 'review' | 'settings' | 'calendar' | `groups-${string}`;

export interface Toast {
  id: string;
  message: string;
  undoHandler?: () => void;
}

export interface ImportValidation {
  valid: boolean;
  errors: string[];
}

export interface PassStatus {
  daysSinceStart: number;
  daysUntilNextPass: number;
  nextPassDate: string | null;
  eligible: boolean;
  settings: Settings | null;
}

export interface CategoryAnalytics extends Category {
  required: number;
  completed: number;
  pct: number;
  isRecurring: boolean;
  groups: Group[];
}

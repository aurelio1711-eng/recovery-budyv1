import { Category } from '../types';
import { OrientationIcon, ClinicalIcon, After30Icon, SupportIcon, PlusIcon } from '../components/Icons';

// Category definitions used for tab navigation and filtering throughout the app
export const CATEGORIES: Category[] = [
  { id: 'orientation', label: 'Orientation Groups', icon: OrientationIcon },
  { id: 'clinical', label: 'Clinical Groups', icon: ClinicalIcon },
  { id: 'after30', label: 'After 30 Days', icon: After30Icon },
  { id: 'support', label: 'Support Groups', icon: SupportIcon },
  { id: 'other', label: 'Other Groups', icon: PlusIcon },
];

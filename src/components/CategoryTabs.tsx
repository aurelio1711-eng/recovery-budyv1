import { memo } from 'react';
import { m } from 'motion/react';
import { CheckIcon } from './Icons';
import type { Group, Category } from '../types';

interface Props {
  categories: Category[];
  activeCategory: string;
  onChange: (id: string) => void;
  groups: Group[];
}

const CategoryTabs = memo(function CategoryTabs({ categories, activeCategory, onChange, groups }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 pb-1">
      {categories.map(cat => {
        const count = groups.filter(g => g.category === cat.id).length;
        const completed = groups.filter(g => g.category === cat.id && g.completed > 0).length;
        const isActive = activeCategory === cat.id;
        return (
          <m.button
            key={cat.id}
            className={`relative flex items-center justify-center rounded-[var(--radius-sm)] cursor-pointer border-none transition-all duration-200 ${isActive ? 'bg-primary text-white px-3 py-2 gap-1.5' : 'bg-surface border border-border text-text-secondary hover:bg-hover-bg w-10 h-10'}`}
            onClick={() => onChange(cat.id)}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <m.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-[var(--radius-sm)] bg-primary -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span aria-hidden="true" className="shrink-0">{typeof cat.icon === 'function' ? <cat.icon /> : cat.icon}</span>
            {isActive && (
              <m.span
                className="text-xs font-medium whitespace-nowrap overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {cat.label} ({count})
                {completed > 0 && <span className="ml-1 inline-flex items-center gap-0.5"><CheckIcon />{completed}</span>}
              </m.span>
            )}
            {!isActive && count > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-white text-[0.5rem] font-bold rounded-full flex items-center justify-center leading-none">{count}</span>
            )}
          </m.button>
        );
      })}
    </div>
  );
});

export default CategoryTabs;

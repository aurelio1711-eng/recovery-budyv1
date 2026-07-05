import { useState } from 'react';
import { m } from 'motion/react';
import CategoryTabs from './CategoryTabs';
import GroupCard from './GroupCard';
import DailyCheckIn from './DailyCheckIn';
import { PlusIcon } from './Icons';
import { CATEGORIES } from '../data/categories';
import { getAllGroups } from '../data/programData';
import { getToday } from '../services/nycTime';
import { saveProgram } from '../services/storage';
import type { Group, Category } from '../types';

interface GroupsPageProps {
  groups: Group[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onGroupCheckIn: (group: Group) => void;
  onGroupCheckOut: (groupId: string) => void;
  canGroupCheckIn: (group: Group) => boolean;
  onGroupAdd: (group: Group) => void;
}

const spring = { type: 'spring' as const, stiffness: 150, damping: 18, mass: 0.8 };

export default function GroupsPage({ groups, activeCategory, onCategoryChange, onGroupCheckIn, onGroupCheckOut, canGroupCheckIn, onGroupAdd }: GroupsPageProps) {
  const filteredGroups = groups.filter(g => g.category === activeCategory);
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTime, setNewGroupTime] = useState('');
  const [newGroupNotes, setNewGroupNotes] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: `custom-${Date.now()}`,
      name: newGroupName.trim(),
      required: 999,
      category: 'other',
      completed: 0,
      recurring: true,
      custom: true,
      time: newGroupTime || undefined,
      note: newGroupNotes || undefined,
    };
    onGroupAdd(newGroup);
    setShowAddGroup(false);
    setNewGroupName('');
    setNewGroupTime('');
    setNewGroupNotes('');
    setSignature(null);
  };

  const isOtherCategory = activeCategory === 'other';

  return (
    <m.div
      className="max-w-[900px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <h1 className="font-heading text-xl font-bold text-text mb-4">{currentCat?.label || 'Groups'}</h1>

      <CategoryTabs
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onChange={onCategoryChange}
        groups={groups}
      />

      <m.section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {filteredGroups.map((group, i) => (
          <GroupCard
            key={group.id}
            group={group}
            index={i}
            onCheckIn={() => onGroupCheckIn(group)}
            onCheckOut={() => onGroupCheckOut(group.id)}
            canCheckIn={canGroupCheckIn(group)}
          />
        ))}
        {isOtherCategory && (
          <>
            {showAddGroup ? (
              <m.div
                key="add-group-form"
                className="col-span-full bg-surface border border-border rounded-[var(--radius-md)] p-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
              >
                <div className="flex flex-col gap-3">
                  <h3 className="font-heading text-sm font-semibold text-text">Add Custom Group</h3>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="custom-group-name" className="text-sm font-medium text-text">Group Title</label>
                    <input
                      id="custom-group-name"
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Personal Therapy, Meditation Group"
                      className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body focus-visible:outline-2 focus-visible:outline-primary"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="custom-group-time" className="text-sm font-medium text-text">Time (optional)</label>
                    <input
                      id="custom-group-time"
                      type="time"
                      value={newGroupTime}
                      onChange={(e) => setNewGroupTime(e.target.value)}
                      className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="custom-group-notes" className="text-sm font-medium text-text">Notes (optional)</label>
                    <textarea
                      id="custom-group-notes"
                      value={newGroupNotes}
                      onChange={(e) => setNewGroupNotes(e.target.value)}
                      placeholder="Notes about this group..."
                      rows={2}
                      className="text-sm px-3 py-2 rounded-[var(--radius-sm)] border border-border-input bg-background text-text font-body resize-vertical focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Signature</label>
                    {signature ? (
                      <div className="flex items-center gap-3">
                        <img src={signature} alt="Signature" className="h-10 border border-border rounded-[var(--radius-sm)]" />
                        <button
                          className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150"
                          onClick={() => setSignature(null)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        className="w-full py-2.5 px-5 border-2 border-dashed border-border rounded-[var(--radius-sm)] bg-transparent cursor-pointer text-text-secondary font-semibold text-sm font-body transition-all duration-200 hover:border-primary"
                        onClick={() => setShowSignature(true)}
                      >
                        + Add Signature
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-transparent border border-border text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150"
                      onClick={() => { setShowAddGroup(false); setShowSignature(false); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150"
                      onClick={handleAddGroup}
                      disabled={!newGroupName.trim()}
                    >
                      Add Group
                    </button>
                  </div>
                </div>
              </m.div>
            ) : (
              <m.button
                key="add-group-btn"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-[var(--radius-md)] bg-transparent cursor-pointer text-text-secondary font-semibold text-sm font-body transition-all duration-200 hover:border-primary hover:text-primary min-h-[120px]"
                onClick={() => setShowAddGroup(true)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
              >
                <PlusIcon />
                <span>Add Custom Group</span>
              </m.button>
            )}
          </>
        )}
      </m.section>
      {showSignature && (
        <DailyCheckIn
          group={{ id: 'temp', name: newGroupName || 'Custom Group', required: 999, category: 'other', completed: 0, recurring: true, custom: true }}
          onSubmit={(groupId, date, notes, sig) => {
            setSignature(sig);
            setShowSignature(false);
          }}
          onClose={() => setShowSignature(false)}
        />
      )}
    </m.div>
  );
}
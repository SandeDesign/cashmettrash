// src/components/common/CollapsibleSection.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--cmt-border)', background: 'var(--cmt-surface)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-black/[0.02]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {icon && <span style={{ color: 'var(--cmt-accent)' }}>{icon}</span>}
          <span className="font-semibold text-sm" style={{ color: 'var(--cmt-ink)' }}>
            {title}
          </span>
          {badge}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--cmt-ink-muted)' }}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-4" style={{ borderTop: '1px solid var(--cmt-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;

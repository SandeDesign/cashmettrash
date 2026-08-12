// src/components/shared/Loading.tsx
import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<LoadingProps['size']>, string> = {
  sm: '1.25rem',
  md: '2rem',
  lg: '3rem',
};

const Loading: React.FC<LoadingProps> = ({ text = 'Laden...', size = 'md' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-6">
    <span
      className="cmt-spinner"
      style={{ width: SIZES[size], height: SIZES[size] }}
      role="status"
      aria-label={text}
    />
    {text && <p style={{ color: 'var(--cmt-ink-muted)' }} className="text-sm">{text}</p>}
  </div>
);

export default Loading;

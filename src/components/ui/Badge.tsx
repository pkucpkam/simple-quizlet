import React from 'react';

type BadgeVariant = 'official' | 'private' | 'admin' | 'neutral' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  official: 'bg-claude-info text-white',
  private: 'bg-claude-border text-claude-text-2 border border-claude-border-strong',
  admin: 'bg-claude-accent-light text-claude-accent border border-claude-accent/20',
  neutral: 'bg-claude-surface-2 text-claude-text-2 border border-claude-border',
  success: 'bg-claude-success-light text-claude-success border border-green-200',
  warning: 'bg-claude-accent-light text-claude-accent border border-amber-200',
  error: 'bg-claude-error-light text-claude-error border border-red-200',
  info: 'bg-claude-info-light text-claude-info border border-blue-200',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '', size = 'sm' }) => (
  <span
    className={[
      'inline-flex items-center font-semibold uppercase tracking-wider rounded-full',
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      variantStyles[variant],
      className,
    ].join(' ')}
  >
    {children}
  </span>
);

export default Badge;

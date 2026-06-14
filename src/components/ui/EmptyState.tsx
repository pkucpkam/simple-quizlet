import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}


const DefaultIcon = () => (
  <FolderOpen className="h-10 w-10 text-claude-text-3" strokeWidth={1.2} />
);

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
    <div className="mb-4 p-4 rounded-full bg-claude-surface-2 border border-claude-border">
      {icon || <DefaultIcon />}
    </div>
    <h3 className="text-base font-semibold text-claude-text mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-claude-text-2 mb-6 max-w-sm">{description}</p>
    )}
    {action && (
      <Button variant="primary" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

export default EmptyState;

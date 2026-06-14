import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, suffix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-claude-text">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-claude-text-3 flex-shrink-0 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-claude-surface border rounded-claude text-sm text-claude-text placeholder:text-claude-text-3',
              'focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-claude-surface-2',
              error
                ? 'border-claude-error focus:ring-claude-error'
                : 'border-claude-border hover:border-claude-border-strong',
              icon ? 'pl-9' : 'px-3',
              suffix ? 'pr-10' : 'pr-3',
              'py-2',
              className,
            ].join(' ')}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-claude-text-3 flex-shrink-0">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-claude-error flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-claude-text-3">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

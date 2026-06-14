import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-claude-accent text-white hover:bg-claude-accent-2 shadow-claude-sm border border-transparent',
  secondary: 'bg-claude-surface-2 text-claude-text hover:bg-claude-border border border-claude-border',
  ghost: 'bg-transparent text-claude-text-2 hover:bg-claude-sidebar-hover hover:text-claude-text border border-transparent',
  danger: 'bg-claude-error text-white hover:bg-red-700 shadow-claude-sm border border-transparent',
  outline: 'bg-transparent text-claude-accent hover:bg-claude-accent-lighter border border-claude-accent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-claude gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-claude gap-2',
  lg: 'px-5 py-2.5 text-sm font-semibold rounded-claude-md gap-2',
};

const Spinner = ({ size }: { size: ButtonSize }) => (
  <Loader2 className={`animate-spin flex-shrink-0 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-claude-accent focus-visible:ring-offset-1 select-none',
          variantStyles[variant],
          sizeStyles[size],
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]',
          className,
        ].join(' ')}
        {...props}
      >
        {loading && iconPosition === 'left' && <Spinner size={size} />}
        {!loading && icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        {loading && iconPosition === 'right' && <Spinner size={size} />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

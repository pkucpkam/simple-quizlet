import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  border?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', hover = false, border = true, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'bg-claude-surface rounded-claude-md',
        border ? 'border border-claude-border' : '',
        'shadow-claude-sm',
        hover ? 'hover:shadow-claude hover:border-claude-border-strong transition-all duration-150 cursor-pointer' : '',
        paddingStyles[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = 'Card';
export default Card;

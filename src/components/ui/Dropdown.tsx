import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption<T> {
  value: T;
  label: React.ReactNode;
}

interface DropdownProps<T> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export default function Dropdown<T extends string | number>({
  options,
  value,
  onChange,
  className = "",
  align = 'left',
  disabled = false
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "flex items-center justify-between w-full bg-claude-surface border border-claude-border rounded-claude pl-3 pr-8 py-2 text-sm text-claude-text transition-all text-left",
          "focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent",
          disabled ? "opacity-50 cursor-not-allowed bg-claude-surface-2" : "cursor-pointer hover:border-claude-border-strong",
          isOpen ? "border-transparent ring-2 ring-claude-accent shadow-claude-sm" : "shadow-sm"
        ].join(" ")}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-claude-text-3 transition-transform duration-200 pointer-events-none ${isOpen ? 'transform rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[60] mt-1 bg-claude-surface border border-claude-border rounded-claude shadow-claude-lg py-1 min-w-[120px] max-h-60 overflow-y-auto animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors hover:bg-claude-sidebar-hover ${
                option.value === value ? 'text-claude-accent font-semibold bg-claude-accent-lighter' : 'text-claude-text'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <Check className="w-3.5 h-3.5 text-claude-accent ml-2 shrink-0" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-claude-bg z-[9999]">
      <div className="flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="relative">
          <div className="h-14 w-14 rounded-full bg-claude-surface border border-claude-border shadow-claude-md flex items-center justify-center">
            <img src="/logo/brain.png" alt="Loading" className="w-8 h-8 object-contain" />
          </div>
          {/* Spinner ring */}
          <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-claude-accent animate-spin" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-base font-semibold text-claude-text">Simple Quizlet</h2>
          <p className="text-sm text-claude-text-3 mt-1">Đang tải...</p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-claude-accent opacity-60"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

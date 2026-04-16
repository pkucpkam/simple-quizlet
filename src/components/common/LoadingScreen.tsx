import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-200 z-[9999]">
      <div className="relative w-24 h-24 mb-6">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
        {/* Spinning Ring */}
        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
        {/* Logo/Icon in middle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo/brain.png" alt="Loading" className="w-12 h-12 animate-bounce" />
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Simple Quizlet</h2>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
        </div>
        <p className="mt-4 text-blue-600 font-medium animate-pulse">Vui lòng đợi giây lát...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

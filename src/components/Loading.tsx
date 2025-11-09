import React from 'react';
import '../index.css';

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="flex flex-col items-center">
        {/* Logo loading */}
        <div className="w-24 h-24 mb-4 animate-spin">
          <div className="h-full w-full rounded-full border-4 border-t-purple-500 border-r-blue-500 border-b-purple-500 border-l-blue-500"></div>
        </div>
        {/* Text loading */}
        <div className="text-white text-xl font-semibold">
          Loading<span className="animate-pulse">...</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
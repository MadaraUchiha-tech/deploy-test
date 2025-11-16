import React from 'react';
import { cn } from '../lib/utils';

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-white/10 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.name
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
            )}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;

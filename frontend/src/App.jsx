import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import MainContent from './components/MainContent';
import Analytics from './pages/Analytics';
import { cn } from './lib/utils';

function App() {
  const [view, setView] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-gray-900 text-white font-sans flex h-screen">
      <div className={cn('transition-all duration-300', sidebarOpen ? 'w-[250px]' : 'w-0', 'lg:w-[250px]')}>
        <Sidebar view={view} setView={setView} sidebarOpen={sidebarOpen} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'Dashboard' ? <MainContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> : <Analytics />}
      </div>
     
    </div>
  );
}

export default App;

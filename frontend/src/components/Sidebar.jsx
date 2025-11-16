import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart2, FileUp, Folder, HardDrive } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAnalytics, getUploadHistory } from '../services/api';

const Sidebar = ({ view, setView }) => {
  const navItems = [
    { icon: LayoutDashboard, name: 'Dashboard' },
    { icon: BarChart2, name: 'Analytics' },
  ];

  const [stats, setStats] = useState({
    totalUploads: '...',
    categories: '...',
    storageUsed: '...'
  });

  const [recentActivity, setRecentActivity] = useState([
    { icon: FileUp, text: 'Loading...', time: '' },
  ]);

  // Fetch live stats
  const fetchStats = async () => {
    try {
      const data = await getAnalytics();
      setStats({
        totalUploads: data.totalUploads?.toString() || '0',
        categories: data.categories?.toString() || '0',
        storageUsed: data.storageUsed || '0 B'
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch recent activity
  const fetchActivity = async () => {
    try {
      const data = await getUploadHistory(3);
      const activities = (data.logs || []).slice(0, 3).map(log => ({
        icon: log.type === 'media' ? FileUp : Folder,
        text: log.type === 'media' 
          ? `Uploaded ${log.filename}`
          : `Processed ${log.filename}`,
        time: formatTimeAgo(log.timestamp)
      }));
      
      if (activities.length > 0) {
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchActivity();

    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(fetchStats, 30000);
    
    // Auto-refresh activity every 10 seconds
    const activityInterval = setInterval(fetchActivity, 10000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(activityInterval);
    };
  }, []);

  const statsData = [
    { name: 'Total Uploads', value: stats.totalUploads },
    { name: 'Categories', value: stats.categories },
    { name: 'Storage Used', value: stats.storageUsed },
  ];

  return (
    <aside className="w-[250px] bg-gray-900/70 backdrop-blur-lg border-r border-white/10 p-4 flex flex-col h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Cosmio</h1>
          <p className="text-xs text-gray-400">intelli-store app</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Navigation
        </h2>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => setView(item.name)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  view === item.name
                    ? 'bg-purple-600/20 text-purple-300 shadow-lg shadow-purple-500/20'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
     
    </aside>
  );
};

export default Sidebar;
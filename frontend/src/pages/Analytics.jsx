import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { getAnalytics } from '../services/api';
import { File, Folder, Database, HardDrive, RefreshCw } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalUploads: 0,
    categories: 0,
    mediaFiles: 0,
    jsonFiles: 0,
    storageUsed: '0 Bytes',
    loading: true
  });

  const fetchStats = async () => {
    try {
      const data = await getAnalytics();
      console.log('Analytics stats:', data);
      
      setStats({
        totalUploads: data.totalUploads || 0,
        categories: data.categories || 0,
        mediaFiles: data.mediaFiles || 0,
        jsonFiles: data.jsonFiles || 0,
        storageUsed: data.storageUsed || '0 Bytes',
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setStats({
        totalUploads: 0,
        categories: 0,
        mediaFiles: 0,
        jsonFiles: 0,
        storageUsed: '0 Bytes',
        loading: false
      });
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsConfig = [
    { 
      icon: File, 
      name: 'Total Files', 
      value: stats.loading ? '...' : stats.totalUploads.toString(),
      gradient: 'from-purple-500 to-blue-500'
    },
    { 
      icon: Folder, 
      name: 'Categories', 
      value: stats.loading ? '...' : stats.categories.toString(),
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: Database, 
      name: 'JSON Files', 
      value: stats.loading ? '...' : stats.jsonFiles.toString(),
      gradient: 'from-cyan-500 to-teal-500'
    },
    { 
      icon: HardDrive, 
      name: 'Storage Used', 
      value: stats.loading ? '...' : stats.storageUsed,
      gradient: 'from-teal-500 to-green-500'
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time insights from your storage system</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${stats.loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className={`p-3 bg-gradient-to-tr ${stat.gradient} rounded-lg group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.name}</p>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <Dashboard />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Media Distribution */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Media Files</span>
                <span className="text-sm font-medium text-purple-400">
                  {stats.mediaFiles} ({stats.totalUploads > 0 ? Math.round((stats.mediaFiles / stats.totalUploads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalUploads > 0 ? (stats.mediaFiles / stats.totalUploads) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">JSON Files</span>
                <span className="text-sm font-medium text-blue-400">
                  {stats.jsonFiles} ({stats.totalUploads > 0 ? Math.round((stats.jsonFiles / stats.totalUploads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalUploads > 0 ? (stats.jsonFiles / stats.totalUploads) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Backend Status</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                ● Connected
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">AI Service</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                ● Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Auto-categorization</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                ✓ Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Storage Backend</span>
              <span className="text-sm font-medium text-gray-300">Firebase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
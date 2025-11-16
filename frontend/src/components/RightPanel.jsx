import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Zap, Activity } from 'lucide-react';
import { checkHealth } from '../services/api';

const RightPanel = () => {
  const [systemStatus, setSystemStatus] = useState({
    ai: { status: 'Checking...', color: 'text-gray-400' },
    storage: { status: 'Checking...', color: 'text-gray-400' },
    queue: { status: '0 pending', color: 'text-gray-400' },
  });

  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health
  const checkBackendStatus = async () => {
    try {
      const health = await checkHealth();
      console.log('Backend health:', health);

      setBackendOnline(true);
      setSystemStatus(prev => ({
        ...prev,
        ai: {
          status: 'Ready',
          color: 'text-green-400'
        },
        storage: {
          status: health.firebase ? 'Connected' : 'Mock Mode',
          color: health.firebase ? 'text-green-400' : 'text-yellow-400'
        },
      }));
    } catch (error) {
      console.error('Backend offline:', error);
      setBackendOnline(false);
      setSystemStatus({
        ai: { status: 'Offline', color: 'text-red-400' },
        storage: { status: 'Offline', color: 'text-red-400' },
        queue: { status: 'Offline', color: 'text-red-400' },
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkBackendStatus();

    // Check health every 10 seconds
    const healthInterval = setInterval(checkBackendStatus, 10000);

    return () => {
      clearInterval(healthInterval);
    };
  }, []);

  const statusItems = [
    { icon: Cpu, name: 'AI', ...systemStatus.ai },
    { icon: HardDrive, name: 'Storage', ...systemStatus.storage },
    { icon: Zap, name: 'Queue', ...systemStatus.queue },
  ];

  return (
    <aside className="w-[300px] bg-gray-900/70 backdrop-blur-lg border-l border-white/10 p-4 flex flex-col h-screen overflow-y-auto">
      {/* Backend Status Indicator */}
      <div className={`mb-6 p-3 rounded-lg border ${
        backendOnline 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${backendOnline ? 'text-green-400' : 'text-red-400'}`} />
          <span className={`text-sm font-medium ${backendOnline ? 'text-green-400' : 'text-red-400'}`}>
            Backend {backendOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {backendOnline ? 'All systems operational' : 'Cannot connect to server'}
        </p>
      </div>

      {/* Processing Queue - Placeholder for now */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Processing Queue</h3>
        <div className="space-y-4">
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">No files in queue</p>
            <p className="text-xs text-gray-500 mt-1">Upload files to see processing status</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <ul className="space-y-3">
          {statusItems.map((item, index) => (
            <li key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.name}</span>
              </div>
              <span className={`font-medium ${item.color} text-xs`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </div>


      {/* Connection Info */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between mb-1">
            <span>Backend:</span>
            <span className="text-gray-400 font-mono">:5000</span>
          </div>
          <div className="flex justify-between">
            <span>AI Service:</span>
            <span className="text-gray-400 font-mono">:5001</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
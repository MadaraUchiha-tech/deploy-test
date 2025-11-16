import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({ 
    pieData: [], 
    barData: [],
    loading: true 
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        console.log('Analytics data received:', data);
        
        // Transform backend data for charts
        const pieData = transformTagsForPieChart(data.topTags || []);
        const barData = transformUploadsForBarChart(data.uploadsByDay || []);
        
        setAnalyticsData({
          pieData,
          barData,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Set mock data on error
        setAnalyticsData({
          pieData: [
            { name: 'Nature', value: 12 },
            { name: 'Animals', value: 8 },
            { name: 'Urban', value: 7 },
            { name: 'Technology', value: 5 }
          ],
          barData: [
            { name: 'Mon', uploads: 5 },
            { name: 'Tue', uploads: 8 },
            { name: 'Wed', uploads: 12 },
            { name: 'Thu', uploads: 15 },
            { name: 'Fri', uploads: 10 },
            { name: 'Sat', uploads: 7 },
            { name: 'Sun', uploads: 3 }
          ],
          loading: false
        });
      }
    };

    fetchAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Transform topTags array to pie chart format
  const transformTagsForPieChart = (tags) => {
    if (!tags || tags.length === 0) return [];
    return tags.slice(0, 6).map(tag => ({
      name: tag.tag.charAt(0).toUpperCase() + tag.tag.slice(1),
      value: tag.count
    }));
  };

  // Transform uploadsByDay array to bar chart format
  const transformUploadsForBarChart = (uploads) => {
    if (!uploads || uploads.length === 0) return [];
    
    // Get last 7 days
    const last7Days = uploads.slice(-7);
    
    return last7Days.map(item => ({
      name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      uploads: item.count
    }));
  };

  if (analyticsData.loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6 h-[350px] flex items-center justify-center">
          <div className="text-gray-400 animate-pulse">Loading analytics...</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6 h-[350px] flex items-center justify-center">
          <div className="text-gray-400 animate-pulse">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Tags Distribution</h3>
        {analyticsData.pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={analyticsData.pieData} 
                cx="50%" 
                cy="50%" 
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100} 
                fill="#8884d8" 
                dataKey="value"
              >
                {analyticsData.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            No data available yet. Upload some files!
          </div>
        )}
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Volume (Last 7 Days)</h3>
        {analyticsData.barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="uploads" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            No upload history yet. Start uploading files!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
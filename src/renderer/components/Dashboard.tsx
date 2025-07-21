import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Battery, Users, Smartphone, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface DashboardProps {
  toast: ReturnType<typeof useToast>;
}

const Dashboard: React.FC<DashboardProps> = ({ toast }) => {
  const [systemStats, setSystemStats] = useState({
    cpu: 23,
    memory: 67,
    storage: 45,
    activeDevices: 3,
    totalAutomations: 127,
    successRate: 94.2,
  });

  const [realtimeData, setRealtimeData] = useState({
    networkLatency: 12,
    batteryLevel: 85,
    connectionStatus: 'Connected',
  });

  // Simulate real-time updates
  useEffect(() => {
    // Show welcome toast on mount - solo una vez
    toast.showSuccess('Dashboard Loaded', 'System monitoring is active');
    
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        totalAutomations: prev.totalAutomations + Math.floor(Math.random() * 3),
      }));

      setRealtimeData(prev => ({
        ...prev,
        networkLatency: Math.max(5, Math.min(50, prev.networkLatency + (Math.random() - 0.5) * 8)),
        batteryLevel: Math.max(20, Math.min(100, prev.batteryLevel + (Math.random() - 0.5) * 2)),
      }));
      
      // Simulate occasional system alerts - reducida la frecuencia
      if (Math.random() < 0.02) { // 2% chance every 2 seconds = más realista
        const alerts = [
          { type: 'info' as const, title: 'Device Connected', message: 'iPhone 13 Pro is now online' },
          { type: 'warning' as const, title: 'High CPU Usage', message: 'CPU usage is above 80%' },
          { type: 'success' as const, title: 'Automation Complete', message: 'Background task finished' },
        ];
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        
        if (alert.type === 'info') toast.showInfo(alert.title, alert.message);
        else if (alert.type === 'warning') toast.showWarning(alert.title, alert.message);
        else toast.showSuccess(alert.title, alert.message);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []); // ✅ Array vacío - solo ejecutar una vez al montar

  const StatusCard = ({ 
    icon: Icon, 
    title, 
    value, 
    unit, 
    color = 'blue',
    isPercentage = false 
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: number;
    unit?: string;
    color?: string;
    isPercentage?: boolean;
  }) => (
    <div className="desktop-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className={`w-4 h-4 mr-2 text-${color}-500`} />
          <h3 className="text-xs font-medium text-gray-700">{title}</h3>
        </div>
        {isPercentage && (
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div 
              className={`bg-${color}-500 h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${value}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-end">
        <span className="text-lg font-semibold text-gray-900">{value}</span>
        {unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">System Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Live</span>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={Cpu}
          title="CPU Usage"
          value={systemStats.cpu}
          unit="%"
          color="blue"
          isPercentage={true}
        />
        <StatusCard
          icon={HardDrive}
          title="Memory"
          value={systemStats.memory}
          unit="%"
          color="green"
          isPercentage={true}
        />
        <StatusCard
          icon={Smartphone}
          title="Active Devices"
          value={systemStats.activeDevices}
          color="purple"
        />
        <StatusCard
          icon={Zap}
          title="Automations"
          value={systemStats.totalAutomations}
          color="orange"
        />
      </div>

      {/* Network & Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Network Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wifi className="w-4 h-4 mr-2 text-green-500" />
                <span className="text-xs text-gray-600">Connection</span>
              </div>
              <span className="text-xs font-medium text-green-600">{realtimeData.connectionStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                <span className="text-xs text-gray-600">Latency</span>
              </div>
              <span className="text-xs font-medium text-gray-900">{realtimeData.networkLatency}ms</span>
            </div>
          </div>
        </div>

        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Battery className="w-4 h-4 mr-2 text-yellow-500" />
                <span className="text-xs text-gray-600">Battery Level</span>
              </div>
              <span className="text-xs font-medium text-gray-900">{realtimeData.batteryLevel}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-xs text-gray-600">Success Rate</span>
              </div>
              <span className="text-xs font-medium text-green-600">{systemStats.successRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="desktop-card rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[
            { time: '14:32', action: 'Automation started on iPhone 12 Pro', status: 'success' },
            { time: '14:28', action: 'Device iPhone 13 connected', status: 'info' },
            { time: '14:25', action: 'Automation completed on iPhone 11', status: 'success' },
            { time: '14:22', action: 'Warning: Low battery on iPhone X', status: 'warning' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-700">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

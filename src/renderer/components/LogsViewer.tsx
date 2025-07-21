import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, Filter, Download, Smartphone, AlertCircle, CheckCircle, Info, X, Grid, List, Eye, EyeOff, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

type LogLevel = 'info' | 'warning' | 'error' | 'success';
type ViewMode = 'unified' | 'grid' | 'individual';

interface LogEntry {
  id: string;
  timestamp: Date;
  device: string;
  level: LogLevel;
  message: string;
  details?: string;
}

interface LogsViewerProps {
  toast: ReturnType<typeof useToast>;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ toast }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [hiddenDevices, setHiddenDevices] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);

  const devices = [
    'iPhone 12 Pro', 'iPhone 13', 'iPhone 11', 'iPhone X', 
    'iPhone 14', 'iPhone 13 Mini', 'iPhone 12', 'iPhone SE'
  ];
  
  const generateRandomLog = (): LogEntry => {
    const messages = [
      'Automation script started successfully',
      'UI element found and interacted with',
      'Network request completed',
      'Screenshot captured',
      'App launched successfully',
      'Warning: Battery level low',
      'Error: Element not found',
      'Performance test completed',
      'Memory usage: 67% of available',
      'Touch gesture executed',
      'Notification received',
      'App backgrounded',
      'Connection established',
      'Data validation passed',
      'Timeout occurred while waiting for element',
      'Proxy connection established',
      'SMS verification received',
      'Bundle installation completed',
      'WebDriver session started',
      'Activation key validated',
    ];

    const levels: LogLevel[] = ['info', 'warning', 'error', 'success'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      device,
      level,
      message,
      details: Math.random() > 0.7 ? `Additional context: ${Math.random().toString(36).substr(2, 20)}` : undefined,
    };
  };

  // Generate initial logs and simulate real-time updates
  useEffect(() => {
    const initialLogs = Array.from({ length: 50 }, () => generateRandomLog());
    setLogs(initialLogs);
    setSelectedDevices(new Set(devices));

    const interval = setInterval(() => {
      const newLog = generateRandomLog();
      setLogs(prev => [...prev.slice(-199), newLog]);
    }, 800 + Math.random() * 1500);

    return () => clearInterval(interval);
  }, []);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (selectedDevices.size > 0) {
      filtered = filtered.filter(log => selectedDevices.has(log.device));
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.device.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedDevices, selectedLevel, searchTerm]);

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isAutoScroll]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return <BarChart3 className="w-3 h-3 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'success':
        return <Zap className="w-3 h-3 text-green-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const toggleDevice = (device: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(device)) {
        newSet.delete(device);
      } else {
        newSet.add(device);
      }
      return newSet;
    });
  };

  const toggleDeviceVisibility = (device: string) => {
    setHiddenDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(device)) {
        newSet.delete(device);
      } else {
        newSet.add(device);
      }
      return newSet;
    });
  };

  const clearLogs = () => {
    setLogs([]);
    toast.showInfo('Logs Cleared', 'All log entries have been removed');
  };

  const downloadLogs = () => {
    const logData = filteredLogs.map(log => 
      `${formatTimestamp(log.timestamp)} [${log.level.toUpperCase()}] ${log.device}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.showSuccess(
      'Logs Exported',
      `${filteredLogs.length} log entries downloaded`
    );
  };

  const getDeviceLogs = (device: string) => {
    return filteredLogs.filter(log => log.device === device);
  };

  const LogEntry = ({ log }: { log: LogEntry }) => (
    <div className={`flex items-start space-x-2 p-2 rounded-md border transition-colors duration-200 hover:bg-opacity-80 ${getLevelColor(log.level)}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getLevelIcon(log.level)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-medium text-gray-900">{log.device}</span>
          <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-800 break-words">{log.message}</p>
        {log.details && (
          <p className="text-xs text-gray-600 mt-1 opacity-80">{log.details}</p>
        )}
      </div>
    </div>
  );

  const DeviceLogPanel = ({ device }: { device: string }) => {
    const deviceLogs = getDeviceLogs(device);
    const isHidden = hiddenDevices.has(device);
    
    return (
      <div className="desktop-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">{device}</span>
            <span className="text-xs text-gray-500">({deviceLogs.length})</span>
          </div>
          <button
            onClick={() => toggleDeviceVisibility(device)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
        {!isHidden && (
          <div className="h-48 overflow-y-auto p-2 space-y-1">
            {deviceLogs.slice(-20).map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Multi-Device Logs</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Live ({filteredLogs.length} entries)</span>
        </div>
      </div>

      {/* Controls */}
      <div className="desktop-card rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="desktop-input w-full pl-7 pr-3 py-1.5 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                viewMode === 'unified' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-3 h-3 mr-1" />
              Unified
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="w-3 h-3 mr-1" />
              Grid
            </button>
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
            className="desktop-input text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>

          {/* Auto-scroll */}
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`desktop-button px-2 py-1.5 text-xs font-medium rounded-md ${
              isAutoScroll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Auto-scroll {isAutoScroll ? 'ON' : 'OFF'}
          </button>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={downloadLogs}
              className="desktop-button flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </button>
            <button
              onClick={clearLogs}
              className="desktop-button flex items-center px-2 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Device Selection */}
      <div className="desktop-card rounded-lg p-3">
        <h3 className="text-xs font-medium text-gray-700 mb-2">Device Selection</h3>
        <div className="flex flex-wrap gap-2">
          {devices.map(device => (
            <button
              key={device}
              onClick={() => toggleDevice(device)}
              className={`desktop-button flex items-center px-2 py-1 text-xs font-medium rounded-md border ${
                selectedDevices.has(device)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Smartphone className="w-3 h-3 mr-1" />
              {device}
              <span className="ml-1 text-xs opacity-60">
                ({logs.filter(log => log.device === device).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Logs Display */}
      {viewMode === 'unified' ? (
        <div className="desktop-card rounded-lg h-96 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex items-center">
              <Terminal className="w-3 h-3 text-gray-500 mr-2" />
              <span className="text-xs text-gray-700">Unified Log Stream</span>
            </div>
          </div>
          <div className="h-full overflow-y-auto p-3 space-y-1">
            {filteredLogs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {devices
            .filter(device => selectedDevices.has(device))
            .map(device => (
              <DeviceLogPanel key={device} device={device} />
            ))}
        </div>
      )}
    </div>
  );
};

export default LogsViewer;
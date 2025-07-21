import React, { useState, useMemo } from 'react';
import { Smartphone, Play, Pause, Settings, Battery, Wifi, CheckCircle, Zap, Grid, List, Filter, Search, ChevronDown, PlayCircle, Square, Users, Clock, Signal, Plus, Edit3, Trash2, Tag, X, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface PhoneSelectorProps {
  toast: ReturnType<typeof useToast>;
}

type SortOption = 'name' | 'battery' | 'model' | 'status' | 'lastSeen';
type ViewMode = 'grid' | 'list' | 'compact';
type DeviceCategory = 'all' | 'connected' | 'disconnected' | 'low-battery' | 'recent' | string;

interface CustomCategory {
  id: string;
  name: string;
  color: string;
  deviceIds: string[];
}

const PhoneSelector: React.FC<PhoneSelectorProps> = ({ toast }) => {
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [runningAutomations, setRunningAutomations] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([
    { id: 'testing', name: 'Testing Devices', color: 'purple', deviceIds: ['iphone-13-mini', 'iphone-12', 'iphone-se'] },
    { id: 'production', name: 'Production', color: 'green', deviceIds: ['iphone-12-pro', 'iphone-13', 'iphone-14'] },
    { id: 'backup', name: 'Backup Devices', color: 'gray', deviceIds: ['iphone-11', 'iphone-x'] },
  ]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');

  const devices = [
    {
      id: 'iphone-12-pro',
      name: 'iPhone 12 Pro',
      model: 'A2341',
      ios: '17.2.1',
      battery: 89,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 'iphone-13',
      name: 'iPhone 13',
      model: 'A2633',
      ios: '17.1.2',
      battery: 67,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 1 * 60 * 1000),
    },
    {
      id: 'iphone-11',
      name: 'iPhone 11',
      model: 'A2111',
      ios: '16.7.2',
      battery: 43,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: 'iphone-x',
      name: 'iPhone X',
      model: 'A1865',
      ios: '16.7.1',
      battery: 23,
      status: 'disconnected' as const,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: 'iphone-14',
      name: 'iPhone 14',
      model: 'A2649',
      ios: '17.3.0',
      battery: 91,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 30 * 1000),
    },
    {
      id: 'iphone-13-mini',
      name: 'iPhone 13 Mini',
      model: 'A2628',
      ios: '17.1.1',
      battery: 15,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 3 * 60 * 1000),
    },
    {
      id: 'iphone-12',
      name: 'iPhone 12',
      model: 'A2172',
      ios: '16.7.3',
      battery: 78,
      status: 'connected' as const,
      lastSeen: new Date(Date.now() - 7 * 60 * 1000),
    },
    {
      id: 'iphone-se',
      name: 'iPhone SE',
      model: 'A2275',
      ios: '16.6.1',
      battery: 34,
      status: 'disconnected' as const,
      lastSeen: new Date(Date.now() - 45 * 60 * 1000),
    },
  ];

  const automationScripts = [
    { id: 'app-test', name: 'App UI Test', duration: '~2 min', description: 'Test app navigation and UI elements', color: 'blue' },
    { id: 'performance', name: 'Performance Test', duration: '~5 min', description: 'Memory and CPU performance testing', color: 'green' },
    { id: 'battery-test', name: 'Battery Test', duration: '~10 min', description: 'Battery drain and optimization test', color: 'yellow' },
    { id: 'network-test', name: 'Network Test', duration: '~3 min', description: 'WiFi and cellular connectivity test', color: 'purple' },
  ];

  const getDeviceCustomCategories = (deviceId: string) => {
    return customCategories.filter(cat => cat.deviceIds.includes(deviceId));
  };

  const systemCategories = [
    { id: 'all', name: 'All Devices', count: devices.length },
    { id: 'connected', name: 'Connected', count: devices.filter(d => d.status === 'connected').length },
    { id: 'disconnected', name: 'Disconnected', count: devices.filter(d => d.status === 'disconnected').length },
    { id: 'low-battery', name: 'Low Battery', count: devices.filter(d => d.battery < 30).length },
    { id: 'recent', name: 'Recently Active', count: devices.filter(d => Date.now() - d.lastSeen.getTime() < 5 * 60 * 1000).length },
  ];

  const allCategories = [
    ...systemCategories,
    ...customCategories.map(cat => ({ id: cat.id, name: cat.name, count: cat.deviceIds.length })),
  ];

  const filteredAndSortedDevices = useMemo(() => {
    let filtered = devices;

    // Apply category filter
    switch (selectedCategory) {
      case 'connected':
        filtered = filtered.filter(d => d.status === 'connected');
        break;
      case 'disconnected':
        filtered = filtered.filter(d => d.status === 'disconnected');
        break;
      case 'low-battery':
        filtered = filtered.filter(d => d.battery < 30);
        break;
      case 'recent':
        filtered = filtered.filter(d => Date.now() - d.lastSeen.getTime() < 5 * 60 * 1000);
        break;
      default:
        // Custom category
        const customCat = customCategories.find(cat => cat.id === selectedCategory);
        if (customCat) {
          filtered = filtered.filter(d => customCat.deviceIds.includes(d.id));
        }
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ios.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'battery':
          aValue = a.battery;
          bValue = b.battery;
          break;
        case 'model':
          aValue = a.model;
          bValue = b.model;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastSeen':
          aValue = a.lastSeen.getTime();
          bValue = b.lastSeen.getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [devices, selectedCategory, searchTerm, sortBy, sortOrder, customCategories]);

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleConnectedDevices = filteredAndSortedDevices
      .filter(d => d.status === 'connected')
      .map(d => d.id);
    setSelectedDevices(new Set(visibleConnectedDevices));
  };

  const clearSelection = () => {
    setSelectedDevices(new Set());
  };

  const handleMassAutomation = (scriptId: string) => {
    const connectedSelected = Array.from(selectedDevices).filter(deviceId => {
      const device = devices.find(d => d.id === deviceId);
      return device?.status === 'connected';
    });

    if (connectedSelected.length === 0) {
      toast.showWarning('No Devices Selected', 'Please select connected devices first');
      return;
    }

    const script = automationScripts.find(s => s.id === scriptId);
    
    connectedSelected.forEach(deviceId => {
      const automationKey = `${deviceId}-${scriptId}`;
      setRunningAutomations(prev => new Set([...prev, automationKey]));
    });

    toast.showSuccess(
      'Mass Automation Started',
      `${script?.name} started on ${connectedSelected.length} devices`
    );

    // Simulate completion
    setTimeout(() => {
      connectedSelected.forEach(deviceId => {
        const automationKey = `${deviceId}-${scriptId}`;
        setRunningAutomations(prev => {
          const newSet = new Set(prev);
          newSet.delete(automationKey);
          return newSet;
        });
      });

      toast.showSuccess(
        'Mass Automation Completed',
        `${script?.name} finished on all devices`
      );
    }, Math.random() * 8000 + 5000);
  };

  const stopMassAutomation = (scriptId: string) => {
    const runningDevices = Array.from(selectedDevices).filter(deviceId => 
      runningAutomations.has(`${deviceId}-${scriptId}`)
    );

    runningDevices.forEach(deviceId => {
      const automationKey = `${deviceId}-${scriptId}`;
      setRunningAutomations(prev => {
        const newSet = new Set(prev);
        newSet.delete(automationKey);
        return newSet;
      });
    });

    const script = automationScripts.find(s => s.id === scriptId);
    toast.showWarning(
      'Mass Automation Stopped',
      `${script?.name} stopped on ${runningDevices.length} devices`
    );
  };

  const createCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: CustomCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      deviceIds: [],
    };
    
    setCustomCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryColor('blue');
    toast.showSuccess('Category Created', `"${newCategory.name}" category has been created`);
  };

  const updateCategory = (categoryId: string, updates: Partial<CustomCategory>) => {
    setCustomCategories(prev => 
      prev.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)
    );
  };

  const deleteCategory = (categoryId: string) => {
    const category = customCategories.find(cat => cat.id === categoryId);
    setCustomCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }
    toast.showSuccess('Category Deleted', `"${category?.name}" category has been deleted`);
  };

  const addDeviceToCategory = (deviceId: string, categoryId: string) => {
    const category = customCategories.find(cat => cat.id === categoryId);
    if (!category || category.deviceIds.includes(deviceId)) return;
    
    updateCategory(categoryId, {
      deviceIds: [...category.deviceIds, deviceId]
    });
    
    const device = devices.find(d => d.id === deviceId);
    toast.showSuccess('Device Added', `${device?.name} added to "${category.name}"`);
  };

  const removeDeviceFromCategory = (deviceId: string, categoryId: string) => {
    const category = customCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    updateCategory(categoryId, {
      deviceIds: category.deviceIds.filter(id => id !== deviceId)
    });
    
    const device = devices.find(d => d.id === deviceId);
    toast.showSuccess('Device Removed', `${device?.name} removed from "${category.name}"`);
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[color] || colors.blue;
  };

  const formatLastSeen = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const DeviceCard = ({ device }: { device: typeof devices[0] }) => {
    const isSelected = selectedDevices.has(device.id);
    const hasRunningAutomation = automationScripts.some(script => 
      runningAutomations.has(`${device.id}-${script.id}`)
    );
    const deviceCategories = getDeviceCustomCategories(device.id);

    return (
      <div 
        className={`desktop-card rounded-lg p-4 cursor-pointer micro-hover micro-press transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        } ${device.status === 'disconnected' ? 'opacity-60' : ''}`}
        onClick={() => device.status === 'connected' && handleDeviceSelection(device.id)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="relative">
              <Smartphone className="w-4 h-4 mr-2 text-gray-600" />
              {hasRunningAutomation && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">{device.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isSelected && (
              <CheckCircle className="w-3 h-3 text-blue-500" />
            )}
            <div className={`w-2 h-2 rounded-full ${
              device.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
        </div>
        
        {/* Device Categories */}
        {deviceCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {deviceCategories.map(category => (
              <span
                key={category.id}
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(category.color)}`}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Model: {device.model}</span>
            <span>iOS {device.ios}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Battery className={`w-3 h-3 mr-1 ${
                device.battery < 30 ? 'text-red-500' : 
                device.battery < 60 ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <span className="text-xs text-gray-600">{device.battery}%</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-gray-500" />
              <span className="text-xs text-gray-600">{formatLastSeen(device.lastSeen)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeviceListItem = ({ device }: { device: typeof devices[0] }) => {
    const isSelected = selectedDevices.has(device.id);
    const hasRunningAutomation = automationScripts.some(script => 
      runningAutomations.has(`${device.id}-${script.id}`)
    );
    const deviceCategories = getDeviceCustomCategories(device.id);

    return (
      <div 
        className={`desktop-card rounded-lg p-3 cursor-pointer micro-hover transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        } ${device.status === 'disconnected' ? 'opacity-60' : ''}`}
        onClick={() => device.status === 'connected' && handleDeviceSelection(device.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Smartphone className="w-4 h-4 text-gray-600" />
              {hasRunningAutomation && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">{device.name}</span>
              <div className="text-xs text-gray-500">{device.model} • iOS {device.ios}</div>
              {deviceCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {deviceCategories.map(category => (
                    <span
                      key={category.id}
                      className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getCategoryColor(category.color)}`}
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Battery className={`w-3 h-3 mr-1 ${
                device.battery < 30 ? 'text-red-500' : 
                device.battery < 60 ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <span className="text-xs text-gray-600">{device.battery}%</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-gray-500" />
              <span className="text-xs text-gray-600">{formatLastSeen(device.lastSeen)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSelected && (
                <CheckCircle className="w-3 h-3 text-blue-500" />
              )}
              <div className={`w-2 h-2 rounded-full ${
                device.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Device Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-gray-500">
            {filteredAndSortedDevices.filter(d => d.status === 'connected').length} connected • {selectedDevices.size} selected
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">Live</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="desktop-card rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="desktop-input w-full pl-10 pr-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid className="w-3 h-3 mr-1" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-3 h-3 mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
                viewMode === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-3 h-3 mr-1" />
              Compact
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`desktop-button flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 ${
              showFilters ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            {/* Categories */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as DeviceCategory)}
                    className={`desktop-button px-3 py-1.5 text-xs font-medium rounded-md ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="desktop-button flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 mt-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Manage Categories
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mr-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="desktop-input text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="battery">Battery</option>
                  <option value="model">Model</option>
                  <option value="status">Status</option>
                  <option value="lastSeen">Last Seen</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 mr-2">Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="desktop-input text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="desktop-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create New Category */}
            <div className="desktop-card rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Create New Category</h4>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="desktop-input flex-1 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="desktop-input px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="gray">Gray</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                </select>
                <button
                  onClick={createCategory}
                  disabled={!newCategoryName.trim()}
                  className="desktop-button flex items-center px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </button>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-800">Existing Categories</h4>
              {customCategories.map(category => (
                <div key={category.id} className="desktop-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(category.color)}`}>
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-500">({category.deviceIds.length} devices)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Device Assignment */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700">Devices in this category:</h5>
                    <div className="flex flex-wrap gap-2">
                      {category.deviceIds.map(deviceId => {
                        const device = devices.find(d => d.id === deviceId);
                        return device ? (
                          <div key={deviceId} className="flex items-center bg-white rounded-md px-2 py-1 border">
                            <Smartphone className="w-3 h-3 mr-1 text-gray-500" />
                            <span className="text-xs text-gray-700">{device.name}</span>
                            <button
                              onClick={() => removeDeviceFromCategory(deviceId, category.id)}
                              className="ml-2 text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    {/* Add Device Dropdown */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addDeviceToCategory(e.target.value, category.id);
                          e.target.value = '';
                        }
                      }}
                      className="desktop-input text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Add device to category...</option>
                      {devices
                        .filter(device => !category.deviceIds.includes(device.id))
                        .map(device => (
                          <option key={device.id} value={device.id}>
                            {device.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      {filteredAndSortedDevices.filter(d => d.status === 'connected').length > 0 && (
        <div className="desktop-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllVisible}
                className="desktop-button flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Select All Connected
              </button>
              
              {selectedDevices.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="desktop-button flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Clear Selection
                </button>
              )}
            </div>
            
            {selectedDevices.size > 0 && (
              <div className="text-xs text-gray-600">
                {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Devices Display */}
      <div className="space-y-4">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedDevices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredAndSortedDevices.map(device => (
              <DeviceListItem key={device.id} device={device} />
            ))}
          </div>
        )}

        {viewMode === 'compact' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {filteredAndSortedDevices.map(device => {
              const isSelected = selectedDevices.has(device.id);
              const hasRunningAutomation = automationScripts.some(script => 
                runningAutomations.has(`${device.id}-${script.id}`)
              );
              const deviceCategories = getDeviceCustomCategories(device.id);
              
              return (
                <div
                  key={device.id}
                  className={`desktop-card rounded-lg p-3 cursor-pointer micro-hover transition-all duration-200 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  } ${device.status === 'disconnected' ? 'opacity-60' : ''}`}
                  onClick={() => device.status === 'connected' && handleDeviceSelection(device.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="relative">
                      <Smartphone className="w-3 h-3 text-gray-600" />
                      {hasRunningAutomation && (
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      device.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate mb-1">{device.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{device.battery}%</span>
                    {isSelected && <CheckCircle className="w-2 h-2 text-blue-500" />}
                  </div>
                  {deviceCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {deviceCategories.slice(0, 2).map(category => (
                        <div
                          key={category.id}
                          className={`w-2 h-2 rounded-full bg-${category.color}-500`}
                          title={category.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mass Automation */}
      {selectedDevices.size > 0 && (
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
            <PlayCircle className="w-4 h-4 mr-2 text-green-500" />
            Mass Automation ({selectedDevices.size} devices)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {automationScripts.map(script => {
              const runningCount = Array.from(selectedDevices).filter(deviceId => 
                runningAutomations.has(`${deviceId}-${script.id}`)
              ).length;
              const isRunning = runningCount > 0;
              
              return (
                <div key={script.id} className="desktop-card rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-900">{script.name}</h4>
                    <span className="text-xs text-gray-500">{script.duration}</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{script.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isRunning ? (
                        <>
                          <Zap className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">Running ({runningCount})</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-600">Ready</span>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (isRunning) {
                          stopMassAutomation(script.id);
                        } else {
                          handleMassAutomation(script.id);
                        }
                      }}
                      className={`desktop-button flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        isRunning
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Running Automations Summary */}
      {runningAutomations.size > 0 && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Active Automations ({runningAutomations.size})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from(runningAutomations).map(automationId => {
              const [phoneId, scriptId] = automationId.split('-');
              const phone = devices.find(d => d.id === phoneId);
              const script = automationScripts.find(s => s.id === scriptId);
              return (
                <div key={automationId} className="flex items-center text-xs text-green-700 bg-white rounded-md p-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="font-medium">{phone?.name}</span>
                  <span className="mx-1">•</span>
                  <span>{script?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedDevices.length === 0 && (
        <div className="desktop-card rounded-lg p-8 text-center">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-xs text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Connect some devices to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneSelector;
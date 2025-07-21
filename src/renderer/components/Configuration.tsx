import React, { useState, useCallback } from 'react';
import { Save, Key, Globe, Smartphone, Package, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ConfigSettings {
  proxyString: string;
  daisySmsApiKey: string;
  webdriverAgentUrl: string;
  bundleId: string;
  activationKey: string;
}

interface ConfigurationProps {
  toast: ReturnType<typeof useToast>;
}

// ✅ COMPONENTE EXTRAÍDO - Ya no se re-crea en cada render
interface ConfigFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  isSecret?: boolean;
  secretKey?: 'daisySmsApiKey' | 'activationKey';
  required?: boolean;
  validation?: (value: string) => boolean;
  showKeys?: { [key: string]: boolean };
  onToggleVisibility?: (field: 'daisySmsApiKey' | 'activationKey') => void;
}

const ConfigField: React.FC<ConfigFieldProps> = React.memo(({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  type = 'text',
  isSecret = false,
  secretKey,
  required = false,
  validation,
  showKeys = {},
  onToggleVisibility
}) => {
  const isValid = validation ? validation(value) : true;
  const showValue = isSecret && secretKey ? showKeys[secretKey] : true;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-xs font-medium text-gray-700">
          <Icon className="w-3 h-3 mr-2 text-gray-500" />
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {validation && value && (
          <div className="flex items-center">
            {isValid ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type={showValue ? type : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`desktop-input w-full px-3 py-2 text-xs rounded-md focus:outline-none focus:ring-1 ${
            validation && value && !isValid
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        {isSecret && secretKey && onToggleVisibility && (
          <button
            type="button"
            onClick={() => onToggleVisibility(secretKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            {showValue ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
      {validation && value && !isValid && (
        <p className="text-xs text-red-600">
          {secretKey === 'activationKey' 
            ? 'Activation key must be at least 16 characters with uppercase letters, numbers, and hyphens only'
            : 'Invalid format'
          }
        </p>
      )}
    </div>
  );
});

// Agregar displayName para debugging
ConfigField.displayName = 'ConfigField';

const Configuration: React.FC<ConfigurationProps> = ({ toast }) => {
  const [settings, setSettings] = useState<ConfigSettings>({
    proxyString: 'socks5://127.0.0.1:1080',
    daisySmsApiKey: '',
    webdriverAgentUrl: 'http://localhost:8100',
    bundleId: 'com.example.app',
    activationKey: '',
  });

  const [showKeys, setShowKeys] = useState({
    daisySmsApiKey: false,
    activationKey: false,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // ✅ HANDLERS OPTIMIZADOS con useCallback
  const handleInputChange = useCallback((field: keyof ConfigSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const toggleKeyVisibility = useCallback((field: 'daisySmsApiKey' | 'activationKey') => {
    setShowKeys(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    
    toast.showInfo('Saving Configuration', 'Please wait...');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      toast.showSuccess(
        'Configuration Saved',
        'All settings have been updated successfully'
      );
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  }, [toast]);

  const validateActivationKey = useCallback((key: string) => {
    return key.length >= 16 && /^[A-Z0-9-]+$/.test(key);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        <div className="flex items-center space-x-2">
          {saveStatus === 'success' && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">Saved successfully</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Configuration */}
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-blue-500" />
            Network Configuration
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="Proxy String (SOCKS5)"
              value={settings.proxyString}
              onChange={(value) => handleInputChange('proxyString', value)}
              placeholder="socks5://127.0.0.1:1080"
              icon={Globe}
            />
            <ConfigField
              label="WebDriver Agent URL"
              value={settings.webdriverAgentUrl}
              onChange={(value) => handleInputChange('webdriverAgentUrl', value)}
              placeholder="http://localhost:8100"
              icon={Smartphone}
            />
          </div>
        </div>

        {/* API Configuration */}
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-green-500" />
            API Configuration
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="DaisySMS API Key"
              value={settings.daisySmsApiKey}
              onChange={(value) => handleInputChange('daisySmsApiKey', value)}
              placeholder="Enter your DaisySMS API key"
              icon={Key}
              isSecret={true}
              secretKey="daisySmsApiKey"
              required={true}
              showKeys={showKeys}
              onToggleVisibility={toggleKeyVisibility}
            />
          </div>
        </div>

        {/* App Configuration */}
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
            <Package className="w-4 h-4 mr-2 text-purple-500" />
            App Configuration
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="Bundle ID"
              value={settings.bundleId}
              onChange={(value) => handleInputChange('bundleId', value)}
              placeholder="com.example.app"
              icon={Package}
              required={true}
            />
          </div>
        </div>

        {/* License Configuration */}
        <div className="desktop-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-red-500" />
            License Configuration
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="Activation Key"
              value={settings.activationKey}
              onChange={(value) => handleInputChange('activationKey', value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              icon={Shield}
              isSecret={true}
              secretKey="activationKey"
              required={true}
              validation={validateActivationKey}
              showKeys={showKeys}
              onToggleVisibility={toggleKeyVisibility}
            />
            {settings.activationKey && validateActivationKey(settings.activationKey) && (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid activation key
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Configuration Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Proxy', status: settings.proxyString ? 'configured' : 'pending' },
            { label: 'DaisySMS', status: settings.daisySmsApiKey ? 'configured' : 'pending' },
            { label: 'WebDriver', status: settings.webdriverAgentUrl ? 'configured' : 'pending' },
            { label: 'License', status: validateActivationKey(settings.activationKey) ? 'active' : 'inactive' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-blue-700">{item.label}</span>
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'configured' || item.status === 'active' 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`desktop-button flex items-center px-4 py-2 text-xs font-medium rounded-md ${
            saveStatus === 'saving'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm'
          }`}
        >
          <Save className="w-3 h-3 mr-2" />
          {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default Configuration;

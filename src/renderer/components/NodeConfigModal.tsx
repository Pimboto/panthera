import React, { useState, useEffect } from 'react';
import { CloseSquare } from 'iconsax-reactjs';

interface NodeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: any;
  onSave: (nodeId: string, config: any) => void;
  selectors: Record<string, string>;
}

// Action parameter configurations based on AVALIABLE_ACTIONS.JSON
const actionConfigs: Record<string, any> = {
  click: {
    requiredParams: ['coordinates'],
    optionalParams: ['waitAfter'],
    fields: [
      { name: 'coordinates.x', label: 'X Coordinate', type: 'number', required: true },
      { name: 'coordinates.y', label: 'Y Coordinate', type: 'number', required: true },
      { name: 'waitAfter', label: 'Wait After (ms)', type: 'number', required: false },
    ],
  },
  findAndClick: {
    requiredParams: ['selector'],
    optionalParams: ['timeout', 'waitAfter'],
    fields: [
      { name: 'selector', label: 'Element Selector', type: 'selector', required: true },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false, default: 10000 },
      { name: 'waitAfter', label: 'Wait After (ms)', type: 'number', required: false },
    ],
  },
  type: {
    requiredParams: ['text'],
    optionalParams: ['selector', 'clearFirst', 'timeout'],
    fields: [
      { name: 'text', label: 'Text to Type', type: 'text', required: true },
      { name: 'selector', label: 'Element Selector', type: 'selector', required: false },
      { name: 'clearFirst', label: 'Clear First', type: 'boolean', required: false },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false },
    ],
  },
  wait: {
    requiredParams: ['duration'],
    fields: [
      { name: 'duration', label: 'Duration (ms)', type: 'number', required: true, default: 2000 },
    ],
  },
  openApp: {
    requiredParams: ['bundleId'],
    optionalParams: ['waitAfter'],
    fields: [
      { name: 'bundleId', label: 'Bundle ID', type: 'text', required: true, placeholder: 'com.apple.mobileslideshow' },
      { name: 'waitAfter', label: 'Wait After (ms)', type: 'number', required: false },
    ],
  },
  pressButton: {
    requiredParams: ['button'],
    optionalParams: ['waitAfter'],
    fields: [
      { name: 'button', label: 'Button', type: 'select', required: true, options: ['home', 'volumeUp', 'volumeDown', 'power'] },
      { name: 'waitAfter', label: 'Wait After (ms)', type: 'number', required: false },
    ],
  },
  swipe: {
    requiredParams: ['from', 'to'],
    optionalParams: ['duration', 'direction'],
    fields: [
      { name: 'from.x', label: 'From X', type: 'number', required: true },
      { name: 'from.y', label: 'From Y', type: 'number', required: true },
      { name: 'to.x', label: 'To X', type: 'number', required: true },
      { name: 'to.y', label: 'To Y', type: 'number', required: true },
      { name: 'duration', label: 'Duration (ms)', type: 'number', required: false, default: 1000 },
    ],
  },
  waitForElement: {
    requiredParams: ['selector'],
    optionalParams: ['timeout', 'interval'],
    fields: [
      { name: 'selector', label: 'Element Selector', type: 'selector', required: true },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false, default: 10000 },
      { name: 'interval', label: 'Check Interval (ms)', type: 'number', required: false, default: 1000 },
    ],
  },
  extractText: {
    requiredParams: ['selector'],
    optionalParams: ['saveToContext', 'timeout'],
    fields: [
      { name: 'selector', label: 'Element Selector', type: 'selector', required: true },
      { name: 'saveToContext', label: 'Save to Context Key', type: 'text', required: false },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false },
    ],
  },
  ifExists: {
    requiredParams: ['selector'],
    optionalParams: ['timeout'],
    fields: [
      { name: 'selector', label: 'Element Selector', type: 'selector', required: true },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false, default: 3000 },
    ],
  },
  loop: {
    requiredParams: ['iterations'],
    optionalParams: ['delayBetween'],
    fields: [
      { name: 'iterations', label: 'Number of Iterations', type: 'number', required: true, default: 5 },
      { name: 'delayBetween', label: 'Delay Between (ms)', type: 'number', required: false },
    ],
  },
  setContext: {
    requiredParams: ['key', 'value'],
    fields: [
      { name: 'key', label: 'Context Key', type: 'text', required: true },
      { name: 'value', label: 'Value', type: 'text', required: true },
    ],
  },
  getContext: {
    requiredParams: ['key'],
    fields: [
      { name: 'key', label: 'Context Key', type: 'text', required: true },
    ],
  },
  apiCall: {
    requiredParams: ['url'],
    optionalParams: ['method', 'headers', 'data', 'saveToContext', 'timeout'],
    fields: [
      { name: 'url', label: 'URL', type: 'text', required: true },
      { name: 'method', label: 'Method', type: 'select', required: false, default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE'] },
      { name: 'saveToContext', label: 'Save to Context', type: 'text', required: false },
      { name: 'timeout', label: 'Timeout (ms)', type: 'number', required: false },
    ],
  },
};

const NodeConfigModal: React.FC<NodeConfigModalProps> = ({ isOpen, onClose, node, onSave, selectors }) => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (node && node.data.config) {
      setConfig(node.data.config);
    } else {
      setConfig({});
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const actionType = node.data.actionType;
  const actionConfig = actionConfigs[actionType];

  if (!actionConfig) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Configure {actionType}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <CloseSquare size={24} />
            </button>
          </div>
          <p className="text-gray-500">No configuration available for this action type.</p>
        </div>
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig((prev: any) => {
      const keys = fieldName.split('.');
      if (keys.length === 1) {
        return { ...prev, [fieldName]: value };
      } else {
        // Handle nested properties like coordinates.x
        const newConfig = { ...prev };
        let current = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newConfig;
      }
    });
  };

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const renderField = (field: any) => {
    const value = field.name.includes('.')
      ? field.name.split('.').reduce((obj: any, key: string) => obj?.[key], config)
      : config[field.name];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || field.default || ''}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="mr-2"
            />
            <span>Enable</span>
          </label>
        );
      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {field.options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'selector':
        return (
          <div className="space-y-2">
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a selector...</option>
              {Object.entries(selectors).map(([key, selectorValue]) => (
                <option key={key} value={`$${key}`}>
                  ${key}
                </option>
              ))}
              <option value="custom">Custom selector...</option>
            </select>
            {value === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom selector"
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Configure {actionType}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseSquare size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {actionConfig.fields.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigModal;
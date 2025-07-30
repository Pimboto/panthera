import { useState, useCallback, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Code, Play, Export, Add, Trash, Setting4, AddSquare } from 'iconsax-reactjs';
import { useToast } from '../hooks/useToast';
import NodeConfigModal from './NodeConfigModal';

interface WorkflowBuilderProps {
  toast: ReturnType<typeof useToast>;
}

// Available action categories based on AVALIABLE_ACTIONS.JSON
const actionCategories = {
  basic: {
    name: 'Basic Actions',
    color: '#3b82f6',
    actions: ['click', 'findAndClick', 'type', 'wait'],
  },
  navigation: {
    name: 'Navigation',
    color: '#10b981',
    actions: ['openApp', 'pressButton', 'swipe'],
  },
  advanced: {
    name: 'Advanced',
    color: '#8b5cf6',
    actions: ['waitForElement', 'extractText', 'performActions'],
  },
  conditional: {
    name: 'Conditional',
    color: '#f59e0b',
    actions: ['ifExists', 'loop'],
  },
  data: {
    name: 'Data',
    color: '#ef4444',
    actions: ['setContext', 'getContext', 'apiCall'],
  },
};

// Action details mapping
const actionDetails: Record<string, { description: string; icon?: string }> = {
  click: { description: 'Click at specific coordinates' },
  findAndClick: { description: 'Find element by selector and click it' },
  type: { description: 'Type text in element or active field' },
  wait: { description: 'Wait for specified duration' },
  openApp: { description: 'Open application by bundle ID' },
  pressButton: { description: 'Press device button' },
  swipe: { description: 'Swipe from one point to another' },
  waitForElement: { description: 'Wait for element to appear' },
  extractText: { description: 'Extract text from element' },
  performActions: { description: 'Perform complex gestures' },
  ifExists: { description: 'Conditional action based on element' },
  loop: { description: 'Repeat actions multiple times' },
  setContext: { description: 'Save value to context' },
  getContext: { description: 'Retrieve value from context' },
  apiCall: { description: 'Make HTTP API call' },
};

const nodeTypes = {
  actionNode: ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
    const isConditional = data.actionType === 'ifExists' || data.actionType === 'loop';
    
    return (
      <div className="relative">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-gray-500 border-2 border-white"
        />
        <div
          className={`px-4 py-2 shadow-lg rounded-lg border-2 bg-white ${
            data.selected ? 'border-blue-500' : 'border-gray-200'
          } min-w-[180px]`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: data.color || '#3b82f6' }}
              />
              <div className="font-medium text-sm">{data.label}</div>
            </div>
            {data.onSettings && (
              <button
                onClick={data.onSettings}
                className="text-gray-400 hover:text-gray-600"
              >
                <Setting4 size={16} />
              </button>
            )}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-1">{data.description}</div>
          )}
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="text-xs text-gray-400 mt-1">Configured ✓</div>
          )}
        </div>
        {isConditional ? (
          <>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              isConnectable={isConnectable}
              className="w-3 h-3 bg-green-500 border-2 border-white left-1/4"
              style={{ left: '25%' }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              isConnectable={isConnectable}
              className="w-3 h-3 bg-red-500 border-2 border-white right-1/4"
              style={{ left: '75%' }}
            />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2">
              <span className="text-xs text-green-600">Yes</span>
              <span className="text-xs text-red-600">No</span>
            </div>
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-gray-500 border-2 border-white"
          />
        )}
      </div>
    );
  },
  startNode: ({ isConnectable }: { isConnectable: boolean }) => (
    <div className="relative">
      <div className="px-4 py-2 shadow-lg rounded-lg bg-green-500 text-white border-2 border-green-600">
        <div className="font-medium">Start</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-600 border-2 border-white"
      />
    </div>
  ),
  endNode: ({ isConnectable }: { isConnectable: boolean }) => (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-600 border-2 border-white"
      />
      <div className="px-4 py-2 shadow-lg rounded-lg bg-red-500 text-white border-2 border-red-600">
        <div className="font-medium">End</div>
      </div>
    </div>
  ),
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'startNode',
    position: { x: 250, y: 0 },
    data: { label: 'Start' },
  },
  {
    id: 'end',
    type: 'endNode',
    position: { x: 250, y: 400 },
    data: { label: 'End' },
  },
];

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ toast }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState('New Flow');
  const [flowDescription, setFlowDescription] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  const [selectors, setSelectors] = useState<Record<string, string>>({});
  const [newSelectorName, setNewSelectorName] = useState('');
  const [newSelectorValue, setNewSelectorValue] = useState('');

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      ),
    []
  );

  const onInit = (rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const category = event.dataTransfer.getData('category');

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: 'actionNode',
        position,
        data: {
          label: type,
          actionType: type,
          description: actionDetails[type]?.description,
          color: Object.values(actionCategories).find((cat) =>
            cat.actions.includes(type)
          )?.color,
          config: {},
          onSettings: () => {
            setConfigNode(newNode);
            setIsConfigModalOpen(true);
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, toast]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // Update node data with onSettings callback
    if (node.type === 'actionNode') {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                onSettings: () => {
                  setConfigNode(node);
                  setIsConfigModalOpen(true);
                },
              },
            };
          }
          return n;
        })
      );
    }
  }, []);

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode && selectedNode.id !== 'start' && selectedNode.id !== 'end') {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
      );
      setSelectedNode(null);
      toast.showSuccess('Deleted', 'Node removed from workflow');
    }
  }, [selectedNode, toast]);

  const handleNodeConfigSave = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
            },
          };
        }
        return node;
      })
    );
    toast.showSuccess('Saved', 'Node configuration saved');
  }, [toast]);

  const addSelector = useCallback(() => {
    if (newSelectorName && newSelectorValue) {
      setSelectors((prev) => ({
        ...prev,
        [newSelectorName]: newSelectorValue,
      }));
      setNewSelectorName('');
      setNewSelectorValue('');
      toast.showSuccess('Added', 'Selector added successfully');
    } else {
      toast.showError('Error', 'Please fill both selector name and value');
    }
  }, [newSelectorName, newSelectorValue, toast]);

  const exportFlow = useCallback(() => {
    // Generate the flow JSON based on the guide structure
    const flowDefinition = {
      flowDefinition: {
        flowId: flowName.toLowerCase().replace(/\s+/g, '-'),
        name: flowName,
        type: 'custom',
        version: '1.0.0',
        description: flowDescription,
        author: 'workflow-builder',
        tags: ['visual-builder'],
        selectors: selectors,
        checkpoints: nodes
          .filter((node) => node.type === 'actionNode')
          .map((node, index) => ({
            id: `step-${index + 1}`,
            name: `checkpoint${index + 1}`,
            type: 'interactive',
            timeout: 30000,
            critical: false,
            description: node.data.description,
            dependencies: index > 0 ? [`checkpoint${index}`] : [],
            actions: [
              {
                type: node.data.actionType,
                description: node.data.description,
                ...node.data.config,
              },
            ],
          })),
        options: {
          infinite: false,
          maxRuns: 1,
          runDelay: 0,
          metadata: {
            complexity: 'medium',
            estimatedDuration: 60000,
            requiresManualInput: false,
            supportedDevices: ['iOS'],
            minIOSVersion: '14.0',
          },
        },
      },
      userId: 'workflow-builder',
      overwrite: false,
    };

    const jsonStr = JSON.stringify(flowDefinition, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.showSuccess('Exported', 'Flow exported successfully');
  }, [nodes, flowName, flowDescription, selectors, toast]);

  const validateFlow = useCallback(() => {
    // Check if there are any action nodes
    const actionNodes = nodes.filter((node) => node.type === 'actionNode');
    if (actionNodes.length === 0) {
      toast.showError('Validation Failed', 'Flow must contain at least one action');
      return false;
    }

    // Check if all nodes are connected
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const unconnectedNodes = nodes.filter(
      (node) => !connectedNodeIds.has(node.id) && node.id !== 'start' && node.id !== 'end'
    );

    if (unconnectedNodes.length > 0) {
      toast.showError('Validation Failed', 'All nodes must be connected');
      return false;
    }

    toast.showSuccess('Valid', 'Flow is valid and ready to export');
    return true;
  }, [nodes, edges, toast]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-white desktop-card p-4 overflow-y-auto">
        <h3 className="font-semibold text-lg mb-4">Flow Details</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flow Name
            </label>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-4 mt-6">Selectors</h3>
        <div className="space-y-2 mb-6">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Selector name"
              value={newSelectorName}
              onChange={(e) => setNewSelectorName(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="XPath selector"
              value={newSelectorValue}
              onChange={(e) => setNewSelectorValue(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addSelector}
              className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              <AddSquare size={16} />
              Add Selector
            </button>
          </div>
          {Object.entries(selectors).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(selectors).map(([name, value]) => (
                <div key={name} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">${name}</div>
                  <div className="text-gray-500 truncate">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-4">Actions</h3>
        <div className="space-y-4">
          {Object.entries(actionCategories).map(([key, category]) => (
            <div key={key}>
              <h4 className="font-medium text-sm text-gray-700 mb-2">{category.name}</h4>
              <div className="space-y-2">
                {category.actions.map((action) => (
                  <div
                    key={action}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('application/reactflow', action);
                      event.dataTransfer.setData('category', key);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow Editor */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            setIsFlowValid(false);
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            setIsFlowValid(false);
          }}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
          <MiniMap />
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={validateFlow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Play size={16} />
              Validate
            </button>
            <button
              onClick={exportFlow}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Export size={16} />
              Export
            </button>
            {selectedNode && selectedNode.id !== 'start' && selectedNode.id !== 'end' && (
              <button
                onClick={deleteSelectedNode}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <Trash size={16} />
                Delete
              </button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      <NodeConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setConfigNode(null);
        }}
        node={nodes.find(n => n.id === configNode?.id) || configNode}
        onSave={handleNodeConfigSave}
        selectors={selectors}
      />
    </div>
  );
};

// Wrap with ReactFlowProvider
const WorkflowBuilderWrapper: React.FC<WorkflowBuilderProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowBuilder {...props} />
  </ReactFlowProvider>
);

export default WorkflowBuilderWrapper;
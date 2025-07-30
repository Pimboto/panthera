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
import { Code, Play, Export, Add, Trash, Setting4, AddSquare, Import, Hierarchy2, Edit, CloseSquare, Box1 } from 'iconsax-reactjs';
import { useToast } from '../hooks/useToast';
import NodeConfigModal from './NodeConfigModal';
import dagre from 'dagre';

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
    actions: ['ifExists'],
  },
  flow: {
    name: 'Flow Control',
    color: '#ec4899',
    actions: ['loop'],
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
      <div className="relative" style={{ zIndex: 10 }}> {/* Ensure actions are above areas */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-gray-500 border-2 border-white"
        />
        <div
          className={`px-4 py-2 shadow-lg rounded-lg border-2 bg-white ${
            data.multiSelected 
              ? 'border-purple-500 bg-purple-50' 
              : data.selected 
                ? 'border-blue-500' 
                : 'border-gray-200'
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
          {data.checkpointGroup && (
            <div className="text-xs text-blue-600 mt-1 font-medium">📋 {data.checkpointGroup}</div>
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
    <div className="relative" style={{ zIndex: 10 }}>
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
    <div className="relative" style={{ zIndex: 10 }}>
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
  checkpointArea: ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
    // Calculate dynamic size based on contained actions
    const minWidth = 300;
    const minHeight = 200;
    const padding = 20;
    
    const width = Math.max(minWidth, data.contentWidth || minWidth);
    const height = Math.max(minHeight, data.contentHeight || minHeight);
    
    return (
      <div 
        className={`checkpoint-area-node relative border-2 border-dashed rounded-lg p-4 ${
          data.isDropTarget 
            ? 'border-green-400 bg-green-50' 
            : 'border-purple-400 bg-purple-50'
        } transition-colors`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          zIndex: 0, // Normal z-index
          position: 'relative',
        }}
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full"
          style={{ top: '-8px', left: '50%', transform: 'translateX(-50%)' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full"
          style={{ bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }}
        />
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2 flex-1">
            <Box1 size={20} color="#8b5cf6" variant="Bulk" />
            {data.isEditing ? (
              <input
                type="text"
                value={data.editingName || data.label}
                onChange={(e) => data.onNameChange && data.onNameChange(e.target.value)}
                onBlur={data.onNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    data.onNameSave && data.onNameSave();
                  } else if (e.key === 'Escape') {
                    data.onNameCancel && data.onNameCancel();
                  }
                }}
                className="font-medium text-purple-800 bg-white border border-purple-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <span 
                className="font-medium text-purple-800 cursor-pointer hover:text-purple-600"
                onDoubleClick={data.onEdit}
              >
                {data.label}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {!data.isEditing && (
              <>
                <button
                  onClick={data.onEdit}
                  className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded"
                >
                  <Edit size={16} />
                </button>
                {data.onDelete && (
                  <button
                    onClick={data.onDelete}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-purple-600 mb-2 relative z-10">
          {data.actionCount || 0} actions
        </div>
        {(!data.actionCount || data.actionCount === 0) && (
          <div className="absolute inset-4 border border-dashed border-purple-300 rounded flex items-center justify-center">
            <div className="text-purple-400 text-center">
              <Box1 size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm">Checkpoint: {data.label}</div>
            </div>
          </div>
        )}
      </div>
    );
  },
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

// Function to generate checkpoints from checkpoint areas
const generateCheckpoints = (nodes: Node[], edges: Edge[], checkpointGroups: Record<string, string>) => {
  const actionNodes = nodes.filter((node) => node.type === 'actionNode');
  const checkpointAreaNodes = nodes.filter((node) => node.type === 'checkpointArea');
  
  if (checkpointAreaNodes.length === 0 && actionNodes.length === 0) return [];

  console.log('Generating checkpoints...', { actionNodes: actionNodes.length, areas: checkpointAreaNodes.length });

  // Helper function to check if a node is inside an area
  const checkIfNodeInAreaExport = (nodePosition: {x: number, y: number}, areaNode: Node) => {
    const areaPos = areaNode.position;
    const areaWidth = areaNode.data.contentWidth || 300;
    const areaHeight = areaNode.data.contentHeight || 200;
    
    const isInside = (
      nodePosition.x >= areaPos.x &&
      nodePosition.x <= areaPos.x + areaWidth &&
      nodePosition.y >= areaPos.y + 60 && // Account for header
      nodePosition.y <= areaPos.y + areaHeight
    );
    
    console.log(`Checking if action at (${nodePosition.x}, ${nodePosition.y}) is inside area "${areaNode.data.label}" at (${areaPos.x}, ${areaPos.y}) with size ${areaWidth}x${areaHeight}: ${isInside}`);
    
    return isInside;
  };

  // Group actions by checkpoint areas
  const groupedNodes = new Map<string, Node[]>();
  
  // First, assign actions that are inside checkpoint areas
  checkpointAreaNodes.forEach(areaNode => {
    const actionsInArea = actionNodes.filter(actionNode => 
      checkIfNodeInAreaExport(actionNode.position, areaNode)
    );
    
    console.log(`Area "${areaNode.data.label}" contains ${actionsInArea.length} actions:`, actionsInArea.map(a => a.data.label));
    
    if (actionsInArea.length > 0) {
      groupedNodes.set(areaNode.data.label, actionsInArea);
    }
  });

  // Then, assign remaining actions to a default checkpoint
  const assignedActionIds = new Set<string>();
  groupedNodes.forEach(actions => {
    actions.forEach(action => assignedActionIds.add(action.id));
  });

  const unassignedActions = actionNodes.filter(node => !assignedActionIds.has(node.id));
  if (unassignedActions.length > 0) {
    console.log(`Found ${unassignedActions.length} unassigned actions, adding to default checkpoint`);
    groupedNodes.set('default', unassignedActions);
  }

  console.log('Final grouped nodes:', Object.fromEntries(groupedNodes));

  // Convert groups to checkpoints
  const checkpoints: any[] = [];
  const sortedGroups = Array.from(groupedNodes.entries()).sort(([a], [b]) => {
    // Put 'default' at the end
    if (a === 'default') return 1;
    if (b === 'default') return -1;
    return a.localeCompare(b);
  });
  
  sortedGroups.forEach(([checkpointName, groupNodes], index) => {
    // Create actions from nodes in this group - include ALL actions, not just configured ones
    const actions = groupNodes.map(node => {
      const baseAction = {
        type: node.data.actionType,
        description: node.data.description || `${node.data.actionType} action`,
      };
      
      // Add configuration if it exists and is not empty
      if (node.data.config && Object.keys(node.data.config).length > 0) {
        return { ...baseAction, ...node.data.config };
      }
      
      return baseAction;
    });

    console.log(`Creating checkpoint "${checkpointName}" with ${actions.length} actions:`, actions);

    if (actions.length > 0) {
      const checkpoint = {
        id: `checkpoint-${checkpointName.toLowerCase().replace(/\s+/g, '-')}`,
        name: checkpointName,
        type: 'interactive' as const,
        timeout: 30000,
        critical: false,
        description: actions.length === 1 
          ? actions[0].description 
          : `${checkpointName}: ${actions.map(a => a.type).join(', ')}`,
        dependencies: index > 0 ? [`checkpoint-${sortedGroups[index - 1][0].toLowerCase().replace(/\s+/g, '-')}`] : [],
        actions,
      };
      
      checkpoints.push(checkpoint);
    }
  });

  console.log('Generated checkpoints:', checkpoints);
  return checkpoints;
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ toast }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [flowName, setFlowName] = useState('New Flow');
  const [flowDescription, setFlowDescription] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  const [selectors, setSelectors] = useState<Record<string, string>>({});
  const [newSelectorName, setNewSelectorName] = useState('');
  const [newSelectorValue, setNewSelectorValue] = useState('');
  const [isFlowValid, setIsFlowValid] = useState(false);
  const [editingSelector, setEditingSelector] = useState<string | null>(null);
  const [editSelectorName, setEditSelectorName] = useState('');
  const [editSelectorValue, setEditSelectorValue] = useState('');
  const [checkpointGroups, setCheckpointGroups] = useState<Record<string, string>>({});
  const [availableCheckpoints, setAvailableCheckpoints] = useState<string[]>(['checkpoint1']);
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [checkpointAreas, setCheckpointAreas] = useState<Map<string, {name: string, position: {x: number, y: number}}>>(new Map());
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragTargetAreas, setDragTargetAreas] = useState<Set<string>>(new Set());

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

  // Helper functions - declared first to avoid initialization errors
  const calculateAreaBounds = useCallback((areaNode: Node, actionNodes: Node[]) => {
    const actionsInArea = actionNodes.filter(actionNode => {
      const areaPos = areaNode.position;
      const nodePos = actionNode.position;
      // Use basic overlap check first
      return (
        nodePos.x > areaPos.x - 100 && // Give some tolerance
        nodePos.x < areaPos.x + 800 &&  // INCREASED TOLERANCE
        nodePos.y > areaPos.y - 50 &&
        nodePos.y < areaPos.y + 600      // INCREASED TOLERANCE
      );
    });

    if (actionsInArea.length === 0) {
      return { width: 300, height: 200 };
    }

    // Calculate bounding box of all actions with GENEROUS space
    const padding = 60; // INCREASED padding
    const nodeWidth = 180;
    const nodeHeight = 70;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    actionsInArea.forEach(actionNode => {
      const relativeX = actionNode.position.x - areaNode.position.x;
      const relativeY = actionNode.position.y - areaNode.position.y;
      
      minX = Math.min(minX, relativeX);
      maxX = Math.max(maxX, relativeX + nodeWidth);
      minY = Math.min(minY, relativeY);
      maxY = Math.max(maxY, relativeY + nodeHeight);
    });

    // REMOVE LIMITS - let area grow as much as needed
    const contentWidth = Math.max(400, maxX - Math.min(minX, 0) + padding * 2); // MIN 400px
    const contentHeight = Math.max(300, maxY - Math.min(minY, 80) + padding * 2); // MIN 300px, 80px for header

    console.log(`Area "${areaNode.data.label}" calculated size: ${contentWidth}x${contentHeight} for ${actionsInArea.length} actions`);

    return { width: contentWidth, height: contentHeight };
  }, []);

  const checkIfNodeInArea = useCallback((nodePosition: {x: number, y: number}, areaNode: Node) => {
    const areaPos = areaNode.position;
    const areaWidth = areaNode.data.contentWidth || 300;
    const areaHeight = areaNode.data.contentHeight || 200;
    
    // Add some tolerance to the boundaries for better detection
    const tolerance = 10;
    const headerHeight = 80;
    
    return (
      nodePosition.x >= areaPos.x - tolerance &&
      nodePosition.x <= areaPos.x + areaWidth + tolerance &&
      nodePosition.y >= areaPos.y + headerHeight - tolerance &&
      nodePosition.y <= areaPos.y + areaHeight + tolerance
    );
  }, []);


  // Inline editing functions
  const startInlineEdit = useCallback((areaId: string, currentName: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === areaId) {
          return {
            ...node,
            data: {
              ...node.data,
              isEditing: true,
              editingName: currentName,
            },
          };
        }
        return node;
      })
    );
  }, []);

  const handleInlineNameChange = useCallback((areaId: string, newName: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === areaId) {
          return {
            ...node,
            data: {
              ...node.data,
              editingName: newName,
            },
          };
        }
        return node;
      })
    );
  }, []);

  const saveInlineEdit = useCallback((areaId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === areaId && node.data.editingName?.trim()) {
          const newName = node.data.editingName.trim();
          
          // Update checkpoint areas map
          setCheckpointAreas(prev => {
            const newMap = new Map(prev);
            const area = newMap.get(areaId);
            if (area) {
              newMap.set(areaId, { ...area, name: newName });
            }
            return newMap;
          });

          toast.showSuccess('Updated', `Checkpoint area renamed to "${newName}"`);

          return {
            ...node,
            data: {
              ...node.data,
              label: newName,
              isEditing: false,
              editingName: '',
            },
          };
        }
        return node;
      })
    );
  }, [toast]);

  const cancelInlineEdit = useCallback((areaId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === areaId) {
          return {
            ...node,
            data: {
              ...node.data,
              isEditing: false,
              editingName: '',
            },
          };
        }
        return node;
      })
    );
  }, []);

  const deleteCheckpointArea = useCallback((areaId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== areaId));
    setCheckpointAreas(prev => {
      const newMap = new Map(prev);
      newMap.delete(areaId);
      return newMap;
    });

    // Remove associations for actions that were in this area
    setCheckpointGroups(prev => {
      const newGroups = { ...prev };
      Object.keys(newGroups).forEach(nodeId => {
        if (newGroups[nodeId] === areaId) {
          delete newGroups[nodeId];
        }
      });
      return newGroups;
    });

    toast.showSuccess('Deleted', 'Checkpoint area deleted');
  }, [toast]);

  const updateActionCountInAreas = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'checkpointArea') {
          const actionNodes = nds.filter(n => n.type === 'actionNode');
          const bounds = calculateAreaBounds(node, actionNodes);
          
          // Count actions within current bounds (WITHOUT changing node positions)
          const actionsInArea = actionNodes.filter(actionNode => 
            checkIfNodeInArea(actionNode.position, node)
          ).length;
          
          // Update ONLY the area node, preserving all handlers
          return {
            ...node,
            data: {
              ...node.data,
              contentWidth: bounds.width,
              contentHeight: bounds.height,
              actionCount: actionsInArea,
              onEdit: () => startInlineEdit(node.id, node.data.label),
              onNameChange: (newName: string) => handleInlineNameChange(node.id, newName),
              onNameSave: () => saveInlineEdit(node.id),
              onNameCancel: () => cancelInlineEdit(node.id),
              onDelete: () => deleteCheckpointArea(node.id),
            },
          };
        }
        return node; // Return action nodes UNCHANGED
      })
    );
  }, [calculateAreaBounds, checkIfNodeInArea, startInlineEdit, handleInlineNameChange, saveInlineEdit, cancelInlineEdit, deleteCheckpointArea]);

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

      const newNodeId = `${type}_${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
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
            const nodeToEdit = nodes.find(n => n.id === newNodeId);
            if (nodeToEdit) {
              setConfigNode(nodeToEdit);
              setIsConfigModalOpen(true);
            }
          },
        },
        draggable: true,
        connectable: true,
        selectable: true,
      };

      setNodes((nds) => nds.concat(newNode));
      // Update area sizes after adding new node
      setTimeout(updateActionCountInAreas, 100);
    },
    [reactFlowInstance, toast]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const isMultiSelect = event.ctrlKey || event.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
    
    if (isMultiSelect && node.type === 'actionNode') {
      // Multi-select mode
      setSelectedNodes(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(node.id)) {
          newSelected.delete(node.id);
        } else {
          newSelected.add(node.id);
        }
        return newSelected;
      });
      
      // Update node visual selection
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            const isSelected = !selectedNodes.has(node.id);
            return {
              ...n,
              data: {
                ...n.data,
                multiSelected: isSelected,
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
    } else {
      // Single select mode
      setSelectedNode(node);
      setSelectedNodes(new Set()); // Clear multi-selection
      
      // Clear multi-selection visual indicators
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            multiSelected: false,
            onSettings: n.type === 'actionNode' ? () => {
              setConfigNode(n);
              setIsConfigModalOpen(true);
            } : n.data.onSettings,
          },
        }))
      );
      
      // Update single selected node
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
    }
  }, [selectedNodes]);

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
              // Preserve all handlers and properties to prevent node updates
              onSettings: () => {
                setConfigNode(node);
                setIsConfigModalOpen(true);
              },
            },
          };
        }
        return node;
      })
    );
    toast.showSuccess('Saved', 'Node configuration saved');
    
    // DO NOT call updateActionCountInAreas here - it moves nodes!
  }, [toast]);

  const importFlow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (data.flowDefinition) {
            const flowDef = data.flowDefinition;
            
            // Set flow details
            setFlowName(flowDef.name || 'Imported Flow');
            setFlowDescription(flowDef.description || '');
            setSelectors(flowDef.selectors || {});
            
            // Import checkpoint groups if available
            if (flowDef.checkpointGroups) {
              setCheckpointGroups(flowDef.checkpointGroups);
              const uniqueCheckpoints = [...new Set(Object.values(flowDef.checkpointGroups))];
              setAvailableCheckpoints(uniqueCheckpoints.length > 0 ? uniqueCheckpoints : ['checkpoint1']);
            }
            
            // Check if we have visual layout (new format)
            if (flowDef.visualLayout) {
              // Import with full visual layout and connections
              const importedNodes = flowDef.visualLayout.nodes.map((node: any) => {
                let nodeData = { ...node.data };
                
                // Set up handlers for different node types
                if (node.type === 'actionNode') {
                  // IMPORTANT: Create a closure with the imported node data
                  const currentNode = node;
                  nodeData.onSettings = () => {
                    setConfigNode(currentNode);
                    setIsConfigModalOpen(true);
                  };
                } else if (node.type === 'checkpointArea') {
                  const areaId = node.id;
                  nodeData.onEdit = () => startInlineEdit(areaId, nodeData.label);
                  nodeData.onNameChange = (newName: string) => handleInlineNameChange(areaId, newName);
                  nodeData.onNameSave = () => saveInlineEdit(areaId);
                  nodeData.onNameCancel = () => cancelInlineEdit(areaId);
                  nodeData.onDelete = () => deleteCheckpointArea(areaId);
                }
                
                return {
                  ...node,
                  data: nodeData,
                  draggable: true,
                  connectable: true,
                  selectable: true,
                };
              });
              
              const importedEdges = flowDef.visualLayout.edges.map((edge: any) => ({
                ...edge,
                id: edge.id || `edge-${edge.source}-${edge.target}`,
                type: edge.type || 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
                sourceHandle: edge.sourceHandle || null,
                targetHandle: edge.targetHandle || null,
              }));
              
              console.log('Importing edges:', importedEdges);
              
              setNodes(importedNodes);
              setEdges(importedEdges);
              
              // Update checkpoint areas map
              const checkpointAreaNodes = importedNodes.filter(n => n.type === 'checkpointArea');
              const newCheckpointAreas = new Map();
              checkpointAreaNodes.forEach(node => {
                newCheckpointAreas.set(node.id, { 
                  name: node.data.label, 
                  position: node.position 
                });
              });
              setCheckpointAreas(newCheckpointAreas);
              
              // Update area sizes after import and force re-render
              setTimeout(() => {
                updateActionCountInAreas();
                console.log('Import complete - nodes:', importedNodes.length, 'edges:', importedEdges.length);
                
                // Force React Flow to recalculate connections
                if (reactFlowInstance) {
                  reactFlowInstance.fitView({ padding: 0.1 });
                }
              }, 100);
            } else {
              // Fallback to old format - convert checkpoints to nodes
              const newNodes: Node[] = [
                {
                  id: 'start',
                  type: 'startNode',
                  position: { x: 250, y: 0 },
                  data: { label: 'Start' },
                },
              ];
              
              flowDef.checkpoints?.forEach((checkpoint: any, index: number) => {
                const action = checkpoint.actions?.[0];
                if (action) {
                  newNodes.push({
                    id: checkpoint.id || `imported_${index}`,
                    type: 'actionNode',
                    position: { x: 250, y: 100 + index * 100 },
                    data: {
                      label: action.type,
                      actionType: action.type,
                      description: action.description || actionDetails[action.type]?.description,
                      color: Object.values(actionCategories).find((cat) =>
                        cat.actions.includes(action.type)
                      )?.color,
                      config: action,
                    },
                  });
                }
              });
              
              newNodes.push({
                id: 'end',
                type: 'endNode',
                position: { x: 250, y: 100 + (flowDef.checkpoints?.length || 0) * 100 },
                data: { label: 'End' },
              });
              
              setNodes(newNodes);
              setEdges([]);
            }
            
            setIsFlowValid(false);
            toast.showSuccess('Imported', 'Flow imported successfully with connections');
          }
        } catch (error) {
          toast.showError('Error', 'Invalid flow file');
        }
      }
    };
    input.click();
  }, [toast]);

  const autoLayout = useCallback(() => {
    console.log('=== STARTING AUTO-LAYOUT ===');
    
    // Get current state
    const checkpointAreas = nodes.filter(n => n.type === 'checkpointArea');
    const actionNodes = nodes.filter(n => n.type === 'actionNode');
    const startEndNodes = nodes.filter(n => n.type === 'startNode' || n.type === 'endNode');
    
    console.log('Current nodes:', {
      areas: checkpointAreas.length,
      actions: actionNodes.length,
      startEnd: startEndNodes.length
    });
    
    // Create result array starting with existing nodes
    const layoutedNodes: Node[] = [];

    // 1. FIRST: Layout checkpoint areas and start/end nodes vertically
    const mainGraph = new dagre.graphlib.Graph();
    mainGraph.setDefaultEdgeLabel(() => ({}));
    mainGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

    // Add main nodes to graph
    [...checkpointAreas, ...startEndNodes].forEach((node) => {
      const width = node.type === 'checkpointArea' ? (node.data.contentWidth || 350) : 180;
      const height = node.type === 'checkpointArea' ? (node.data.contentHeight || 250) : 50;
      mainGraph.setNode(node.id, { width, height });
    });

    // Add main edges (between areas and start/end)
    edges.forEach((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && 
          (sourceNode.type === 'checkpointArea' || sourceNode.type === 'startNode' || sourceNode.type === 'endNode') &&
          (targetNode.type === 'checkpointArea' || targetNode.type === 'startNode' || targetNode.type === 'endNode')) {
        mainGraph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(mainGraph);

    // Position main nodes
    [...checkpointAreas, ...startEndNodes].forEach((node) => {
      const nodeWithPosition = mainGraph.node(node.id);
      const newPosition = {
        x: nodeWithPosition.x - (node.type === 'checkpointArea' ? (node.data.contentWidth || 350) / 2 : 90),
        y: nodeWithPosition.y - (node.type === 'checkpointArea' ? (node.data.contentHeight || 250) / 2 : 25),
      };
      
      layoutedNodes.push({
        ...node,
        position: newPosition,
      });
    });

    // 2. SECOND: For each area, organize its actions INSIDE
    checkpointAreas.forEach((originalArea) => {
      const layoutedArea = layoutedNodes.find(n => n.id === originalArea.id);
      if (!layoutedArea) return;

      // Find actions currently in this area
      const actionsInThisArea = actionNodes.filter(actionNode => 
        checkIfNodeInArea(actionNode.position, originalArea)
      );

      console.log(`Area "${originalArea.data.label}" has ${actionsInThisArea.length} actions:`, 
        actionsInThisArea.map(a => a.data.label));

      if (actionsInThisArea.length === 0) return;

      // VERTICAL layout - organize actions TOP-DOWN with proper connections
      const areaPos = layoutedArea.position;
      const padding = 40;
      const headerHeight = 90;
      const actionWidth = 180;
      const actionHeight = 80;
      const spacingY = 40; // Vertical spacing between actions

      // Create a mini dagre graph for actions to respect their connections
      const actionGraph = new dagre.graphlib.Graph();
      actionGraph.setDefaultEdgeLabel(() => ({}));
      actionGraph.setGraph({ rankdir: 'TB', nodesep: spacingY, ranksep: spacingY });

      // Add all actions to the graph
      actionsInThisArea.forEach((actionNode) => {
        actionGraph.setNode(actionNode.id, { width: actionWidth, height: actionHeight });
      });

      // Add edges between actions that are connected
      edges.forEach((edge) => {
        const source = actionsInThisArea.find(n => n.id === edge.source);
        const target = actionsInThisArea.find(n => n.id === edge.target);
        if (source && target) {
          actionGraph.setEdge(edge.source, edge.target);
        }
      });

      // Apply dagre layout
      dagre.layout(actionGraph);

      // Position actions vertically centered in the area
      let minY = Infinity, maxY = -Infinity;
      actionsInThisArea.forEach((actionNode) => {
        const nodePosition = actionGraph.node(actionNode.id);
        minY = Math.min(minY, nodePosition.y);
        maxY = Math.max(maxY, nodePosition.y);
      });

      const totalHeight = maxY - minY + actionHeight;
      const centerX = areaPos.x + padding + actionWidth / 2;

      actionsInThisArea.forEach((actionNode) => {
        const nodePosition = actionGraph.node(actionNode.id);
        const x = centerX - actionWidth / 2;
        const y = areaPos.y + headerHeight + padding + (nodePosition.y - minY);

        layoutedNodes.push({
          ...actionNode,
          position: { x, y },
        });

        console.log(`Action "${actionNode.data.label}" positioned vertically at (${x}, ${y})`);
      });

      // Calculate the new area size needed
      const neededWidth = padding * 2 + actionWidth;
      const neededHeight = headerHeight + padding * 2 + totalHeight;

      // Update the layouted area size
      const areaIndex = layoutedNodes.findIndex(n => n.id === layoutedArea.id);
      if (areaIndex !== -1) {
        layoutedNodes[areaIndex] = {
          ...layoutedNodes[areaIndex],
          data: {
            ...layoutedNodes[areaIndex].data,
            contentWidth: Math.max(400, neededWidth),
            contentHeight: Math.max(250, neededHeight),
          },
        };
        console.log(`Updated area "${originalArea.data.label}" size to ${neededWidth}x${neededHeight}`);
      }
    });

    // 3. THIRD: Add actions not in any area
    const assignedActionIds = new Set();
    checkpointAreas.forEach(area => {
      const actionsInArea = actionNodes.filter(action => checkIfNodeInArea(action.position, area));
      actionsInArea.forEach(action => assignedActionIds.add(action.id));
    });

    const unassignedActions = actionNodes.filter(node => !assignedActionIds.has(node.id));
    unassignedActions.forEach((actionNode, index) => {
      layoutedNodes.push({
        ...actionNode,
        position: {
          x: 600 + (index % 2) * 220,
          y: 200 + Math.floor(index / 2) * 100,
        },
      });
    });

    console.log('Final layouted nodes:', layoutedNodes.length);
    
    // Apply the layout
    setNodes(layoutedNodes);
    
    toast.showSuccess('Organized', 'Actions organized within their checkpoint areas');
  }, [nodes, edges, toast, setNodes, checkIfNodeInArea]);

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

  const startEditingSelector = useCallback((name: string) => {
    setEditingSelector(name);
    setEditSelectorName(name);
    setEditSelectorValue(selectors[name]);
  }, [selectors]);

  const saveEditingSelector = useCallback(() => {
    if (editSelectorName && editSelectorValue && editingSelector) {
      const newSelectors = { ...selectors };
      // Delete old key if name changed
      if (editSelectorName !== editingSelector) {
        delete newSelectors[editingSelector];
      }
      newSelectors[editSelectorName] = editSelectorValue;
      setSelectors(newSelectors);
      setEditingSelector(null);
      setEditSelectorName('');
      setEditSelectorValue('');
      toast.showSuccess('Updated', 'Selector updated successfully');
    }
  }, [editingSelector, editSelectorName, editSelectorValue, selectors, toast]);

  const cancelEditingSelector = useCallback(() => {
    setEditingSelector(null);
    setEditSelectorName('');
    setEditSelectorValue('');
  }, []);

  const deleteSelector = useCallback((name: string) => {
    const newSelectors = { ...selectors };
    delete newSelectors[name];
    setSelectors(newSelectors);
    toast.showSuccess('Deleted', 'Selector deleted successfully');
  }, [selectors, toast]);

  const addCheckpointGroup = useCallback(() => {
    if (newCheckpointName && !availableCheckpoints.includes(newCheckpointName)) {
      setAvailableCheckpoints(prev => [...prev, newCheckpointName]);
      setNewCheckpointName('');
      toast.showSuccess('Added', 'Checkpoint group created');
    } else {
      toast.showError('Error', 'Please enter a unique checkpoint name');
    }
  }, [newCheckpointName, availableCheckpoints, toast]);

  const assignNodeToCheckpoint = useCallback((nodeId: string, checkpointName: string) => {
    setCheckpointGroups(prev => ({
      ...prev,
      [nodeId]: checkpointName
    }));
    toast.showSuccess('Assigned', `Node assigned to ${checkpointName}`);
  }, [toast]);

  const removeNodeFromCheckpoint = useCallback((nodeId: string) => {
    setCheckpointGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[nodeId];
      return newGroups;
    });
    toast.showSuccess('Removed', 'Node removed from checkpoint');
  }, [toast]);

  const assignMultipleNodesToCheckpoint = useCallback((nodeIds: string[], checkpointName: string) => {
    setCheckpointGroups(prev => {
      const newGroups = { ...prev };
      nodeIds.forEach(nodeId => {
        newGroups[nodeId] = checkpointName;
      });
      return newGroups;
    });
    
    // Update visual data for all nodes
    setNodes((nds) =>
      nds.map((node) => {
        if (nodeIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              checkpointGroup: checkpointName,
            },
          };
        }
        return node;
      })
    );
    
    toast.showSuccess('Assigned', `${nodeIds.length} nodes assigned to ${checkpointName}`);
  }, [toast]);

  const clearMultiSelection = useCallback(() => {
    setSelectedNodes(new Set());
    // Clear visual indicators
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          multiSelected: false,
        },
      }))
    );
  }, []);

  const createCheckpointArea = useCallback((name: string) => {
    const areaId = `checkpoint-area-${Date.now()}`;
    const newArea = {
      id: areaId,
      type: 'checkpointArea',
      position: { x: 100, y: 100 + checkpointAreas.size * 250 },
      data: {
        label: name,
        actionCount: 0,
        contentWidth: 300,
        contentHeight: 200,
        isEditing: false,
        editingName: '',
        onEdit: () => startInlineEdit(areaId, name),
        onNameChange: (newName: string) => handleInlineNameChange(areaId, newName),
        onNameSave: () => saveInlineEdit(areaId),
        onNameCancel: () => cancelInlineEdit(areaId),
        onDelete: () => deleteCheckpointArea(areaId),
      },
      draggable: true,
      selectable: true,
      zIndex: -1, // Ensure checkpoint areas are behind actions
    };

    setNodes((nds) => [...nds, newArea]);
    setCheckpointAreas(prev => new Map(prev).set(areaId, { name, position: newArea.position }));
    toast.showSuccess('Created', `Checkpoint area "${name}" created`);
  }, [checkpointAreas.size, toast, startInlineEdit, handleInlineNameChange, saveInlineEdit, cancelInlineEdit, deleteCheckpointArea]);


  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'actionNode') {
      setDraggingNode(node.id);
    }
  }, []);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'actionNode' && draggingNode === node.id) {
      // Find which checkpoint areas this node is over
      const checkpointAreaNodes = nodes.filter(n => n.type === 'checkpointArea');
      const targetAreas = new Set<string>();
      
      checkpointAreaNodes.forEach(areaNode => {
        if (checkIfNodeInArea(node.position, areaNode)) {
          targetAreas.add(areaNode.id);
        }
      });
      
      // Update drag target areas if changed
      if (targetAreas.size !== dragTargetAreas.size || 
          !Array.from(targetAreas).every(id => dragTargetAreas.has(id))) {
        setDragTargetAreas(targetAreas);
        
        // Update visual feedback for checkpoint areas
        setNodes((nds) =>
          nds.map((n) => {
            if (n.type === 'checkpointArea') {
              return {
                ...n,
                data: {
                  ...n.data,
                  isDropTarget: targetAreas.has(n.id),
                },
              };
            }
            return n;
          })
        );
      }
    }
  }, [draggingNode, nodes, dragTargetAreas, checkIfNodeInArea]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'actionNode' && draggingNode === node.id) {
      // Clear drag state
      setDraggingNode(null);
      setDragTargetAreas(new Set());
      
      // Clear visual feedback from all checkpoint areas
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type === 'checkpointArea') {
            return {
              ...n,
              data: {
                ...n.data,
                isDropTarget: false,
              },
            };
          }
          return n;
        })
      );
      
      // Update action counts and area sizes
      setTimeout(updateActionCountInAreas, 50);
    }
  }, [draggingNode, updateActionCountInAreas]);

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
        checkpointGroups: checkpointGroups,
        // Include visual layout information for import
        visualLayout: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              ...node.data,
              // Remove functions from data for clean export
              onSettings: undefined,
              onEdit: undefined,
              onNameChange: undefined,
              onNameSave: undefined,
              onNameCancel: undefined,
              onDelete: undefined,
            }
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
            targetHandle: edge.targetHandle || null,
            type: edge.type || 'smoothstep',
          }))
        },
        checkpoints: generateCheckpoints(nodes, edges, checkpointGroups),
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
    setIsFlowValid(true);
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
                <div key={name}>
                  {editingSelector === name ? (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200 space-y-2">
                      <input
                        type="text"
                        value={editSelectorName}
                        onChange={(e) => setEditSelectorName(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Selector name"
                      />
                      <input
                        type="text"
                        value={editSelectorValue}
                        onChange={(e) => setEditSelectorValue(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="XPath selector"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={saveEditingSelector}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          <Setting4 size={12} />
                          Save
                        </button>
                        <button
                          onClick={cancelEditingSelector}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          <CloseSquare size={12} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-2 rounded group hover:bg-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">${name}</div>
                          <div className="text-gray-500 text-xs truncate">{value}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditingSelector(name)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => deleteSelector(name)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-4 mt-6">Checkpoint Areas</h3>
        <div className="space-y-2 mb-6">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Area name (e.g., tinder, fotos)"
              value={newCheckpointName}
              onChange={(e) => setNewCheckpointName(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                if (newCheckpointName.trim()) {
                  createCheckpointArea(newCheckpointName.trim());
                  setNewCheckpointName('');
                } else {
                  toast.showError('Error', 'Please enter an area name');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
            >
              <Box1 size={16} />
              Create Area
            </button>
          </div>
          
          {checkpointAreas.size > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs font-medium text-gray-700 mb-2">Checkpoint Areas:</div>
              {Array.from(checkpointAreas.entries()).map(([areaId, area]) => {
                const areaNode = nodes.find(n => n.id === areaId);
                return (
                  <div key={areaId} className="text-xs bg-purple-50 p-2 rounded border border-purple-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-purple-800">📦 {area.name}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          Actions: {areaNode?.data.actionCount || 0}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => deleteCheckpointArea(areaId)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        <style>{`
          /* Ensure edges (connections) are always above checkpoint areas */
          .react-flow__edges {
            z-index: 100 !important;
          }
          .react-flow__edge {
            z-index: 100 !important;
          }
          /* Action nodes above checkpoint areas */
          .react-flow__node-actionNode {
            z-index: 50 !important;
          }
          /* Checkpoint areas at the bottom */
          .react-flow__node-checkpointArea {
            z-index: 1 !important;
          }
          /* Start/End nodes */
          .react-flow__node-startNode,
          .react-flow__node-endNode {
            z-index: 50 !important;
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            setIsFlowValid(false);
            // Update action counts when nodes move
            setTimeout(updateActionCountInAreas, 100);
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
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
          <MiniMap />
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={importFlow}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              <Import size={16} />
              Import
            </button>
            <button
              onClick={autoLayout}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
            >
              <Hierarchy2 size={16} />
              Organize
            </button>
            <button
              onClick={validateFlow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Play size={16} />
              Validate
            </button>
            <button
              onClick={exportFlow}
              disabled={!isFlowValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isFlowValid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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
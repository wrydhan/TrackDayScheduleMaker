'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Driver } from '@/types';
import { GripVertical, Users, Plus } from 'lucide-react';

interface DraggableDriverGroupsProps {
  driverGroups: Record<string, Driver[]>;
  onGroupsChange: (newGroups: Record<string, Driver[]>) => void;
}

interface DraggableDriverProps {
  driver: Driver;
  groupName: string;
}

interface DraggableGroupProps {
  groupName: string;
  drivers: Driver[];
  onDriversChange: (groupName: string, drivers: Driver[]) => void;
}

function DraggableDriver({ driver, groupName }: DraggableDriverProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `driver-${driver.id}`,
    data: {
      type: 'driver',
      driver,
      groupName,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSkillLevelColor = (skillLevel: string) => {
    switch (skillLevel) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded flex-shrink-0"
        >
          <GripVertical size={16} className="text-gray-500" />
        </div>
        <span className="font-medium text-gray-900 truncate">{driver.name}</span>
      </div>
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${getSkillLevelColor(driver.skillLevel)}`}>
        {driver.skillLevel}
      </span>
    </div>
  );
}

function DroppableGroup({ groupName, drivers, onDriversChange }: DraggableGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${groupName}`,
    data: {
      type: 'group',
      groupName,
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = drivers.findIndex(driver => `driver-${driver.id}` === active.id);
      const newIndex = drivers.findIndex(driver => `driver-${driver.id}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDrivers = arrayMove(drivers, oldIndex, newIndex);
        onDriversChange(groupName, newDrivers);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-4 transition-all duration-200 w-full ${
        isOver 
          ? 'border-blue-400 bg-blue-50 shadow-lg scale-105' 
          : 'border-gray-200 bg-white hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 truncate">{groupName}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded-full">
            {drivers.length} drivers
          </span>
          {isOver && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
              Drop here
            </span>
          )}
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={drivers.map(driver => `driver-${driver.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[120px] max-h-[400px] overflow-y-auto overflow-x-hidden">
            {drivers.map((driver) => (
              <DraggableDriver
                key={driver.id}
                driver={driver}
                groupName={groupName}
              />
            ))}
            {drivers.length === 0 && (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-md">
                <Plus size={24} className="mx-auto mb-2 text-gray-300" />
                <p>Drop drivers here</p>
                <p className="text-xs mt-1">No limit on group size</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Group Statistics */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Beginners:</span>
            <span className="font-medium">{drivers.filter(d => d.skillLevel === 'beginner').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Intermediate:</span>
            <span className="font-medium">{drivers.filter(d => d.skillLevel === 'intermediate').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Advanced:</span>
            <span className="font-medium">{drivers.filter(d => d.skillLevel === 'advanced').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DraggableDriverGroups({ driverGroups, onGroupsChange }: DraggableDriverGroupsProps) {
  const [localGroups, setLocalGroups] = useState(driverGroups);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle moving drivers between groups
    if (activeData?.type === 'driver' && overData?.type === 'group') {
      const driver = activeData.driver;
      const fromGroup = activeData.groupName;
      const toGroup = overData.groupName;

      if (fromGroup !== toGroup) {
        moveDriverBetweenGroups(driver.id, fromGroup, toGroup);
      }
    }

    // Handle moving drivers within the same group
    if (activeData?.type === 'driver' && overData?.type === 'driver') {
      const fromGroup = activeData.groupName;
      const toGroup = overData.groupName;

      if (fromGroup === toGroup) {
        const drivers = localGroups[fromGroup];
        const oldIndex = drivers.findIndex(d => d.id === activeData.driver.id);
        const newIndex = drivers.findIndex(d => d.id === overData.driver.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newDrivers = arrayMove(drivers, oldIndex, newIndex);
          const updatedGroups = {
            ...localGroups,
            [fromGroup]: newDrivers
          };
          setLocalGroups(updatedGroups);
          onGroupsChange(updatedGroups);
        }
      } else {
        // Move driver to different group
        moveDriverBetweenGroups(activeData.driver.id, fromGroup, toGroup);
      }
    }
  };

  const moveDriverBetweenGroups = (driverId: string, fromGroup: string, toGroup: string) => {
    const fromDrivers = localGroups[fromGroup];
    const toDrivers = localGroups[toGroup];
    
    const driver = fromDrivers.find(d => d.id === driverId);
    if (!driver) return;

    const newFromDrivers = fromDrivers.filter(d => d.id !== driverId);
    const newToDrivers = [...toDrivers, driver];

    const updatedGroups = {
      ...localGroups,
      [fromGroup]: newFromDrivers,
      [toGroup]: newToDrivers
    };

    setLocalGroups(updatedGroups);
    onGroupsChange(updatedGroups);
  };

  const activeDriver = activeId ? 
    Object.values(localGroups)
      .flat()
      .find(driver => `driver-${driver.id}` === activeId)
    : null;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <Users size={24} className="text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Driver Groups</h2>
        <span className="text-sm text-gray-500 ml-2">(Unlimited drivers per group)</span>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {Object.entries(localGroups).map(([groupName, drivers]) => (
            <DroppableGroup
              key={groupName}
              groupName={groupName}
              drivers={drivers}
              onDriversChange={(groupName, newDrivers) => {
                const updatedGroups = {
                  ...localGroups,
                  [groupName]: newDrivers
                };
                setLocalGroups(updatedGroups);
                onGroupsChange(updatedGroups);
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDriver ? (
            <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-300 shadow-lg">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-gray-500" />
                <span className="font-medium text-gray-900">{activeDriver.name}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                activeDriver.skillLevel === 'beginner' ? 'bg-green-100 text-green-800 border-green-200' :
                activeDriver.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {activeDriver.skillLevel}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to use drag and drop:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Unlimited drivers per group</strong> - no restrictions on group size</li>
          <li>• Drag drivers between different groups to reorganize</li>
          <li>• Drag drivers within the same group to reorder</li>
          <li>• Groups highlight and scale up when you can drop a driver</li>
          <li>• Changes are automatically saved and reflected in the PDF</li>
        </ul>
      </div>
    </div>
  );
}

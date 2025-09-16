'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Driver } from '@/types';
import { GripVertical, Users, Plus, Star, Zap, Trophy } from 'lucide-react';

interface DraggableDriverGroupsProps {
  driverGroups: Record<string, Driver[]>;
  onGroupsChange: (newGroups: Record<string, Driver[]>) => void;
}

interface DriverData {
  type: 'driver';
  driver: Driver;
  fromGroup: string;
}

function DraggableDriver({ driver, groupName }: { driver: Driver; groupName: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: driver.id,
    data: {
      type: 'driver',
      driver,
      fromGroup: groupName,
    } as DriverData
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSkillGradient = (skillLevel: string) => {
    switch (skillLevel) {
      case 'beginner': return 'driver-card beginner';
      case 'intermediate': return 'driver-card intermediate';
      case 'advanced': return 'driver-card advanced';
      default: return 'driver-card';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center justify-between p-4 rounded-xl cursor-grab
        ${getSkillGradient(driver.skillLevel)}
        ${isDragging ? 'opacity-50 shadow-2xl z-50 scale-105' : 'shadow-lg'}
        transition-all duration-300 hover:scale-105
      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <GripVertical size={18} className="text-white/70 flex-shrink-0" />
        <span className="font-bold text-lg truncate">{driver.name}</span>
      </div>
      <div className="text-sm text-white/90 capitalize flex-shrink-0 font-semibold">
        {driver.skillLevel}
      </div>
    </div>
  );
}

function DroppableGroup({ groupName, children, isOver }: { 
  groupName: string; 
  children: React.ReactNode; 
  isOver: boolean; 
}) {
  const { setNodeRef } = useDroppable({
    id: groupName,
    data: { type: 'group', groupName }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-6 rounded-2xl border-2 transition-all duration-300 min-h-[250px]
        ${isOver 
          ? 'border-blue-400 bg-blue-50/10 card scale-105 shadow-2xl' 
          : 'border-muted card hover:scale-102'
        }
        driver-group
      `}
    >
      {isOver && (
        <div className="mb-4 p-3 bg-blue-100/20 text-blue-300 rounded-xl text-center font-bold text-lg border-2 border-dashed border-blue-400">
          Drop here
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-100 truncate">
          {groupName}
        </h3>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
          {children && typeof children === 'object' && 'props' in children && 
           children.props && 'children' && Array.isArray(children.props.children) ? 
           children.props.children.filter((child: any) => child?.type?.name === 'DraggableDriver').length : 0} drivers
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DraggableDriverGroups({ driverGroups, onGroupsChange }: DraggableDriverGroupsProps) {
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [overGroup, setOverGroup] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize local groups to prevent unnecessary re-renders
  const localGroups = useMemo(() => ({ ...driverGroups }), [driverGroups]);

  // Memoize group names
  const groupNames = useMemo(() => Object.keys(localGroups), [localGroups]);

  // Memoize items per group
  const itemsPerGroup = useMemo(() => {
    const items: Record<string, string[]> = {};
    groupNames.forEach(groupName => {
      items[groupName] = localGroups[groupName]?.map(driver => driver.id) || [];
    });
    return items;
  }, [localGroups, groupNames]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current as DriverData;
    
    if (activeData?.type === 'driver') {
      setActiveDriver(activeData.driver);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDriver(null);
    setOverGroup(null);

    if (!over) return;

    const activeData = active.data.current as DriverData;
    const overId = over.id as string;
    
    if (!activeData || activeData.type !== 'driver') return;

    const sourceGroup = activeData.fromGroup;
    const activeDriver = activeData.driver;

    // Determine if we're dropping on a group or another driver
    const overData = over.data.current;
    let targetGroup: string;

    if (overData?.type === 'group') {
      targetGroup = overData.groupName;
    } else if (overData?.type === 'driver') {
      targetGroup = overData.fromGroup;
    } else {
      // Try to find the group by looking up the driver
      targetGroup = Object.keys(localGroups).find(groupName => 
        localGroups[groupName]?.some(driver => driver.id === overId)
      ) || sourceGroup;
    }

    const newGroups = { ...localGroups };

    // Remove driver from source group
    newGroups[sourceGroup] = localGroups[sourceGroup]?.filter(
      driver => driver.id !== activeDriver.id
    ) || [];

    if (sourceGroup === targetGroup) {
      // Reordering within the same group
      const oldIndex = localGroups[sourceGroup]?.findIndex(driver => driver.id === activeDriver.id) || -1;
      const newIndex = localGroups[targetGroup]?.findIndex(driver => driver.id === overId) || -1;
      
      if (oldIndex !== -1 && newIndex !== -1) {
        newGroups[targetGroup] = arrayMove(localGroups[sourceGroup] || [], oldIndex, newIndex);
      } else {
        // Fallback: just add to the end
        newGroups[targetGroup] = [...(localGroups[sourceGroup] || [])];
      }
    } else {
      // Moving to a different group
      if (overData?.type === 'driver') {
        // Insert at specific position
        const targetIndex = localGroups[targetGroup]?.findIndex(driver => driver.id === overId) || 0;
        const newTargetDrivers = [...(localGroups[targetGroup] || [])];
        newTargetDrivers.splice(targetIndex, 0, activeDriver);
        newGroups[targetGroup] = newTargetDrivers;
      } else {
        // Add to end of target group
        newGroups[targetGroup] = [...(localGroups[targetGroup] || []), activeDriver];
      }
    }

    onGroupsChange(newGroups);
  }, [localGroups, onGroupsChange]);

  const handleDragOver = useCallback((event: any) => {
    const { over } = event;
    if (over) {
      const overData = over.data.current;
      if (overData?.type === 'group') {
        setOverGroup(overData.groupName);
      } else if (overData?.type === 'driver') {
        setOverGroup(overData.fromGroup);
      }
    } else {
      setOverGroup(null);
    }
  }, []);

  const totalDrivers = Object.values(localGroups).reduce((total, group) => total + (group?.length || 0), 0);

  return (
    <div className="mt-12 card p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
          <Users size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-100">Driver Groups</h2>
          <p className="text-gray-400 font-medium">
            {totalDrivers} total drivers
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {groupNames.map((groupName) => (
            <DroppableGroup key={groupName} groupName={groupName} isOver={overGroup === groupName}>
              <SortableContext items={itemsPerGroup[groupName] || []} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[150px] max-h-[400px] overflow-y-auto overflow-x-hidden">
                  {localGroups[groupName]?.map((driver) => (
                    <DraggableDriver key={driver.id} driver={driver} groupName={groupName} />
                  )) || []}
                  {(!localGroups[groupName] || localGroups[groupName].length === 0) && (
                    <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-400 rounded-xl">
                      <Plus size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-bold text-lg">Drop drivers here</p>
                      <p className="text-sm mt-2">No limit on group size</p>
                      <p className="text-xs mt-1">Drag & drop to organize</p>
                    </div>
                  )}
                </div>
              </SortableContext>

              <div className="mt-6 pt-4 border-t border-gray-300/30">
                <div className="text-sm text-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Beginners:</span>
                    <span className="font-bold bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                      {localGroups[groupName]?.filter((d) => d.skillLevel === 'beginner').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Intermediate:</span>
                    <span className="font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                      {localGroups[groupName]?.filter((d) => d.skillLevel === 'intermediate').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Advanced:</span>
                    <span className="font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                      {localGroups[groupName]?.filter((d) => d.skillLevel === 'advanced').length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </DroppableGroup>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

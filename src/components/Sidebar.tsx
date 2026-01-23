import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Users } from 'lucide-react';
import { ClassGroup } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
    classes: ClassGroup[];
}

export const Sidebar: React.FC<SidebarProps> = ({ classes }) => {
    return (
        <div className="w-80 h-full bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-2">Available Classes</h2>
            <div className="space-y-3">
                {classes.map((cls) => (
                    <DraggableClassItem key={cls.name} classGroup={cls} />
                ))}
                {classes.length === 0 && (
                    <p className="text-slate-500 text-sm italic">No classes imported yet.</p>
                )}
            </div>
        </div>
    );
};

const DraggableClassItem = ({ classGroup }: { classGroup: ClassGroup }) => {
    const isEmpty = classGroup.students.length === 0;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `class-${classGroup.name}`,
        data: { type: 'CLASS', classGroup },
        disabled: isEmpty
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "p-4 rounded-lg shadow-lg transition-all",
                classGroup.color,
                "text-white flex items-center justify-between",
                isDragging ? "opacity-50 scale-105 z-50" : isEmpty ? "opacity-40 grayscale cursor-not-allowed" : "cursor-grab active:cursor-grabbing hover:scale-[1.02]"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-md">
                    <Users className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">{classGroup.name}</h3>
                    <p className="text-xs opacity-80">{isEmpty ? "All Assigned" : `${classGroup.students.length} Students`}</p>
                </div>
            </div>
        </div>
    );
};

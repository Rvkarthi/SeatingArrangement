import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Hall, Desk } from '../types';
import { cn } from '../lib/utils';
import { User, Edit2, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import { ClassGroup } from '../types';

// No change needed here really, but good to keep clean.
// Update Props Interface
interface HallGridProps {
    hall: Hall;
    classes: ClassGroup[];
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export const HallGrid: React.FC<HallGridProps & { onEdit?: () => void, onDelete?: () => void, onClear?: () => void }> = ({ hall, classes, isExpanded, onToggleExpand, onEdit, onDelete, onClear }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `hall-drop-zone-${hall.id}`,
        data: { type: 'HALL', hallId: hall.id }
    });

    const getClassColor = (className: string) => {
        return classes.find(c => c.name === className)?.color || 'bg-indigo-600';
    };

    const capacity = hall.rows * hall.cols * hall.deskCapacity;
    const occupied = hall.desks.flatMap(d => d.students).filter(Boolean).length;
    const remaining = capacity - occupied;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-full bg-slate-950/50 rounded-3xl border border-slate-800 overflow-hidden flex flex-col items-center relative group hover:border-slate-700 transition-all",
                isOver && "border-purple-500 bg-purple-500/5",
                !isExpanded ? "p-4" : "p-6"
            )}
        >
            {/* Header / Actions */}
            <div className="w-full flex justify-between items-center mb-4 relative">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white">{hall.name}</h1>
                    <div className="flex items-center text-xs font-mono font-bold bg-slate-800/50 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                        <span className="text-purple-400">{occupied}</span>
                        <span className="mx-1 text-slate-600">/</span>
                        <span>{capacity}</span>
                    </div>
                </div>

                {/* Centralized Expand Button */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                        className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 shadow-sm"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {onClear && (
                        <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors" title="Clear Assignments">
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    )}
                    {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors" title="Edit Hall">
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 bg-slate-800 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/20 transition-colors" title="Remove Hall">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Detailed Stats in Expanded Mode */}
            {isExpanded && (
                <div className="flex gap-6 text-sm text-slate-400 mb-6 w-full justify-center">
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-white text-lg">{capacity}</span>
                        <span>Total</span>
                    </div>
                    <div className="w-px bg-slate-800 h-10"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-green-400 text-lg">{occupied}</span>
                        <span>Filled</span>
                    </div>
                    <div className="w-px bg-slate-800 h-10"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-200 text-lg">{remaining}</span>
                        <span>Free</span>
                    </div>
                </div>
            )}

            {/* Grid Area */}
            <div
                className={cn(
                    "grid transition-all duration-300 mx-auto",
                    isExpanded ? "gap-2 p-2 w-full" : "gap-1 w-auto"
                )}
                style={{
                    gridTemplateColumns: `repeat(${hall.cols}, minmax(0, 1fr))`,
                }}
            >
                {hall.desks.map((desk, idx) => (
                    <DeskItem
                        key={desk.id}
                        desk={desk}
                        index={idx + 1}
                        capacity={hall.deskCapacity}
                        getClassColor={getClassColor}
                        isExpanded={isExpanded}
                    />
                ))}
            </div>

            {/* Drop Overlay Hint */}
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-500/10 pointer-events-none">
                    <span className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                        Drop to Assign
                    </span>
                </div>
            )}
        </div>
    );
};

const DeskItem = ({ desk, index, capacity, getClassColor, isExpanded }: { desk: Desk, index: number, capacity: number, getClassColor: (name: string) => string, isExpanded: boolean }) => {
    if (!isExpanded) {
        // Compact Dot View
        return (
            <div className="bg-slate-800/50 p-1 rounded hover:bg-slate-800 transition-colors flex justify-center gap-1" title={`D${index} (R${desk.row}-C${desk.col})`}>
                {Array.from({ length: capacity }).map((_, i) => {
                    const student = desk.students[i];
                    return (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full",
                                student
                                    ? cn(getClassColor(student.className), "shadow-sm scale-110")
                                    : "bg-slate-800 border border-slate-700"
                            )}
                        />
                    );
                })}
            </div>
        );
    }

    // Expanded Detailed View
    // "No need row 1 col 1, just tell desk number"
    // "No need to show register number"
    // "Row wise" layout for students inside the desk
    return (
        <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 shadow-lg hover:border-slate-500 transition-colors flex flex-col gap-2 min-h-[60px]">
            <div className="flex justify-between items-center px-1 border-b border-white/5 pb-1">
                <span className="text-[10px] font-mono font-bold text-slate-500">#{index}</span>
            </div>
            {/* Students Row */}
            <div className="flex gap-1 w-full">
                {Array.from({ length: capacity }).map((_, i) => {
                    const student = desk.students[i];
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center p-1.5 rounded-md text-xs font-bold h-12 overflow-hidden",
                                student
                                    ? cn(getClassColor(student.className), "text-white shadow-sm")
                                    : "bg-slate-900/50 text-slate-600 border border-slate-800 border-dashed"
                            )}
                            title={student ? `${student.className} - ${student.registerNumber}` : "Empty"}
                        >
                            {student ? (
                                <>
                                    <span className="truncate w-full text-center leading-tight">{student.className}</span>
                                    <span className="truncate w-full text-center text-[10px] opacity-90 font-mono leading-tight">{student.registerNumber}</span>
                                </>
                            ) : (
                                <span className="opacity-50">-</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

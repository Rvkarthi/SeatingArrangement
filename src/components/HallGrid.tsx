import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Hall, Desk } from '../types';
import { cn } from '../lib/utils';
import { User, Edit2, Trash2, ChevronDown, ChevronUp, RefreshCw, CheckSquare, Square } from 'lucide-react';

import { ClassGroup } from '../types';

interface HallGridProps {
    hall: Hall;
    classes: ClassGroup[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    isSelectMode?: boolean;
    onToggleSelectMode?: () => void;
}

export const HallGrid: React.FC<HallGridProps & { onEdit?: () => void, onDelete?: () => void, onClear?: () => void }> = ({ hall, classes, isExpanded, onToggleExpand, onEdit, onDelete, onClear, isSelectMode, onToggleSelectMode }) => {
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

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 items-center">
                    {onToggleSelectMode && (
                        <div className="flex items-center gap-2 mr-2 bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700">
                            <input
                                type="checkbox"
                                id={`select-${hall.id}`}
                                checked={isSelectMode}
                                onChange={(e) => { e.stopPropagation(); onToggleSelectMode(); }}
                                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                            />
                            {/* <label htmlFor={`select-${hall.id}`} className="text-xs text-slate-300 cursor-pointer select-none font-medium">Select</label> */}
                        </div>
                    )}

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
                        hallId={hall.id}
                        desk={desk}
                        index={idx + 1}
                        capacity={hall.deskCapacity}
                        getClassColor={getClassColor}
                        isExpanded={isExpanded}
                        isSelectMode={isSelectMode}
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

interface DeskItemProps {
    hallId: string;
    desk: Desk;
    index: number;
    capacity: number;
    getClassColor: (name: string) => string;
    isExpanded: boolean;
    isSelectMode?: boolean;
}

const DeskItem: React.FC<DeskItemProps> = ({ hallId, desk, index, capacity, getClassColor, isExpanded, isSelectMode }) => {
    if (!isExpanded) {
        // Compact Dot View
        return (
            <div className="bg-slate-800/50 p-1 rounded hover:bg-slate-800 transition-colors flex justify-center gap-1" title={`D${index} (R${desk.row}-C${desk.col})`}>
                {Array.from({ length: capacity }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-2 h-2 rounded-full",
                            desk.students[i]
                                ? cn(getClassColor(desk.students[i]!.className), "shadow-sm scale-110")
                                : "bg-slate-800 border border-slate-700"
                        )}
                    />
                ))}
            </div>
        );
    }

    // Expanded Detailed View
    return (
        <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 shadow-lg hover:border-slate-500 transition-colors flex flex-col gap-2 min-h-[60px]">
            <div className="flex justify-between items-center px-1 border-b border-white/5 pb-1">
                <span className="text-[10px] font-mono font-bold text-slate-500">#{index}</span>
            </div>
            {/* Students Row */}
            <div className="flex gap-1 w-full relative">
                {Array.from({ length: capacity }).map((_, i) => (
                    <Seat
                        key={i}
                        hallId={hallId}
                        deskId={desk.id}
                        seatIndex={i}
                        student={desk.students[i]}
                        getClassColor={getClassColor}
                        isSelectMode={isSelectMode}
                    />
                ))}
            </div>
        </div>
    );
};

interface SeatProps {
    hallId: string;
    deskId: string;
    seatIndex: number;
    student: { registerNumber: string, className: string } | null;
    getClassColor: (name: string) => string;
    isSelectMode?: boolean;
}

const Seat: React.FC<SeatProps> = ({ hallId, deskId, seatIndex, student, getClassColor, isSelectMode }) => {
    const id = `seat:${hallId}:${deskId}:${seatIndex}`;

    // We only make it droppable if we are in select mode (to support simple swapping)
    // Or actually, always droppable is fine, but maybe performance hit?
    // Let's keep it usually droppable but only handle events if in mode.
    // The prompt says "if that is selected... should able to move... or swapped".
    // "Swapped" implies we drop onto another.

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id,
        data: { type: 'SEAT', hallId, deskId, seatIndex }
    });

    const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
        id,
        data: { type: 'SEAT', hallId, deskId, seatIndex, student },
        disabled: !isSelectMode || !student
    });

    return (
        <div
            ref={setDropRef}
            className={cn(
                "flex-1 h-12 relative transition-all rounded-md",
                isSelectMode && "hover:bg-white/5", // Visual cue that interaction is possible
                isOver && isSelectMode && "ring-2 ring-purple-400 bg-purple-500/20 z-10" // Visual cue for drop target
            )}
        >
            <div
                ref={setDragRef}
                {...listeners}
                {...attributes}
                className={cn(
                    "flex flex-col items-center justify-center p-1.5 rounded-md text-xs font-bold h-full w-full overflow-hidden transition-all",
                    student
                        ? cn(getClassColor(student.className), "text-white shadow-sm cursor-grab active:cursor-grabbing")
                        : "bg-slate-900/50 text-slate-600 border border-slate-800 border-dashed",
                    isDragging && "opacity-0", // Hide original when dragging
                    isSelectMode && student && !isDragging && "ring-1 ring-white/30 hover:ring-2 hover:ring-white/50", // Draggable hint
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
        </div>
    );
};

import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { cn } from './lib/utils';
import { Sidebar } from './components/Sidebar';
import { HallSetup } from './components/HallSetup';
import { ImportConfig } from './components/ImportConfig';
import { HallGrid } from './components/HallGrid';
import { ClassGroup, Hall, Desk, Student } from './types';
import { ArrowLeft, Download, School, Trash2, Calendar, Edit2, X, Plus, Link } from 'lucide-react';
import { Packer, Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, PageOrientation, AlignmentType, Header, Footer, VerticalAlign } from 'docx';


function App() {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [halls, setHalls] = useState<Hall[]>([]); // Changed to array
    const [editingHall, setEditingHall] = useState<Hall | null>(null); // For edit modal

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required to drag, allows clicks
            },
        })
    );

    // Selection State
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [middleSeatPrompt, setMiddleSeatPrompt] = useState<{ isOpen: boolean, classA: string, classB: string, hallId: string } | null>(null);
    const [tempDragData, setTempDragData] = useState<{ classGroup: ClassGroup, hallId: string } | null>(null);

    // Persist Add Hall Config
    const [lastHallConfig, setLastHallConfig] = useState<{ name: string, rows: number, cols: number, capacity: number } | null>(null);

    // Expanded Halls State (Global Management)
    const [expandedHallIds, setExpandedHallIds] = useState<string[]>([]);

    const toggleHallExpand = (hallId: string) => {
        setExpandedHallIds(prev =>
            prev.includes(hallId) ? [] : [hallId]
        );
    };

    const toggleAllHalls = () => {
        if (expandedHallIds.length === halls.length) {
            setExpandedHallIds([]); // Collapse All
        } else {
            // In "Focus Mode" preference, Expand All doesn't map well to "Hide Others".
            // We'll just clear or expand all for consistency check, but UI will stack them or show first?
            // To strictly follow "Hide Others", we probably shouldn't allow expanding all at once.
            // But let's assume "Expand All" just bypasses the "Hide Others" rule visually or we just disable it?
            // Let's make it expand all, but the user will see them stacked.
            // Wait, if I change the render to "filter", then expanding ALL means showing ALL.
            // So toggleAll is fine.
            // It will show ALL.
            // But `toggleHallExpand` is exclusive.
            setExpandedHallIds(halls.map(h => h.id));
        }
    };


    // Global Settings
    const [collegeName, setCollegeName] = useState("A.V.C. COLLEGE OF ENGINEERING");
    const [deptName, setDeptName] = useState("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING");
    const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddHallOpen, setIsAddHallOpen] = useState(false);

    // Selection & Seat Move Logic
    const [selectionModeHallId, setSelectionModeHallId] = useState<string | null>(null);

    const toggleSelectionMode = (hallId: string) => {
        setSelectionModeHallId(prev => prev === hallId ? null : hallId);
    };

    const handleSeatMove = (source: { hallId: string, deskId: string, seatIndex: number }, target: { hallId: string, deskId: string, seatIndex: number }) => {
        setHalls(prevHalls => {
            const newHalls = [...prevHalls];
            const sHallIdx = newHalls.findIndex(h => h.id === source.hallId);
            const tHallIdx = newHalls.findIndex(h => h.id === target.hallId);

            if (sHallIdx === -1 || tHallIdx === -1) return prevHalls;

            const sHall = { ...newHalls[sHallIdx], desks: [...newHalls[sHallIdx].desks] };
            const tHall = source.hallId === target.hallId ? sHall : { ...newHalls[tHallIdx], desks: [...newHalls[tHallIdx].desks] };

            const sDeskIdx = sHall.desks.findIndex(d => d.id === source.deskId);
            const tDeskIdx = tHall.desks.findIndex(d => d.id === target.deskId);

            if (sDeskIdx === -1 || tDeskIdx === -1) return prevHalls;

            // Handle Same Desk Swap
            if (source.hallId === target.hallId && source.deskId === target.deskId) {
                const desk = { ...sHall.desks[sDeskIdx], students: [...sHall.desks[sDeskIdx].students] };
                const temp = desk.students[source.seatIndex];
                desk.students[source.seatIndex] = desk.students[target.seatIndex];
                desk.students[target.seatIndex] = temp;
                sHall.desks[sDeskIdx] = desk;
            } else {
                // Different Desks
                const sDesk = { ...sHall.desks[sDeskIdx], students: [...sHall.desks[sDeskIdx].students] };
                const tDesk = { ...tHall.desks[tDeskIdx], students: [...tHall.desks[tDeskIdx].students] };

                const temp = sDesk.students[source.seatIndex];
                sDesk.students[source.seatIndex] = tDesk.students[target.seatIndex];
                tDesk.students[target.seatIndex] = temp;

                sHall.desks[sDeskIdx] = sDesk;
                tHall.desks[tDeskIdx] = tDesk;
            }

            newHalls[sHallIdx] = sHall;
            if (source.hallId !== target.hallId) newHalls[tHallIdx] = tHall;

            return newHalls;
        });
    };



    // Helper to filter view
    const visibleHalls = expandedHallIds.length > 0
        ? halls.filter(h => expandedHallIds.includes(h.id))
        : halls;



    const handleImport = (importedClasses: ClassGroup[]) => {
        setClasses(importedClasses);
    };

    const createHall = (config: { name: string, rows: number, cols: number, capacity: number }) => {
        const desks: Desk[] = [];
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                desks.push({
                    id: `${Date.now()}-${r}-${c}`, // Unique ID
                    row: r + 1,
                    col: c + 1,
                    students: Array(config.capacity).fill(null)
                });
            }
        }
        const newHall: Hall = { ...config, deskCapacity: config.capacity, id: Date.now().toString(), desks };
        setHalls(prev => [...prev, newHall]);
        setLastHallConfig(config);
        setIsAddHallOpen(false);
    };

    const updateHall = (updatedHall: Hall) => {
        // If dimensions changed, we might need to reset desks or handle gracefully.
        // User asked for Edit Name, Size, Row, Col.
        // If Rows/Cols/Capacity change, it's destructive to layout.
        // We will rebuild desks but TRY to keep students? No, creates gaps.
        // Safe approach: Rebuild desks, clear students (return to pool optional? No, user said "removes old hall" behavior imply destructive).
        // Let's rebuilding desks and clearing assignments for this hall.
        // Note: Students already assigned to this hall are lost unless we put them back to 'classes'.

        // Let's reclaim students first
        const oldHall = halls.find(h => h.id === updatedHall.id);
        if (oldHall) {
            const studentsInHall = oldHall.desks.flatMap(d => d.students).filter(s => s !== null) as Student[];
            if (studentsInHall.length > 0) {
                setClasses(prev => prev.map(c => {
                    const returnees = studentsInHall.filter(s => s.className === c.name);
                    return { ...c, students: [...c.students, ...returnees] };
                }));
            }
        }

        // Rebuild Hall
        const desks: Desk[] = [];
        for (let r = 0; r < updatedHall.rows; r++) {
            for (let c = 0; c < updatedHall.cols; c++) {
                desks.push({
                    id: `${updatedHall.id}-${r}-${c}`,
                    row: r + 1,
                    col: c + 1,
                    students: Array(updatedHall.deskCapacity).fill(null)
                });
            }
        }

        setHalls(prev => prev.map(h => h.id === updatedHall.id ? { ...updatedHall, desks } : h));
        setEditingHall(null);
    };

    const removeHall = (hallId: string) => {
        // Return students
        const hallToRemove = halls.find(h => h.id === hallId);
        if (hallToRemove) {
            const studentsInHall = hallToRemove.desks.flatMap(d => d.students).filter(s => s !== null) as Student[];
            if (studentsInHall.length > 0) {
                setClasses(prev => prev.map(c => {
                    const returnees = studentsInHall.filter(s => s.className === c.name);
                    return { ...c, students: [...c.students, ...returnees] };
                }));
            }
        }
        setHalls(prev => prev.filter(h => h.id !== hallId));
    };

    const clearHallStudents = (hallId: string) => {
        const targetHall = halls.find(h => h.id === hallId);
        if (!targetHall) return;

        // 1. Gather Students
        const studentsInHall = targetHall.desks.flatMap(d => d.students).filter(s => s !== null) as Student[];

        if (studentsInHall.length === 0) return; // Nothing to clear

        // 2. Return Students to Classes
        setClasses(prev => prev.map(c => {
            const returnees = studentsInHall.filter(s => s.className === c.name);
            return { ...c, students: [...c.students, ...returnees] };
        }));

        // 3. Clear Desks in Hall
        const newDesks = targetHall.desks.map(d => ({ ...d, students: Array(targetHall.deskCapacity).fill(null) }));
        setHalls(prev => prev.map(h => h.id === hallId ? { ...h, desks: newDesks } : h));
    };


    const distributeStudents = (targetHallId: string, newClass: ClassGroup) => {
        const targetHallIndex = halls.findIndex(h => h.id === targetHallId);
        if (targetHallIndex === -1) return;

        const targetHall = halls[targetHallIndex];

        // Deep copy desks
        const newDesks = targetHall.desks.map(d => ({ ...d, students: [...d.students] }));

        // Sort students by Register Number to ensure valid sequence
        const availableStudents = [...newClass.students].sort((a, b) =>
            a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })
        );
        const initialCount = availableStudents.length;

        // Smart Allocation Strategy: Seat-Major Fill
        const capacity = targetHall.deskCapacity;

        // Prioritize Ends 0 and 2 for 3-seater.
        const seatOrder = capacity === 3 ? [0, 2, 1] : Array.from({ length: capacity }, (_, i) => i);

        // Sort desks for Column-Major traversal (Top-down, Left-right)
        const sortedDesks = [...newDesks].sort((a, b) => {
            if (a.col !== b.col) return a.col - b.col;
            return a.row - b.row;
        });

        // Fill Column-by-Column completely before moving to next column
        for (let c = 1; c <= targetHall.cols; c++) {
            const desksInCol = sortedDesks.filter(d => d.col === c);

            for (const seatIdx of seatOrder) {
                for (const desk of desksInCol) {
                    if (availableStudents.length === 0) break;

                    // Only fill if empty
                    if (desk.students[seatIdx] === null) {
                        const candidateStudent = availableStudents[0];
                        let conflict = false;

                        // Generic Constraint: Avoid same class neighbors
                        if (seatIdx > 0) {
                            const left = desk.students[seatIdx - 1];
                            if (left && left.className === candidateStudent.className) conflict = true;
                        }
                        if (seatIdx < capacity - 1) {
                            const right = desk.students[seatIdx + 1];
                            if (right && right.className === candidateStudent.className) conflict = true;
                        }

                        if (!conflict) {
                            desk.students[seatIdx] = availableStudents.shift() || null;
                        }
                    }
                }
            }
        }

        const placedCount = initialCount - availableStudents.length;
        if (placedCount === 0) {
            alert("Could not place any students! Adjacent same-class constraints prevented assignment.");
            return;
        } else if (availableStudents.length > 0) {
            alert(`Placed ${placedCount} students. ${availableStudents.length} remaining due to constraints.`);
        }

        // Update Hall
        const updatedHall = { ...targetHall, desks: newDesks };
        setHalls(prev => {
            const newHalls = [...prev];
            newHalls[targetHallIndex] = updatedHall;
            return newHalls;
        });

        // Update Classes (Available Students)
        setClasses(prev => prev.map(c => {
            if (c.name === newClass.name) {
                return { ...c, students: availableStudents };
            }
            return c;
        }));
    };

    const resolveConflict = (middleClass: string) => {
        if (!middleSeatPrompt || !tempDragData) return;

        const { hallId, classA, classB } = middleSeatPrompt;
        const targetHallIndex = halls.findIndex(h => h.id === hallId);
        if (targetHallIndex === -1) return;
        const targetHall = halls[targetHallIndex];

        // Advanced distribution with forced middle
        // Strategy: 
        // 1. Gather all students currently in Hall (which should be just Class A).
        // 2. Gather all students from New Class (Class B).
        // 3. Re-distribute using 1-2-1 pattern or Side-Middle-Side pattern.

        // We know Hall has Class A. 
        // Note: Students in Hall need to be "returned" to valid pool for logic, or we just extract them.

        const studentsInHall = (targetHall.desks.flatMap(d => d.students).filter(s => s !== null && s.className === classA) as Student[])
            .sort((a, b) => a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true }));

        const studentsNew = [...tempDragData.classGroup.students]
            .sort((a, b) => a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true })); // New class students

        const allA = [...studentsInHall];
        const allB = [...studentsNew];

        // Respect user selection for middle seat - no auto-override based on counts.
        const targetMiddle = middleClass;

        // Determine which list goes to Side and Middle based on target
        const listMiddle = targetMiddle === classA ? allA : allB;
        const listSide = targetMiddle === classA ? allB : allA;

        // Rebuild Desks
        const newDesks = targetHall.desks.map(d => ({ ...d, students: Array(3).fill(null) as (Student | null)[] }));

        // Sort desks for Column-Major traversal
        const sortedDesks = [...newDesks].sort((a, b) => {
            if (a.col !== b.col) return a.col - b.col;
            return a.row - b.row;
        });

        // Fill Column-by-Column
        for (let c = 1; c <= targetHall.cols; c++) {
            const desksInCol = sortedDesks.filter(d => d.col === c);

            // Fill 1: Seat 0 (Side) - Vertical Fill for this column
            for (const desk of desksInCol) {
                if (listSide.length > 0) desk.students[0] = listSide.shift() || null;
            }

            // Fill 2: Seat 2 (Side) - Vertical Fill for this column
            for (const desk of desksInCol) {
                if (listSide.length > 0) desk.students[2] = listSide.shift() || null;
            }

            // Fill 3: Seat 1 (Middle) - Vertical Fill for this column
            for (const desk of desksInCol) {
                if (listMiddle.length > 0) desk.students[1] = listMiddle.shift() || null;
            }
        }

        // Update Hall
        const updatedHall = { ...targetHall, desks: newDesks };
        setHalls(prev => {
            const newHalls = [...prev];
            newHalls[targetHallIndex] = updatedHall;
            return newHalls;
        });

        // Update Classes State
        // We need to update BOTH classes.
        // Class A: remaining students = original total - used in hall.
        // Class B: remaining students = original total - used in hall.

        // For Class B (the dragged one), we can use logic similar to distributeStudents.
        // For Class A (already in hall), we implicitly "used" them again.
        // But wait, 'classes' state for A already had those students removed (when A was first dragged).
        // If we "gathered" them from Hall, we didn't add them back to 'classes'.
        // So 'listMiddle' or 'listSide' consumed the Hall students + potential extras?
        // Wait, did we gather extras from 'classes' for A? No, only 'studentsInHall'.
        // If A had more students in 'classes' waiting, we didn't use them here.
        // The prompt implies: Rearranging CURRENT hall content + NEW content.
        // What if user wants to add MORE A? 
        // Let's assume we mix "Hall Contents" + "New Class Whole List".
        // And we update "New Class" remaining.
        // We do NOT touch "Old Class" remaining list (visual sidebar), assuming those in hall are already accounted for.

        // HOWEVER, if 'listMiddle' was Class A, and we used `shift()`, we exhausted `allA` (which was purely from hall).
        // If `listSide` was Class B, we used `shift()` on `allB` (which was from sidebar).
        // So we just need to update Class B in sidebar.

        // BUT, what about the "Evenly Divided" part?
        // "students in both classes should be equaly divided".
        // My logic `desk.students[0] = Side, [1] = Middle, [2] = Side`
        // attempts to use 2 Side for 1 Middle. (2:1 ratio).
        // This isn't exactly "Equally" (50/50).
        // If they want 50/50 in a 3-desk... impossible mathematically per desk.
        // Unless we do A B A, then B A B...
        // The user specifically asked "which class should be in middle".
        // I will stick to the fixed pattern: Side (0), Middle (1), Side (2).
        // If they chose A for middle: B A B.
        // If they chose B for middle: A B A.
        // This is standard "Examination Seating" where you separate adjacent students.
        // This implies 2/3 and 1/3 split. 
        // If the user meant "Overall Equal", they might need to use 2-seater halls.
        // I'll assume my interpretation of "Middle Seat Class" implies this 1-2-1 pattern.

        // Update class B (the new one)
        setClasses(prev => prev.map(c => {
            if (c.name === tempDragData.classGroup.name) {
                // remaining are those left in 'allB' (assuming B was either side or middle)
                // Start with logic:
                // We need to find which array was B.
                const remainingB = (tempDragData.classGroup.name === middleClass) ? listMiddle : listSide;
                // But wait, listMiddle/Side were mutated by shift().
                return { ...c, students: remainingB };
            }
            return c;
        }));

        setMiddleSeatPrompt(null);
        setTempDragData(null);
    };

    const handleDragStart = (event: any) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        const { active, over } = event;

        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // Handle Seat Move (Seat -> Seat)
        if (activeType === 'SEAT' && overType === 'SEAT') {
            const source = active.data.current as { hallId: string, deskId: string, seatIndex: number };
            const target = over.data.current as { hallId: string, deskId: string, seatIndex: number };
            handleSeatMove(source, target);
            return;
        }

        // Handle Class Distribution (Class -> Hall or Class -> Seat)
        if (activeType !== 'SEAT' && (overType === 'HALL' || overType === 'SEAT')) {
            const hallId = over.data.current?.hallId;
            const classGroup = active.data.current?.classGroup as ClassGroup;

            if (!hallId || !classGroup) return;

            const targetHall = halls.find(h => h.id === hallId);
            if (!targetHall) return;

            // Check for Capacity 3 Conflict
            const occupiedBy = new Set<string>();
            targetHall.desks.forEach(d => d.students.forEach(s => { if (s) occupiedBy.add(s.className) }));

            // Condition: Cap 3, Exactly 1 class currently in hall, and new class is different.
            if (targetHall.deskCapacity === 3 && occupiedBy.size === 1 && !occupiedBy.has(classGroup.name)) {
                const existingClass = Array.from(occupiedBy)[0];
                setTempDragData({ classGroup, hallId });
                setMiddleSeatPrompt({
                    isOpen: true,
                    classA: existingClass,
                    classB: classGroup.name,
                    hallId: hallId,
                });
                return;
            }

            distributeStudents(hallId, classGroup);
        }
    };


    const exportDocx = async () => {
        try {
            console.log("Starting export...", { hallsCount: halls.length });
            if (halls.length === 0) {
                alert("No halls to export!");
                return;
            }

            const docSections = halls.map(hall => {
                // We will create one table per Physical Column
                const columnTables = [];

                for (let c = 1; c <= hall.cols; c++) {
                    // For this Physical Column 'c', we have 'deskCapacity' internal columns (seats)
                    const subCols = hall.deskCapacity;
                    const headers: string[] = new Array(subCols).fill("Class");
                    const dataRows: string[][] = Array.from({ length: hall.rows }, () => new Array(subCols).fill("-"));

                    // Fill Data for this Physical Column
                    for (let s = 0; s < subCols; s++) {
                        // Gather students for this specific seat vertical line within the physical column
                        const classesInCol = new Set<string>();

                        for (let r = 1; r <= hall.rows; r++) {
                            const desk = hall.desks.find(d => d.col === c && d.row === r);
                            if (desk) {
                                const student = desk.students[s];
                                if (student) {
                                    classesInCol.add(student.className);
                                    dataRows[r - 1][s] = student.registerNumber;
                                } else {
                                    dataRows[r - 1][s] = "-";
                                }
                            }
                        }

                        // Set Header
                        headers[s] = classesInCol.size > 0
                            ? Array.from(classesInCol).join(" / ")
                            : "Empty";
                    }

                    // Build the Table for Physical Column 'c'
                    const tableRowObjects = [];

                    // 1. Header
                    tableRowObjects.push(
                        new TableRow({
                            children: headers.map(header =>
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: header, bold: true, size: 16 })],
                                            alignment: AlignmentType.CENTER
                                        })
                                    ],
                                    shading: { fill: "E0E0E0" },
                                    verticalAlign: VerticalAlign.CENTER,
                                })
                            )
                        })
                    );

                    // 2. Data
                    dataRows.forEach(row => {
                        tableRowObjects.push(
                            new TableRow({
                                children: row.map(cellData =>
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [new TextRun({ text: cellData, size: 16 })],
                                                alignment: AlignmentType.CENTER
                                            })
                                        ],
                                        verticalAlign: VerticalAlign.CENTER,
                                    })
                                )
                            })
                        );
                    });

                    columnTables.push(
                        new Table({
                            rows: tableRowObjects,
                            width: { size: 100, type: WidthType.PERCENTAGE }, // Fill the layout cell
                            alignment: AlignmentType.CENTER,
                        })
                    );
                }

                // Layout Table: Arrange Physical Column Tables Side-by-Side
                const layoutTableCells = columnTables.map((ct) =>
                    new TableCell({
                        children: [ct],
                        width: { size: 100 / hall.cols, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: "none", size: 0, color: "FFFFFF" },
                            bottom: { style: "none", size: 0, color: "FFFFFF" },
                            left: { style: "none", size: 0, color: "FFFFFF" },
                            right: { style: "none", size: 0, color: "FFFFFF" },
                        },
                        // Add spacing?
                        margins: { right: 200, left: 200 } // Spacing between hall columns
                    })
                );

                const layoutTable = new Table({
                    rows: [new TableRow({ children: layoutTableCells })],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    alignment: AlignmentType.CENTER,
                    borders: {
                        top: { style: "none", size: 0, color: "FFFFFF" },
                        bottom: { style: "none", size: 0, color: "FFFFFF" },
                        left: { style: "none", size: 0, color: "FFFFFF" },
                        right: { style: "none", size: 0, color: "FFFFFF" },
                        insideVertical: { style: "none", size: 0, color: "FFFFFF" },
                        insideHorizontal: { style: "none", size: 0, color: "FFFFFF" },
                    }
                });

                const totalStudents = hall.desks.reduce((acc, desk) => acc + desk.students.filter(s => s !== null).length, 0);
                const formattedDate = examDate.split('-').reverse().join('-');

                const uniqueClasses = Array.from(new Set(hall.desks.flatMap(d => d.students).filter(s => s !== null).map(s => s!.className))).sort();

                const summaryTableRows = [
                    // Row 1: Faculty Name
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Faculty Name", bold: true })] })], // Header
                                width: { size: 25, type: WidthType.PERCENTAGE },
                            }),
                            ...Array(6).fill(null).map(() => new TableCell({ children: [], width: { size: 12.5, type: WidthType.PERCENTAGE } }))
                        ]
                    }),
                    // Row 2: Date
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })],
                            }),
                            ...Array(6).fill(null).map(() => new TableCell({ children: [] }))
                        ]
                    }),
                    // Dynamic Rows: Classes
                    ...uniqueClasses.map(className =>
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: className, bold: true })] })],
                                }),
                                ...Array(6).fill(null).map(() => new TableCell({ children: [] }))
                            ]
                        })
                    ),
                    // Last Row: Faculty Sign
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Faculty Sign", bold: true })] })],
                            }),
                            ...Array(6).fill(null).map(() => new TableCell({ children: [] }))
                        ]
                    })
                ];

                const summaryTable = new Table({
                    rows: summaryTableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    alignment: AlignmentType.CENTER,
                    borders: {
                        top: { style: "single", size: 4, color: "000000" },
                        bottom: { style: "single", size: 4, color: "000000" },
                        left: { style: "single", size: 4, color: "000000" },
                        right: { style: "single", size: 4, color: "000000" },
                        insideVertical: { style: "single", size: 4, color: "000000" },
                        insideHorizontal: { style: "single", size: 4, color: "000000" },
                    }
                });

                return {
                    properties: {
                        page: {
                            size: { orientation: PageOrientation.LANDSCAPE },
                            margin: { top: 720, right: 720, bottom: 720, left: 720 }
                        }
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "HoD", bold: true, size: 24 })],
                                    alignment: AlignmentType.RIGHT,
                                })
                            ]
                        })
                    },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: collegeName, bold: true, size: 24 })],
                            heading: "Heading1",
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: deptName, size: 20 })],
                            heading: "Heading2",
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "UNIT TEST SEATING ARRANGEMENT", bold: true, size: 20 })],
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: `Room: ${hall.name.toUpperCase()}`, bold: true, size: 20 }),
                                new TextRun({ text: `\tDate: ${formattedDate}`, size: 20 })
                            ],
                            heading: "Heading3",
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({ text: "\n" }),
                        layoutTable,
                        new Paragraph({ text: "\n" }),
                        new Paragraph({
                            children: [new TextRun({ text: `Total Strength: ${totalStudents}`, bold: true, size: 20 })],
                            alignment: AlignmentType.LEFT,
                        }),
                        new Paragraph({ text: "\n" }),
                        summaryTable
                    ]
                };
            });

            const doc = new Document({
                sections: docSections
            });

            console.log("Document created, packing...");
            const blob = await Packer.toBlob(doc);
            console.log("Blob created, downloading...");
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filenameDate = examDate.split('-').reverse().join('-');
            link.download = `seating_arrangement_${filenameDate}.docx`;
            link.click();
        } catch (error) {
            console.error("Export Failed:", error);
            alert(`Export failed! Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };


    const resetAll = () => {
        setHalls([]);
        setClasses([]); // Wait, reset classes to empty? Or reload import?
        // Usually reset means clear assignments. 
        // But here I'm setting state to empty.
        // User probably wants to Clear Halls but keep classes?
        // I'll stick to full reset for now as implemented before.
        // Actually, let's keep it safe: Clear Halls only?
        setHalls([]);
    };

    return (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">

                {/* Sidebar */}
                <Sidebar classes={classes} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative">

                    {/* Header */}
                    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Exam Seating Manager
                        </h1>

                        <div className="flex gap-4 items-center">
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Edit College Details">
                                <Edit2 className="w-5 h-5" />
                            </button>

                            <button onClick={toggleAllHalls} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                                {expandedHallIds.length === halls.length ? "Collapse All" : "Expand All"}
                            </button>

                            <button onClick={() => setIsAddHallOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors">
                                <Plus className="w-4 h-4" /> Add Hall
                            </button>

                            {halls.length > 0 && (
                                <>
                                    <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                                        <Trash2 className="w-4 h-4" /> Reset All
                                    </button>
                                    <button onClick={exportDocx} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
                                        <Download className="w-4 h-4" /> Export DOCX
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Content Area */}
                    <main className="flex-1 overflow-auto bg-slate-950 relative p-6">
                        {halls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-8">
                                <div className="w-full max-w-lg">
                                    <ImportConfig onImport={handleImport} />
                                </div>
                                {classes.length > 0 && (
                                    <div className="text-center">
                                        <p className="text-slate-400 mb-4">Classes loaded! Now create a hall.</p>
                                        <button onClick={() => setIsAddHallOpen(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
                                            Create First Hall
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={cn(
                                "grid gap-8 pb-20",
                                expandedHallIds.length > 0 ? "grid-cols-1 w-full" : "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
                            )}>
                                {visibleHalls.map(hall => (
                                    <HallGrid
                                        key={hall.id}
                                        hall={hall}
                                        classes={classes}
                                        isExpanded={expandedHallIds.includes(hall.id)}
                                        onToggleExpand={() => toggleHallExpand(hall.id)}
                                        onEdit={() => setEditingHall(hall)}
                                        onDelete={() => removeHall(hall.id)}
                                        onClear={() => clearHallStudents(hall.id)}
                                        isSelectMode={selectionModeHallId === hall.id}
                                        onToggleSelectMode={() => toggleSelectionMode(hall.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDragId ? (
                        <div className="p-4 bg-indigo-600 text-white rounded-lg shadow-2xl opacity-90 cursor-grabbing">
                            Moving Class...
                        </div>
                    ) : null}
                </DragOverlay>


                {/* Modal for Middle Seat */}
                {
                    middleSeatPrompt && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                                <h3 className="text-xl font-bold mb-4 text-white">Conflict Resolution</h3>
                                <p className="mb-6 text-slate-300">
                                    Desk size is 3. You are mixing <strong>{middleSeatPrompt.classA}</strong> and <strong>{middleSeatPrompt.classB}</strong>.
                                    <br />Which class should occupy the middle seat?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => resolveConflict(middleSeatPrompt.classA)}
                                        className="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-600 transition-all text-white font-bold"
                                    >
                                        {middleSeatPrompt.classA}
                                    </button>
                                    <button
                                        onClick={() => resolveConflict(middleSeatPrompt.classB)}
                                        className="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-600 transition-all text-white font-bold"
                                    >
                                        {middleSeatPrompt.classB}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
                            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                <School className="w-6 h-6 text-purple-500" />
                                Institutional Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-400">College Name</label>
                                    <input type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-400">Department</label>
                                    <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-400">Exam Date</label>
                                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white" />
                                </div>
                                <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-all">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Hall Modal */}
                {isAddHallOpen && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="relative">
                            <button onClick={() => setIsAddHallOpen(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300"><X /></button>
                            <HallSetup onSave={createHall} initialValues={lastHallConfig || undefined} />
                        </div>
                    </div>
                )}

                {/* Edit Hall Modal */}
                {editingHall && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
                            <button onClick={() => setEditingHall(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-bold mb-6 text-white">Edit Hall: {editingHall.name}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-400">Hall Name</label>
                                    <input
                                        type="text"
                                        value={editingHall.name}
                                        onChange={(e) => setEditingHall({ ...editingHall, name: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-400">Rows</label>
                                        <input
                                            type="number" min="1"
                                            value={editingHall.rows}
                                            onChange={(e) => setEditingHall({ ...editingHall, rows: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-400">Columns</label>
                                        <input
                                            type="number" min="1"
                                            value={editingHall.cols}
                                            onChange={(e) => setEditingHall({ ...editingHall, cols: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-400">Desk Capacity</label>
                                    <input
                                        type="number" min="1" max="4"
                                        value={editingHall.deskCapacity}
                                        onChange={(e) => setEditingHall({ ...editingHall, deskCapacity: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                    />
                                </div>
                                <div className="p-3 bg-yellow-500/10 text-yellow-500 text-xs rounded-lg border border-yellow-500/20">
                                    Warning: Changing dimensions will reset the seating arrangement for this hall.
                                </div>
                                <button onClick={() => updateHall(editingHall)} className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-all">
                                    Update Hall
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </div >
            <footer className='overflow-hidden bg-slate-900 p-5'>
                <h1 className='text-slate-500 hover:text-purple-500 cursor-pointer text-center font-mono'>Created By Karthikrishna</h1>
                <a className='text-slate-500 hover:text-purple-500 cursor-pointer text-center font-mono block' href="mailto:karthikrishna465@gmail.com">karthikrishna465@gmail.com</a>
            </footer>
        </DndContext >
    );
}
export default App;

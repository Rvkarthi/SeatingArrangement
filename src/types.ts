export interface Student {
    registerNumber: string;
    className: string;
}

export interface ClassGroup {
    name: string;
    students: Student[];
    color: string;
}

export interface Desk {
    id: string; // e.g., "row-col"
    row: number;
    col: number;
    students: (Student | null)[];
}

export interface Hall {
    id: string;
    name: string; // "ROOM NAME"
    rows: number;
    cols: number;
    deskCapacity: number;
    desks: Desk[];
}

export interface AppState {
    classes: ClassGroup[];
    hall: Hall | null;
    date: string;
}

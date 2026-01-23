import * as XLSX from 'xlsx';
import { ClassGroup, Student } from '../types';

export const parseExcel = async (file: File): Promise<ClassGroup[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON (rows)
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                const headers = jsonData[0] as string[]; // Class names
                const classes: ClassGroup[] = headers.map((name, index) => ({
                    name,
                    students: [],
                    color: getRandomColor(index),
                }));

                // Iterate rows starting from 1
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as (string | number)[];
                    row.forEach((cell, colIndex) => {
                        if (cell && classes[colIndex]) {
                            classes[colIndex].students.push({
                                registerNumber: String(cell),
                                className: classes[colIndex].name
                            });
                        }
                    });
                }

                resolve(classes);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const getRandomColor = (index: number) => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500',
        'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
        'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];
    return colors[index % colors.length];
};

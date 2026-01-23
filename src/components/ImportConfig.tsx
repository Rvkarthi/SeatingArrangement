import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseExcel } from '../utils/excel';
import { ClassGroup } from '../types';

interface ImportConfigProps {
    onImport: (classes: ClassGroup[]) => void;
}

export const ImportConfig: React.FC<ImportConfigProps> = ({ onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const classes = await parseExcel(e.target.files[0]);
            onImport(classes);
        }
    };

    return (
        <div className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-6 text-xl font-bold">
                <FileSpreadsheet className="w-6 h-6" />
                <h2>Data Import</h2>
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all text-center"
            >
                <Upload className="w-10 h-10 mb-3 text-purple-400" />
                <p className="font-medium">Click to upload Excel</p>
                <p className="text-xs text-white/60 mt-2">.xlsx files only</p>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx"
                className="hidden"
            />
        </div>
    );
};

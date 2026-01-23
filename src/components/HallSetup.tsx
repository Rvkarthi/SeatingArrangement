import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

interface HallSetupProps {
    onSave: (config: { name: string; rows: number; cols: number; capacity: number }) => void;
    initialValues?: { name: string; rows: number; cols: number; capacity: number };
}

export const HallSetup: React.FC<HallSetupProps> = ({ onSave, initialValues }) => {
    const [name, setName] = useState(initialValues?.name || 'Hall 1');
    const [rows, setRows] = useState(initialValues?.rows || 5);
    const [cols, setCols] = useState(initialValues?.cols || 4);
    const [capacity, setCapacity] = useState(initialValues?.capacity || 2);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, rows, cols, capacity });
    };

    return (
        <div className="p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl text-white">
            <div className="flex items-center gap-2 mb-6 text-xl font-bold">
                <Settings className="w-6 h-6" />
                <h2>Hall Configuration</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Room Name</label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Rows</label>
                        <input
                            type="number"
                            min="1"
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Columns</label>
                        <input
                            type="number"
                            min="1"
                            value={cols}
                            onChange={(e) => setCols(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Students per Desk</label>
                    <input
                        type="number"
                        min="1"
                        max="4"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
                >
                    <Save className="w-4 h-4" />
                    Create Hall
                </button>
            </form>
        </div>
    );
};

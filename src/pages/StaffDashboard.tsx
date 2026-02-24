import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft, Settings, Database } from 'lucide-react';

const StaffDashboard: React.FC = () => {
    const { business } = useParams<{ business: string }>();
    const navigate = useNavigate();

    const businessNames: Record<string, string> = {
        coffee: 'Coffee Shop',
        laundry: 'Elite Laundry',
        salon: 'VIP Salon'
    };

    return (
        <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center">
            <div className="w-full max-w-md flex flex-col h-[calc(100vh-48px)]">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <button onClick={() => navigate('/staff')} className="p-2 glass rounded-full">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-xs text-[#444] uppercase tracking-[0.2em] font-bold">Manager Mode</h2>
                        <h1 className="text-xl font-bold text-white">{businessNames[business || ''] || 'Business'}</h1>
                    </div>
                    <button className="p-2 glass rounded-full opacity-20">
                        <Settings size={20} className="text-white" />
                    </button>
                </div>

                {/* Big Scan Button Area */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/staff/scan/${business}`)}
                        className="w-64 h-64 bg-white rounded-[60px] flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(255,255,255,0.1)] relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[#d4af37] opacity-0 group-active:opacity-100 transition-opacity"></div>
                        <QrCode size={80} className="text-black mb-4 relative z-10" />
                        <span className="text-black font-black text-xl uppercase tracking-tighter relative z-10">Scan Member</span>
                    </motion.button>

                    <p className="mt-8 text-sm text-[#a0a0a0] max-w-[200px] text-center">
                        Instantly detect member and update VIP points
                    </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="glass p-5 rounded-3xl">
                        <Database size={20} className="text-[#d4af37] mb-2" />
                        <p className="text-2xl font-bold">--</p>
                        <p className="text-[10px] text-[#444] uppercase tracking-widest">Today's Scans</p>
                    </div>
                    <div className="glass p-5 rounded-3xl">
                        <Settings size={20} className="text-[#d4af37] mb-2" />
                        <p className="text-2xl font-bold">--</p>
                        <p className="text-[10px] text-[#444] uppercase tracking-widest">Active Rewards</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;

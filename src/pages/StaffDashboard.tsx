import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft, Activity } from 'lucide-react';

const StaffDashboard: React.FC = () => {
    const { business } = useParams<{ business: string }>();
    const navigate = useNavigate();

    const businessNames: Record<string, string> = {
        coffee: 'Coffee Shop',
        laundry: 'Elite Laundry',
        salon: 'VIP Salon'
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center">
            <div className="w-full max-w-sm flex flex-col items-center justify-between h-screen p-8 py-16">

                <div className="w-full flex justify-between items-center">
                    <button onClick={() => navigate('/staff')} className="text-gray-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-right">
                        <h2 className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] font-black">Manager</h2>
                        <p className="text-lg font-black tracking-tighter">{businessNames[business || '']}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(`/staff/scan/${business}`)}
                        className="w-full aspect-square bg-white rounded-[60px] flex flex-col items-center justify-center shadow-[0_40px_100px_rgba(255,255,255,0.05)]"
                    >
                        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6">
                            <QrCode size={48} className="text-white" />
                        </div>
                        <span className="text-black font-black text-2xl uppercase tracking-tighter">TAP TO SCAN</span>
                    </motion.button>
                    <p className="mt-8 text-[11px] text-gray-600 font-bold uppercase tracking-widest text-center max-w-[200px]">
                        Camera will open instantly for VIP detection
                    </p>
                </div>

                <div className="w-full bg-white/5 p-6 rounded-[32px] flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">System Live</span>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>

            </div>
        </div>
    );
};

export default StaffDashboard;

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
        <div className="min-h-screen bg-[#050408] flex flex-col items-center relative overflow-hidden">
            <div className="glow-bg"></div>

            <div className="w-full max-w-sm flex flex-col items-center justify-between h-screen p-8 py-16 z-10">

                <div className="w-full flex justify-between items-center">
                    <button onClick={() => navigate('/staff')} className="text-white/30 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-right">
                        <p className="member-label" style={{ fontSize: '9px', marginBottom: '0' }}>MANAGER</p>
                        <p className="text-xl font-black tracking-tighter text-white">{businessNames[business || '']}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/staff/scan/${business}`)}
                        className="w-full aspect-square bg-[#d1b8ff] rounded-[80px] flex flex-col items-center justify-center shadow-[0_40px_100px_rgba(157,80,255,0.2)] border-b-8 border-[#9d50ff]"
                    >
                        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
                            <QrCode size={48} className="text-[#d1b8ff]" />
                        </div>
                        <span className="text-black font-black text-2xl uppercase tracking-tighter">TAP TO SCAN</span>
                    </motion.button>
                    <p className="mt-12 text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] text-center max-w-[200px] leading-relaxed">
                        Camera will open instantly for VIP detection
                    </p>
                </div>

                <div className="w-full bg-white/5 p-6 rounded-[32px] flex items-center justify-between border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#9d50ff]/10 text-[#9d50ff] rounded-full flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-[#d1b8ff] opacity-60">System Live</span>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-[#9d50ff] animate-pulse shadow-[0_0_10px_#9d50ff]"></div>
                </div>

            </div>
        </div>
    );
};

export default StaffDashboard;

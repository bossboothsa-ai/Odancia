import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Shirt, Scissors, ShieldCheck } from 'lucide-react';

const StaffLogin: React.FC = () => {
    const navigate = useNavigate();

    const businesses = [
        { id: 'coffee', name: 'Coffee Shop', icon: <Coffee size={32} />, color: '#d4af37' },
        { id: 'laundry', name: 'Elite Laundry', icon: <Shirt size={32} />, color: '#60a5fa' },
        { id: 'salon', name: 'VIP Salon', icon: <Scissors size={32} />, color: '#c084fc' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#222] rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Staff Management</h1>
                    <p className="text-[#a0a0a0]">Select your business to continue</p>
                </div>

                <div className="space-y-4">
                    {businesses.map((biz) => (
                        <button
                            key={biz.id}
                            onClick={() => navigate(`/staff/dashboard/${biz.id}`)}
                            className="w-full glass p-6 rounded-3xl flex items-center gap-6 group hover:bg-white/5"
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95"
                                style={{ backgroundColor: `${biz.color}20`, color: biz.color }}
                            >
                                {biz.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-xl font-bold text-white">{biz.name}</h3>
                                <p className="text-sm text-[#444] uppercase tracking-wider font-semibold">Tapper Access</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default StaffLogin;

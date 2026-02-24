import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Shirt, Scissors } from 'lucide-react';

const StaffLogin: React.FC = () => {
    const navigate = useNavigate();

    const businesses = [
        { id: 'coffee', name: 'Coffee Shop', icon: <Coffee size={24} />, color: '#d4af37' },
        { id: 'laundry', name: 'Elite Laundry', icon: <Shirt size={24} />, color: '#60a5fa' },
        { id: 'salon', name: 'VIP Salon', icon: <Scissors size={24} />, color: '#c084fc' },
    ];

    return (
        <div className="min-h-screen bg-black p-8 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-16">
                    <h1 className="text-2xl font-black uppercase tracking-[0.3em] mb-2">✦ STAFF ENTRANCE</h1>
                    <p className="text-xs text-gray-600 font-extrabold uppercase tracking-widest">Select business to scan</p>
                </div>

                <div className="space-y-4">
                    {businesses.map((biz) => (
                        <button
                            key={biz.id}
                            onClick={() => navigate(`/staff/dashboard/${biz.id}`)}
                            className="w-full bg-white/5 border border-white/5 p-8 rounded-[32px] flex items-center gap-6 group active:scale-95 transition-all"
                        >
                            <div
                                className="w-16 h-16 rounded-[24px] flex items-center justify-center"
                                style={{ backgroundColor: `${biz.color}20`, color: biz.color }}
                            >
                                {biz.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-xl font-extrabold tracking-tight text-white">{biz.name}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ready to scan</p>
                            </div>
                        </button>
                    ))}
                </div>

                <p className="mt-20 text-center text-[10px] text-gray-800 font-black uppercase tracking-widest">
                    Authorization Required • Admin Only
                </p>
            </motion.div>
        </div>
    );
};

export default StaffLogin;

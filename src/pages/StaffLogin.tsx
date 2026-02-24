import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Shirt, Scissors } from 'lucide-react';

const StaffLogin: React.FC = () => {
    const navigate = useNavigate();

    const businesses = [
        { id: 'coffee', name: 'Coffee Shop', icon: <Coffee size={24} />, color: '#d1b8ff' },
        { id: 'laundry', name: 'Elite Laundry', icon: <Shirt size={24} />, color: '#60a5fa' },
        { id: 'salon', name: 'VIP Salon', icon: <Scissors size={24} />, color: '#c084fc' },
    ];

    return (
        <div className="min-h-screen bg-[#050408] p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="glow-bg"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-16">
                    <p className="member-label">✦ AUTHENTICATION REQUIRED</p>
                    <h1 className="customer-name" style={{ fontSize: '32px' }}>STAFF ENTRANCE</h1>
                </div>

                <div className="space-y-4">
                    {businesses.map((biz) => (
                        <button
                            key={biz.id}
                            onClick={() => navigate(`/staff/dashboard/${biz.id}`)}
                            className="w-full bg-white/5 border border-white/5 p-8 rounded-[32px] flex items-center gap-6 group active:scale-95 transition-all backdrop-blur-xl"
                        >
                            <div
                                className="w-16 h-16 rounded-[24px] flex items-center justify-center"
                                style={{ backgroundColor: `${biz.color}20`, color: biz.color, boxShadow: `0 0 20px ${biz.color}30` }}
                            >
                                {biz.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-xl font-extrabold tracking-tight text-white">{biz.name}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Authorized Scan Mode</p>
                            </div>
                        </button>
                    ))}
                </div>

                <p className="mt-20 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">
                    Odancia Private Reserve • Admin System
                </p>
            </motion.div>
        </div>
    );
};

export default StaffLogin;

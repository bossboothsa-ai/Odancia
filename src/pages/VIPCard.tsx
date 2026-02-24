import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coffee, Scissors, Shirt, Sparkles } from 'lucide-react';

const VIPCard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
        const interval = setInterval(fetchUserData, 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold tracking-widest text-xs uppercase text-gray-500">Retrieving Status...</div>;
    if (!user) return <div className="min-h-screen flex items-center justify-center">Member not found.</div>;

    const rewards = [
        { key: 'coffee', name: 'Coffee Shop', icon: <Coffee size={14} />, target: 8, color: '#d4af37' },
        { key: 'laundry', name: 'Laundry Credit', icon: <Shirt size={14} />, target: 100, isCash: true, color: '#60a5fa' },
        { key: 'salon', name: 'VIP Salon', icon: <Scissors size={14} />, target: 5, color: '#c084fc' },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-black overflow-y-auto pb-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                <div className="vip-card-container mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] items-center flex gap-1 font-extrabold uppercase tracking-[0.3em] text-[#d4af37] mb-1">
                                VIP MEMBER <Sparkles size={10} />
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight truncate">{user.name}</h1>
                        </div>
                        {user.isBirthday && (
                            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-full transform rotate-12">
                                🎂
                            </div>
                        )}
                    </div>

                    <div className="qr-wrapper">
                        <QRCodeSVG value={user.id} size={180} level="H" />
                    </div>

                    <div className="space-y-6 mt-6">
                        {rewards.map(reward => {
                            const balance = user.balances[reward.key];
                            const progress = Math.min((balance / reward.target) * 100, 100);
                            return (
                                <div key={reward.key} className="space-y-2">
                                    <div className="flex justify-between items-end text-xs font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-2 opacity-50">
                                            {reward.icon}
                                            {reward.name}
                                        </span>
                                        <span style={{ color: reward.color }}>
                                            {reward.isCash ? `R${balance}` : `${balance} / ${reward.target}`}
                                        </span>
                                    </div>
                                    <div className="progress-container">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progress}%`, backgroundColor: reward.color, boxShadow: `0 0 10px ${reward.color}40` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                                        {progress >= 100 ? '✨ REWARD READY TO REDEEM' : `Next Reward Progress: ${Math.round(progress)}%`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence>
                    {user.isBirthday && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] p-6 rounded-[24px] text-black text-center mb-6"
                        >
                            <h2 className="text-xl font-black mb-1">HAPPY BIRTHDAY! 🎂</h2>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">Your special VIP reward is waiting for you at the counter.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-[10px] text-gray-700 uppercase tracking-widest font-black mt-4">
                    TAP QR TO SCALE • SHOW TO STAFF
                </p>
            </motion.div>
        </div>
    );
};

export default VIPCard;

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const VIPCard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReaction, setShowReaction] = useState<string | null>(null);
    const prevBalances = useRef<any>(null);

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            const newData = response.data;

            // Reaction Logic for live updates
            if (prevBalances.current) {
                const businesses = ['coffee', 'laundry', 'salon'];
                businesses.forEach(biz => {
                    const oldVal = prevBalances.current[biz];
                    const newVal = newData.balances[biz];
                    if (newVal > oldVal) {
                        setShowReaction(`✨ Visit Added!`);
                    } else if (newVal === 0 && oldVal > 0) {
                        setShowReaction(`🎉 Reward Used!`);
                    }
                });
            }

            prevBalances.current = newData.balances;
            setUser(newData);

            if (showReaction) {
                setTimeout(() => setShowReaction(null), 3500);
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
        const interval = setInterval(fetchUserData, 2000); // Fast heartbeat for real-time feel
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#050408] flex items-center justify-center">
            <p className="text-[11px] font-bold tracking-[0.5em] text-white/20 uppercase">Verifying Access…</p>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen bg-[#050408] flex items-center justify-center p-8 text-center text-white/50">
            Invalid Member Card.
        </div>
    );

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center">
            <div className="glow-bg"></div>

            {/* REAL-TIME SYNC FEEDBACK */}
            <AnimatePresence>
                {showReaction && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
                    >
                        <div className="bg-white text-black p-5 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex items-center gap-4 border-b-4 border-[#9d50ff]">
                            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                            <p className="font-extrabold text-sm uppercase tracking-tight">{showReaction}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="vip-pass-root flex-1 flex flex-col justify-center">

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <p className="member-label">✦ MEMBER ACCESS</p>
                    <h1 className="customer-name">{user.name}</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="qr-glass-card animate-float"
                >
                    <div className="qr-glow-inner"></div>
                    <div className="qr-content">
                        <QRCodeSVG
                            value={`${window.location.origin}/scan/${user.id}`}
                            size={200}
                            level="H"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="status-divider">
                        <div className="line"></div>
                        <span className="text">CURRENT STATUS</span>
                        <div className="line"></div>
                    </div>

                    <div className="status-list">
                        <div className="status-row">
                            <span>☕ Coffee Access</span>
                            <span>{user.balances.coffee} / 8</span>
                        </div>
                        <div className="status-row">
                            <span>🧺 Laundry Credit</span>
                            <span>R{user.balances.laundry}</span>
                        </div>
                        <div className="status-row">
                            <span>✂ VIP Salon</span>
                            <span>{user.balances.salon} / 5</span>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-12 text-center text-[10px] text-white/5 font-bold tracking-[0.4em] uppercase">
                    Odancia Elite Membership
                </div>

            </div>
        </div>
    );
};

export default VIPCard;

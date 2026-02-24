import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { motion } from 'framer-motion';

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

    if (loading) return (
        <div className="min-h-screen bg-[#07060a] flex items-center justify-center">
            <p className="text-[10px] font-bold tracking-[0.4em] text-gray-600 uppercase">Verifying Access...</p>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen bg-[#07060a] flex items-center justify-center">
            <p className="text-white opacity-50">Invalid Access Pass</p>
        </div>
    );

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center">
            {/* Background Effects */}
            <div className="glow-bg"></div>

            <div className="vip-pass-root flex-1 flex flex-col justify-center">

                {/* 1. TOP SECTION */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="member-label">✦ MEMBER ACCESS</p>
                    <h1 className="customer-name">{user.name}</h1>
                </motion.div>

                {/* 2. CENTER SECTION (QR Domination) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="qr-glass-card animate-float"
                >
                    <div className="qr-glow-inner"></div>
                    <div className="qr-content">
                        <QRCodeSVG
                            value={user.id}
                            size={200}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </motion.div>

                {/* 3. DIVIDER & 4. STATUS SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="status-divider">
                        <div className="line"></div>
                        <span className="text">ACCESS STATUS</span>
                        <div className="line"></div>
                    </div>

                    <div className="status-list">
                        <div className="status-row">
                            <span>☕ Coffee Access</span>
                            <span>{user.balances.coffee} / 8 visits</span>
                        </div>
                        <div className="status-row">
                            <span>🧺 Laundry Credit</span>
                            <span>R{user.balances.laundry}</span>
                        </div>
                        <div className="status-row">
                            <span>✂ VIP Salon</span>
                            <span>{user.balances.salon} / 5 visits</span>
                        </div>
                    </div>
                </motion.div>

                {/* Vertical Fill Helper */}
                <div className="mt-8 text-center text-[10px] text-white/10 font-bold tracking-[0.5em] uppercase">
                    Odancia Private Reserve
                </div>

            </div>
        </div>
    );
};

export default VIPCard;

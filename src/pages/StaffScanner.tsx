import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

const StaffScanner: React.FC = () => {
    const { business } = useParams<{ business: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    useEffect(() => {
        // Automatically start camera on load
        if (!customer) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 20, qrbox: { width: 300, height: 300 } },
                false
            );

            scanner.render(onScanSuccess, () => { });

            function onScanSuccess(decodedText: string) {
                scanner.clear();
                handleFetchCustomer(decodedText);
            }

            return () => {
                scanner.clear().catch(e => console.error("Scanner clear failed", e));
            };
        }
    }, [customer]);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
        } catch (error) {
            alert("Member not found.");
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: 'add' | 'redeem') => {
        if (!customer) return;
        setLoading(true);
        try {
            const amount = type === 'add' ? (business === 'laundry' ? 20 : 1) : 0;
            const response = await axios.post(`${API_BASE}/api/update-points`, {
                userId: customer.id,
                business,
                amount,
                type
            });
            setCustomer(response.data);
            setSuccessMsg(type === 'add' ? 'POINTS ADDED' : 'REWARD REDEEMED');
            setTimeout(() => setSuccessMsg(''), 2000);
        } catch (error) {
            alert("Update failed.");
        } finally {
            setLoading(false);
        }
    };

    const currentBalance = customer?.balances[business || ''] || 0;
    const target = business === 'salon' ? 5 : 8;
    const isEligible = business === 'laundry' ? currentBalance >= 100 : currentBalance >= target;

    return (
        <div className="min-h-screen bg-black">
            {/* Camera View - Auto Open */}
            {!customer && (
                <div className="scanner-view">
                    <div id="reader"></div>
                    <div className="scanner-overlay">
                        <div className="scanner-guide"></div>
                        <div className="absolute top-20 text-center w-full">
                            <h2 className="text-white text-xs uppercase font-black tracking-[0.5em] mb-2">Scanning VIP Member</h2>
                            <button onClick={() => navigate('/staff')} className="p-4 rounded-full bg-white/10 text-white">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Scan Experience */}
            <AnimatePresence>
                {customer && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed inset-0 bg-black z-50 p-8 flex flex-col justify-center items-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="w-full max-w-sm"
                        >
                            <div className="flex flex-col items-center mb-12">
                                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4">
                                    {customer.name[0]}
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter">{customer.name}</h1>
                                <p className="text-[10px] items-center flex gap-1 font-extrabold uppercase tracking-[0.4em] text-[#d4af37] mt-2">
                                    VIP MEMBER {customer.isBirthday && '🎂'}
                                </p>
                            </div>

                            <div className="bg-white/5 p-8 rounded-[40px] mb-8 text-center border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Current Progress</p>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-6xl font-black">
                                        {business === 'laundry' ? `R${currentBalance}` : `${currentBalance}`}
                                    </span>
                                    <span className="opacity-20 text-4xl font-black">/ {business === 'laundry' ? '100' : target}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    className="btn-main btn-accent"
                                    onClick={() => handleUpdate('add')}
                                    disabled={loading}
                                >
                                    {business === 'laundry' ? '+ R20 CREDIT' : '+ ADD VISIT'}
                                </button>
                                <button
                                    className={`btn-main ${isEligible ? 'bg-white' : 'bg-white/5 text-white/20'}`}
                                    onClick={() => handleUpdate('redeem')}
                                    disabled={loading || !isEligible}
                                >
                                    REDEEM REWARD
                                </button>
                                <button
                                    className="btn-main bg-transparent border border-white/10 text-white/40 mt-12"
                                    onClick={() => setCustomer(null)}
                                >
                                    SCAN NEXT
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback Popups */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-6 rounded-[30px] shadow-2xl z-[60] flex items-center gap-4"
                    >
                        <CheckCircle className="text-green-500" />
                        <span className="font-extrabold uppercase tracking-widest text-sm">{successMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffScanner;

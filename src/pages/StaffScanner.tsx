import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const StaffScanner: React.FC = () => {
    const { business } = useParams<{ business: string }>();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    const startScanner = () => {
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 20, qrbox: { width: 300, height: 300 } },
                false
            );
            scannerRef.current = scanner;
            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    scannerRef.current = null;
                    handleFetchCustomer(decodedText);
                },
                () => { }
            );
        }
    };

    useEffect(() => {
        if (!customer && !actionFeedback) {
            startScanner();
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
        };
    }, [customer, actionFeedback]);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
        } catch (error) {
            alert("Member not found.");
            // Return to scan mode automatically on error
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: 'add' | 'redeem') => {
        if (!customer || loading) return;

        const currentBalance = customer.balances[business || ''] || 0;
        const target = business === 'salon' ? 5 : 8;

        if (type === 'redeem' && currentBalance < target && business !== 'laundry') {
            alert("Not enough visits to redeem.");
            return;
        }

        setLoading(true);
        try {
            const amount = type === 'add' ? (business === 'laundry' ? 20 : 1) : 0;
            const response = await axios.post(`${API_BASE}/api/update-points`, {
                userId: customer.id,
                business,
                amount,
                type
            });

            // Update UI instantly
            setCustomer(response.data);
            setActionFeedback(type === 'add' ? 'Visit Added ✅' : 'Reward Redeemed ✅');

            // Wait 2 seconds then auto-return to scan
            setTimeout(() => {
                setActionFeedback('');
                setCustomer(null);
            }, 2000);

        } catch (error) {
            alert("Update Failed");
        } finally {
            setLoading(false);
        }
    };

    const currentBalance = customer?.balances[business || ''] || 0;
    const target = business === 'salon' ? 5 : 8;

    return (
        <div className="min-h-screen w-full bg-[#050408] relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="glow-bg"></div>

            <AnimatePresence mode="wait">
                {(!customer && !actionFeedback) ? (
                    /* SCAN MODE (AUTOMATIC) */
                    <motion.div
                        key="scanner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="scan-view-container"
                    >
                        <p className="staff-header-label">✦ MEMBER SCAN</p>
                        <div className="scanner-frame-wrapper">
                            <div className="scan-line"></div>
                            <div id="reader"></div>
                        </div>
                        <p className="scan-bottom-text">Scanning for VIP Member...</p>
                    </motion.div>
                ) : actionFeedback ? (
                    /* FEEDBACK STATE */
                    <motion.div
                        key="feedback"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 bg-white/5 border border-[#9d50ff] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(157,80,255,0.3)]">
                            <span className="text-4xl">✨</span>
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">{actionFeedback}</h1>
                        <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-[10px]">Returning to scan mode...</p>
                    </motion.div>
                ) : (
                    /* MEMBER SCREEN (POST-SCAN) */
                    <motion.div
                        key="detected"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="member-detected-card"
                    >
                        <p className="staff-header-label">✦ MEMBER SCAN SUCCESS</p>

                        <div>
                            <h1 className="detected-name">{customer.name}</h1>
                            <p className="detected-vip-tag">✦ VIP MEMBER</p>
                        </div>

                        <div className="detected-divider"></div>

                        <p className="detected-status-text">
                            {business === 'laundry'
                                ? `Laundry Credit: R${currentBalance}`
                                : `${business === 'coffee' ? 'Coffee' : 'Salon'} Progress: ${currentBalance} / ${target} visits`
                            }
                        </p>

                        <div className="space-y-4 w-full px-4">
                            <button
                                disabled={loading}
                                onClick={() => handleUpdate('add')}
                                className="staff-button primary"
                            >
                                + Add Visit
                            </button>
                            <button
                                disabled={loading}
                                onClick={() => handleUpdate('redeem')}
                                className="staff-button"
                            >
                                Redeem Reward
                            </button>

                            <button
                                onClick={() => {
                                    setCustomer(null);
                                    setActionFeedback('');
                                }}
                                className="w-full pt-8 text-[10px] font-bold uppercase tracking-[0.4em] text-white/10"
                            >
                                Cancel & Back to Scan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffScanner;

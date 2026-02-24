import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const StaffScanner: React.FC = () => {
    const { business } = useParams<{ business: string }>();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    useEffect(() => {
        // Auto-open camera on load/reset
        if (!customer) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 20, qrbox: { width: 300, height: 300 } },
                false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    handleFetchCustomer(decodedText);
                },
                () => { }
            );

            return () => {
                scanner.clear().catch(e => console.error(e));
            };
        }
    }, [customer]);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
        } catch (error) {
            alert("No Member Detected.");
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
            alert(type === 'add' ? 'Visit Added' : 'Reward Redeemed');
            setCustomer(null); // Return to scan mode after action
        } catch (error) {
            alert("Update Failed");
        } finally {
            setLoading(false);
        }
    };

    const currentBalance = customer?.balances[business || ''] || 0;
    const target = business === 'salon' ? 5 : 8;

    return (
        <div className="min-h-screen w-full bg-[#07060a] relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="glow-bg"></div>

            <AnimatePresence mode="wait">
                {!customer ? (
                    /* SCREEN 1: SCAN MODE */
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

                        <p className="scan-bottom-text">Scan VIP Member</p>
                    </motion.div>
                ) : (
                    /* SCREEN 2: MEMBER DETECTED */
                    <motion.div
                        key="detected"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="member-detected-card"
                    >
                        <p className="staff-header-label">✦ MEMBER SCAN</p>

                        <div>
                            <h1 className="detected-name">{customer.name}</h1>
                            <p className="detected-vip-tag">✦ VIP</p>
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
                                onClick={() => setCustomer(null)}
                                className="w-full pt-8 text-[10px] font-bold uppercase tracking-[0.4em] text-white/20"
                            >
                                Cancel Scan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffScanner;

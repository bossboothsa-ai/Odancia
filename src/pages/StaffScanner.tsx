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
    const [scanError, setScanError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [staffView, setStaffView] = useState<'home' | 'scan'>('home');
    const [stats, setStats] = useState({ totalMembers: 0, visitsThisWeek: 0, rewardsRedeemed: 0 });
    const [activeAction, setActiveAction] = useState<'add' | 'redeem' | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/stats/${business}`);
            setStats(res.data);
        } catch (e) {
            console.error("Stats fetch failed", e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [business]);

    const startScanner = (retries = 0) => {
        if (scannerRef.current) return;

        const readerDiv = document.getElementById('reader');
        if (!readerDiv) {
            if (retries < 5) {
                console.log(`Reader div not found, retrying... (${retries + 1})`);
                setTimeout(() => startScanner(retries + 1), 250);
            } else {
                console.error("Reader div never appeared.");
            }
            return;
        }

        console.log("Initializing scanner on #reader...");
        try {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 20,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: { ideal: "environment" }
                    }
                },
                false
            );
            scannerRef.current = scanner;

            scanner.render(
                (decodedText) => {
                    console.log("QR RAW:", decodedText);
                    const text = decodedText;

                    // STEP 2: Extract member ID safely (Full URL vs Raw ID)
                    const urlMatch = text.match(/\/card\/([A-Za-z0-9_-]+)/)
                        || text.match(/\/scan\/([A-Za-z0-9_-]+)/);

                    // Priority: URL match group 1, then check if raw text looks like an ID (vip_)
                    const memberId = urlMatch
                        ? urlMatch[1]
                        : (text.startsWith('vip_') ? text : null);

                    console.log("EXTRACTED ID:", memberId);

                    if (memberId) {
                        scanner.clear().then(() => {
                            scannerRef.current = null;
                            handleFetchCustomer(memberId);
                        }).catch(err => {
                            console.error("Scanner clear failed", err);
                            handleFetchCustomer(memberId);
                        });
                    } else if (text.includes('/vip') || text.includes('/join')) {
                        setScanError('This QR is for joining only. Please scan member card.');
                    } else {
                        setScanError('Invalid member QR. Please scan a valid Member Card.');
                    }
                },
                (_err) => {
                    // This is called for every frame where no QR is found.
                    // We use it as a signal that the camera is actually feeding video.
                    if (!cameraReady) setCameraReady(true);
                }
            );
        } catch (e) {
            console.error("Scanner initialization failed", e);
        }

        // Safety fallback to show UI
        setTimeout(() => setCameraReady(true), 1500);
    };

    useEffect(() => {
        if (staffView === 'scan' && !customer && !actionFeedback && !scanError) {
            startScanner();
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Scanner exit clear error", e));
                scannerRef.current = null;
            }
        };
    }, [staffView, customer, actionFeedback, scanError]);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
            setCameraReady(false); // Reset for next scan
        } catch (error) {
            setScanError("Member not found.");
            // AUTO RESTART SCAN after 2 seconds
            setTimeout(() => {
                setScanError('');
                setCustomer(null);
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: 'add' | 'redeem') => {
        if (!customer || loading) return;

        const currentBalance = customer.balances[business || ''] || 0;
        const target = business === 'salon' ? 5 : 8;

        if (type === 'redeem' && currentBalance < target && business !== 'laundry') {
            alert("Reward requirement not reached.");
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

            // PREVENT BLANK SCREEN: Update state directly without refresh
            const updatedCustomer = response.data;
            setCustomer(updatedCustomer);
            setActionFeedback(type === 'add' ? 'Visit Added ✅' : 'Reward Redeemed 🎉');

            // AUTO RETURN TO SCAN after 1.5 seconds (User requested)
            setTimeout(() => {
                setActionFeedback('');
                setCustomer(null);
                setScanError('');
                setCameraReady(false);
                setStaffView('home');
                fetchStats();
            }, 1500);

        } catch (error) {
            alert("System Error. Try Again.");
            setLoading(false);
        }
    };

    const currentBalance = customer?.balances[business || ''] || 0;
    const target = business === 'salon' ? 5 : 8;

    return (
        <div className="min-h-screen w-full bg-[#050408] relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="glow-bg"></div>

            <AnimatePresence mode="wait">
                {staffView === 'home' ? (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-sm"
                    >
                        <div className="text-center mb-12">
                            <p className="member-label">✦ {business?.toUpperCase()} STATION</p>
                            <h1 className="customer-name" style={{ fontSize: '32px' }}>Scan Station</h1>
                        </div>

                        {/* PART 3: REORDERED - BUTTONS FIRST */}
                        <div className="space-y-4 mb-16">
                            <button
                                onClick={() => { setStaffView('scan'); setActiveAction('add'); }}
                                className="staff-button primary"
                            >
                                Add Visit
                            </button>
                            <button
                                onClick={() => { setStaffView('scan'); setActiveAction('redeem'); }}
                                className="staff-button"
                            >
                                Redeem Reward
                            </button>
                        </div>

                        {/* PART 3: REDUCED METRICS WEIGHT */}
                        <div className="pt-8 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-6 text-center">Today Activity</p>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-baseline justify-between opacity-70 px-4">
                                    <p className="text-[13px] font-medium text-gray-400">Total Members</p>
                                    <p className="text-xl font-black text-white">{stats.totalMembers}</p>
                                </div>
                                <div className="flex items-baseline justify-between opacity-70 px-4">
                                    <p className="text-[13px] font-medium text-gray-400">Visits This Week</p>
                                    <p className="text-xl font-black text-[#d1b8ff]">{stats.visitsThisWeek}</p>
                                </div>
                                <div className="flex items-baseline justify-between opacity-70 px-4">
                                    <p className="text-[13px] font-medium text-gray-400">Rewards Redeemed</p>
                                    <p className="text-xl font-black text-[#9d50ff]">{stats.rewardsRedeemed}</p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-16 text-center text-[10px] text-white/10 uppercase tracking-widest font-bold">
                            Odancia
                        </p>
                    </motion.div>
                ) : (staffView === 'scan' && !customer && !actionFeedback && !scanError) ? (
                    <motion.div
                        key="scanner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: cameraReady ? 1 : 0.01 }} // Use 0.01 instead of 0 to avoid "unmounted" feel
                        exit={{ opacity: 0 }}
                        className="scan-view-container w-full flex-1 flex flex-col justify-center"
                    >
                        <p className="staff-header-label">✦ SCANNING: {activeAction === 'add' ? 'VISIT' : 'REWARD'}</p>
                        <div className="scanner-frame-wrapper">
                            <div className="scan-line"></div>
                            <div id="reader" className="overflow-hidden"></div>
                        </div>
                        <button onClick={() => setStaffView('home')} className="mt-8 text-white/30 text-xs font-bold uppercase tracking-widest">Cancel Scan</button>
                    </motion.div>
                ) : scanError ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center px-6"
                    >
                        <div className="w-24 h-24 bg-red-500/10 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-red-500 mb-8 leading-tight">{scanError}</h1>
                        <button
                            onClick={() => {
                                setScanError('');
                                setCustomer(null);
                            }}
                            className="staff-button primary"
                        >
                            Try Again
                        </button>
                    </motion.div>
                ) : actionFeedback ? (
                    <motion.div
                        key="feedback"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        <div className="w-40 h-40 bg-white/5 border border-[#9d50ff] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(157,80,255,0.4)]">
                            <span className="text-6xl">✨</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tight">{actionFeedback}</h1>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detected"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="member-detected-card"
                    >
                        <p className="staff-header-label">✦ MEMBER DETECTED</p>

                        <div className="mb-12">
                            <h1 className="detected-name">{customer.name}</h1>
                            <p className="detected-vip-tag">✦ VIP MEMBER</p>
                        </div>

                        <div className="detected-divider mb-8"></div>

                        <p className="detected-status-text mb-12">
                            {business === 'laundry'
                                ? `Laundry Credit: R${currentBalance}`
                                : `${business === 'coffee' ? 'Coffee' : 'Salon'} Progress: ${currentBalance} / ${target}`
                            }
                        </p>

                        <div className="space-y-6 w-full max-w-[320px] mx-auto">
                            <button
                                disabled={loading}
                                onClick={() => handleUpdate(activeAction || 'add')}
                                className="staff-button primary"
                            >
                                {activeAction === 'add' ? 'Confirm Visit' : 'Confirm Reward'}
                            </button>
                            <button
                                disabled={loading}
                                onClick={() => { setCustomer(null); setStaffView('home'); }}
                                className="staff-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                /* Hide technical library UI */
                #reader__dashboard, #reader__camera_selection, #reader__status_span, #reader button, #reader img, .html5-qrcode-element { display: none !important; }
                #reader__scan_region, #reader { border: none !important; }
                #reader video { border-radius: 40px !important; object-fit: cover !important; }
            `}</style>
        </div>
    );
};

export default StaffScanner;

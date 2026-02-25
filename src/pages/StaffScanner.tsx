import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
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
    const scannerRef = useRef<Html5Qrcode | null>(null);

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
        if (business) {
            localStorage.setItem('vip_role', 'staff');
            localStorage.setItem('vip_staff_business', business);
        }
    }, [business]);

    const stopExistingScanner = async () => {
        if (scannerRef.current) {
            console.log("RELEASING CAMERA...");
            try {
                const s = scannerRef.current as any;
                if (typeof s.stop === 'function') {
                    try { await s.stop(); } catch (e) { }
                } else if (typeof s.clear === 'function') {
                    try { await s.clear(); } catch (e) { }
                }
            } catch (err) { }

            const reader = document.getElementById('reader');
            const video = reader?.querySelector('video');
            if (video && video.srcObject instanceof MediaStream) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            if (reader) reader.innerHTML = '';
            scannerRef.current = null;
        }
    };

    const startScanner = async (retries = 0) => {
        const readerDiv = document.getElementById('reader');
        if (!readerDiv) {
            if (retries < 10) { // Increased retries
                setTimeout(() => startScanner(retries + 1), 250);
            } else {
                setScanError("Scanner container not found. Refresh page.");
            }
            return;
        }

        await stopExistingScanner();

        console.log("STARTING SCANNER...");
        try {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: { ideal: "environment" } },
                { fps: 20, qrbox: { width: 300, height: 300 }, aspectRatio: 1.0 },
                (decodedText) => {
                    let memberId = null;
                    if (decodedText.startsWith('odancia:member:')) {
                        memberId = decodedText.split('odancia:member:')[1];
                    } else {
                        const urlMatch = decodedText.match(/\/card\/([^?#/]+)/) || decodedText.match(/\/scan\/([^?#/]+)/);
                        memberId = urlMatch ? urlMatch[1] : (decodedText.startsWith('vip_') ? decodedText : null);
                    }

                    if (memberId) {
                        handleFetchCustomer(memberId);
                    } else if (decodedText.includes('/vip') || decodedText.includes('/join')) {
                        setScanError('This QR is for joining only. Scan Member QR.');
                    } else {
                        setScanError('Invalid member code.');
                    }
                },
                () => { if (!cameraReady) setCameraReady(true); }
            );
        } catch (e) {
            console.error(e);
            setScanError("Camera access failed. Check permissions.");
        }
        setTimeout(() => setCameraReady(true), 3000);
    };

    useEffect(() => {
        if (staffView === 'scan' && !customer && !actionFeedback && !scanError) {
            startScanner();
        }
        return () => { stopExistingScanner(); };
    }, [staffView, customer, actionFeedback, scanError]);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        await stopExistingScanner();
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
            setScanError('');
        } catch (error) {
            setScanError("Member not found.");
            setTimeout(() => { setScanError(''); setCustomer(null); }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: 'add' | 'redeem') => {
        if (!customer || loading) return;
        const currentBalance = customer?.balances?.[business || ''] || 0;
        const target = business === 'salon' ? 5 : 8;

        if (type === 'redeem' && currentBalance < target && business !== 'laundry') {
            alert("Reward requirement not reached.");
            return;
        }

        setLoading(true);
        try {
            const amount = type === 'add' ? (business === 'laundry' ? 20 : 1) : 0;
            const res = await axios.post(`${API_BASE}/api/update-points`, {
                userId: customer.id, business, amount, type
            });
            setCustomer(res.data);
            setActionFeedback(type === 'add' ? 'Visit Added' : 'Reward Redeemed');
            setTimeout(async () => {
                setActionFeedback('');
                setCustomer(null);
                setScanError('');
                setCameraReady(false);
                await stopExistingScanner();
                fetchStats();
            }, 2000);
        } catch (error) {
            alert("Error updating points.");
            setLoading(false);
        }
    };

    const currentBalance = customer?.balances?.[business || ''] || 0;
    const target = business === 'salon' ? 5 : 8;

    // RENDER LOGIC
    let content;
    if (staffView === 'home') {
        content = (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <p className="member-label">STATION</p>
                    <h1 className="customer-name" style={{ fontSize: '32px' }}>Scan Station</h1>
                </div>
                <div className="space-y-3 mb-12">
                    <button onClick={() => { setStaffView('scan'); setActiveAction('add'); setScanError(''); setCustomer(null); }} className="staff-button primary" style={{ height: '52px' }}>Add Visit</button>
                    <button onClick={() => { setStaffView('scan'); setActiveAction('redeem'); setScanError(''); setCustomer(null); }} className="staff-button" style={{ height: '52px' }}>Redeem Reward</button>
                </div>
                <div className="space-y-2">
                    <p className="stat-label text-center mb-2">Today Activity</p>
                    <div className="stat-card"><p className="stat-label">Total Members</p><p className="stat-value">{stats.totalMembers}</p></div>
                    <div className="stat-card"><p className="stat-label">Visits This Week</p><p className="stat-value text-[#d1b8ff]">{stats.visitsThisWeek}</p></div>
                    <div className="stat-card"><p className="stat-label">Rewards Redeemed</p><p className="stat-value text-[#9d50ff]">{stats.rewardsRedeemed}</p></div>
                </div>
                <p className="scan-station-branding">Odancia</p>
            </motion.div>
        );
    } else if (actionFeedback) {
        content = (
            <motion.div key="feedback" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="w-40 h-40 bg-white/5 border border-[#9d50ff] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(157,80,255,0.4)]">
                    <span className="text-6xl">OK</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight">{actionFeedback}</h1>
            </motion.div>
        );
    } else if (scanError) {
        content = (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-6">
                <div className="w-24 h-24 bg-red-500/10 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="text-4xl text-red-500">!</span>
                </div>
                <h1 className="text-xl font-bold text-red-500 mb-8">{scanError}</h1>
                <button onClick={() => { setScanError(''); setCustomer(null); if (activeAction) startScanner(); }} className="staff-button primary">Try Again</button>
                <button onClick={() => setStaffView('home')} className="mt-4 text-white/40 text-xs font-bold uppercase tracking-widest">Back to Home</button>
            </motion.div>
        );
    } else if (customer) {
        content = (
            <motion.div key="detected" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="member-detected-card">
                <p className="staff-header-label">MEMBER DETECTED</p>
                <div className="mb-12">
                    <h1 className="detected-name">{customer.name}</h1>
                    <p className="detected-vip-tag">VIP MEMBER</p>
                </div>
                <div className="detected-divider mb-8"></div>
                <p className="detected-status-text mb-12">
                    {business === 'laundry' ? `Laundry Credit: R${currentBalance}` : `${business === 'coffee' ? 'Coffee' : 'Salon'} Progress: ${currentBalance} / ${target}`}
                </p>
                <div className="space-y-6 w-full max-w-[320px] mx-auto">
                    <button disabled={loading} onClick={() => handleUpdate(activeAction || 'add')} className="staff-button primary">
                        {activeAction === 'add' ? 'Confirm Visit' : 'Confirm Reward'}
                    </button>
                    <button disabled={loading} onClick={async () => { await stopExistingScanner(); setCustomer(null); setStaffView('home'); }} className="staff-button">Cancel</button>
                </div>
            </motion.div>
        );
    } else {
        // SCANNER VIEW (Fallback)
        content = (
            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="scan-view-container w-full flex-1 flex flex-col justify-center items-center">
                <p className="staff-header-label">SCANNING: {activeAction === 'add' ? 'VISIT' : 'REWARD'}</p>
                <div className="scanner-frame-wrapper">
                    {!cameraReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-md rounded-[40px]">
                            <p className="text-[10px] font-black tracking-[0.3em] text-white/40 mb-4">Initializing...</p>
                        </div>
                    )}
                    <div className="scan-line"></div>
                    <div id="reader" className="overflow-hidden w-full h-full"></div>
                </div>
                <button
                    onClick={async () => { await stopExistingScanner(); setStaffView('home'); }}
                    className="exit-scan-button"
                >
                    Exit Scan
                </button>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#050408] relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="glow-bg"></div>
            <AnimatePresence mode="wait">
                {content}
            </AnimatePresence>
            <style>{`
                #reader__dashboard, #reader__camera_selection, #reader__status_span, #reader button, #reader img, .html5-qrcode-element { display: none !important; }
                #reader__scan_region, #reader { border: none !important; }
                #reader video { border-radius: 40px !important; object-fit: cover !important; width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
};

export default StaffScanner;

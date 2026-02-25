import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

type StaffViewState = 'home' | 'scan';

const StaffScanner: React.FC = () => {
    const { business } = useParams<{ business: string }>();

    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');
    const [scanError, setScanError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [staffView, setStaffView] = useState<StaffViewState>('home');
    const [stats, setStats] = useState({ totalMembers: 0, visitsThisWeek: 0, rewardsRedeemed: 0 });
    const [activeAction, setActiveAction] = useState<'add' | 'redeem'>('add');

    // Refs so scanner callbacks never see stale closures
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const cameraReadyRef = useRef(false);           // mirrors cameraReady state for use inside callbacks
    const activeActionRef = useRef<'add' | 'redeem'>('add');
    const businessRef = useRef(business);
    const handleFetchCustomerRef = useRef<(id: string) => void>(() => { });

    // Keep refs in sync with latest state / values
    useEffect(() => { activeActionRef.current = activeAction; }, [activeAction]);
    useEffect(() => { businessRef.current = business; }, [business]);

    const API_BASE_VALUE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;
    const apiBaseRef = useRef(API_BASE_VALUE);
    const API_BASE = apiBaseRef.current;

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/admin/stats/${business}`);
            setStats(res.data);
        } catch (e) {
            console.error('Stats fetch failed', e);
        }
    };

    useEffect(() => {
        fetchStats();
        if (business) {
            localStorage.setItem('vip_role', 'staff');
            localStorage.setItem('vip_staff_business', business);
        }
    }, [business]);

    // ── Camera lifecycle ──────────────────────────────────────────────────────

    const stopCamera = useCallback(async () => {
        if (!scannerRef.current) return;
        isScanningRef.current = false;

        const scanner = scannerRef.current;
        scannerRef.current = null;

        try {
            // Html5Qrcode.stop() returns a promise
            if ((scanner as any).isScanning) {
                await scanner.stop();
            }
            await scanner.clear();
        } catch (_) { /* Ignore stop errors */ }

        // Belt-and-suspenders: kill any live media tracks directly
        const reader = document.getElementById('reader');
        if (reader) {
            const video = reader.querySelector('video');
            if (video && video.srcObject instanceof MediaStream) {
                video.srcObject.getTracks().forEach(t => t.stop());
                video.srcObject = null;
            }
            reader.innerHTML = '';
        }
    }, []);

    const startCamera = useCallback(async () => {
        // Prevent double-start
        if (isScanningRef.current) return;

        // Wait for the #reader DOM node (it exists inside the scanner view branch)
        let readerDiv = document.getElementById('reader');
        let attempts = 0;
        while (!readerDiv && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            readerDiv = document.getElementById('reader');
            attempts++;
        }

        if (!readerDiv) {
            setScanError('Scanner element missing. Refresh the page.');
            return;
        }

        // Ensure #reader is empty before mounting
        readerDiv.innerHTML = '';
        await new Promise(r => setTimeout(r, 80)); // micro-pause for DOM repaint

        isScanningRef.current = true;
        cameraReadyRef.current = false;
        setCameraReady(false);

        try {
            const scanner = new Html5Qrcode('reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: { ideal: 'environment' } },
                { fps: 20, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
                (decodedText) => {
                    if (!isScanningRef.current) return; // ignore if already stopped

                    let memberId: string | null = null;

                    if (decodedText.startsWith('odancia:member:')) {
                        memberId = decodedText.split('odancia:member:')[1];
                    } else {
                        const urlMatch =
                            decodedText.match(/\/card\/([^?#/]+)/) ||
                            decodedText.match(/\/scan\/([^?#/]+)/);
                        memberId = urlMatch
                            ? urlMatch[1]
                            : decodedText.startsWith('vip_') ? decodedText : null;
                    }

                    if (memberId) {
                        // Use the ref so we always call the latest version, never a stale closure
                        handleFetchCustomerRef.current(memberId);
                    } else if (decodedText.includes('/vip') || decodedText.includes('/join')) {
                        setScanError('This QR is for joining only. Scan the Member QR.');
                    } else {
                        setScanError('Invalid member code.');
                    }
                },
                () => {
                    // Per-frame callback — fires on every decoded frame (including failures)
                    // Use ref instead of state to avoid stale closure
                    if (!cameraReadyRef.current) {
                        cameraReadyRef.current = true;
                        setCameraReady(true);
                    }
                }
            );

            // Fallback: mark ready after 2.5 s regardless
            setTimeout(() => setCameraReady(true), 2500);
        } catch (e: any) {
            console.error('Camera start error:', e);
            isScanningRef.current = false;
            scannerRef.current = null;

            if (String(e).includes('Permission')) {
                setScanError('Camera permission denied. Allow camera access and try again.');
            } else {
                setScanError('Camera failed to start. Check permissions.');
            }
        }
    }, []); // no reactive deps — uses refs

    // ── Scanner lifecycle tied only to staffView ──────────────────────────────

    useEffect(() => {
        if (staffView === 'scan') {
            // Slight delay so AnimatePresence can mount the scan view
            const t = setTimeout(() => startCamera(), 150);
            return () => {
                clearTimeout(t);
                stopCamera();
            };
        } else {
            stopCamera();
        }
    }, [staffView]); // ← ONLY staffView — no customer/scanError deps

    // Cleanup on unmount
    useEffect(() => () => { stopCamera(); }, []);

    // ── API actions ───────────────────────────────────────────────────────────

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        await stopCamera(); // stop scanning once we have an ID
        try {
            const response = await axios.get(`${apiBaseRef.current}/api/users/${id}`);
            setCustomer(response.data);
            setScanError('');
        } catch {
            setScanError('Member not found.');
        } finally {
            setLoading(false);
        }
    };
    // Keep the ref pointing to the latest version on every render
    handleFetchCustomerRef.current = handleFetchCustomer;

    const handleUpdate = async (type: 'add' | 'redeem') => {
        if (!customer || loading) return;
        const biz = businessRef.current || '';
        const currentBalance = customer?.balances?.[biz] || 0;
        const target = biz === 'salon' ? 5 : 8;

        if (type === 'redeem' && currentBalance < target && biz !== 'laundry') {
            alert('Reward requirement not reached.');
            return;
        }

        setLoading(true);
        try {
            const amount = type === 'add' ? (biz === 'laundry' ? 20 : 1) : 0;
            const res = await axios.post(`${API_BASE}/api/update-points`, {
                userId: customer.id, business: biz, amount, type
            });
            setCustomer(res.data);
            setActionFeedback(type === 'add' ? 'Visit Added ✓' : 'Reward Redeemed ✓');

            setTimeout(async () => {
                setActionFeedback('');
                setCustomer(null);
                setScanError('');
                setCameraReady(false);
                fetchStats();
                // Camera restarts automatically because staffView stays 'scan'
                await startCamera();
            }, 2000);
        } catch {
            alert('Error updating points.');
            setLoading(false);
        }
    };

    const goHome = async () => {
        await stopCamera();
        setCustomer(null);
        setScanError('');
        setCameraReady(false);
        setStaffView('home');
    };

    const goScan = (action: 'add' | 'redeem') => {
        setActiveAction(action);
        activeActionRef.current = action;
        setCustomer(null);
        setScanError('');
        setCameraReady(false);
        setStaffView('scan');
    };

    const retryScanner = async () => {
        setScanError('');
        setCustomer(null);
        setCameraReady(false);
        await stopCamera();
        // startCamera will be called again once state settles
        setTimeout(() => startCamera(), 200);
    };

    // ── Derived values ────────────────────────────────────────────────────────

    const biz = business || '';
    const currentBalance = customer?.balances?.[biz] || 0;
    const target = biz === 'salon' ? 5 : 8;

    // ── Render branches ───────────────────────────────────────────────────────

    const renderHome = () => (
        <motion.div
            key="home"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
        >
            <div className="text-center mb-10">
                <p className="member-label">STATION</p>
                <h1 className="customer-name" style={{ fontSize: '32px' }}>Scan Station</h1>
            </div>
            <div className="space-y-3 mb-12">
                <button
                    onClick={() => goScan('add')}
                    className="staff-button primary"
                    style={{ height: '52px' }}
                >
                    Add Visit
                </button>
                <button
                    onClick={() => goScan('redeem')}
                    className="staff-button"
                    style={{ height: '52px' }}
                >
                    Redeem Reward
                </button>
            </div>
            <div className="space-y-2">
                <p className="stat-label text-center mb-2">Today Activity</p>
                <div className="stat-card"><p className="stat-label">Total Members</p><p className="stat-value">{stats.totalMembers}</p></div>
                <div className="stat-card"><p className="stat-label">Visits This Week</p><p className="stat-value" style={{ color: '#d1b8ff' }}>{stats.visitsThisWeek}</p></div>
                <div className="stat-card"><p className="stat-label">Rewards Redeemed</p><p className="stat-value" style={{ color: '#9d50ff' }}>{stats.rewardsRedeemed}</p></div>
            </div>
            <p className="scan-station-branding">Odancia</p>
        </motion.div>
    );

    // The scanner view is always present in the DOM when staffView === 'scan'
    // so the #reader element persists across state changes (customer/error overlays).
    const renderScanner = () => (
        <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="scan-view-container w-full"
        >
            <p className="staff-header-label">
                SCANNING: {activeAction === 'add' ? 'VISIT' : 'REWARD'}
            </p>

            {/* Camera frame — always mounted so #reader is always in DOM */}
            <div className="scanner-frame-wrapper">
                {!cameraReady && (
                    <div className="camera-init-overlay">
                        <div className="camera-spinner" />
                        <p className="camera-init-text">Initializing Camera…</p>
                    </div>
                )}
                <div className="scan-line" />
                <div id="reader" className="overflow-hidden w-full h-full" />
            </div>

            {/* Overlays rendered OVER the camera, not replacing it */}
            <AnimatePresence>
                {actionFeedback && (
                    <motion.div
                        key="overlay-feedback"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="scan-overlay"
                    >
                        <div className="feedback-circle"><span className="feedback-check">✓</span></div>
                        <h2 className="feedback-title">{actionFeedback}</h2>
                    </motion.div>
                )}
                {scanError && !actionFeedback && (
                    <motion.div
                        key="overlay-error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="scan-overlay"
                    >
                        <div className="error-circle"><span className="error-icon">!</span></div>
                        <p className="error-title" style={{ fontSize: '16px' }}>{scanError}</p>
                        <button onClick={retryScanner} className="staff-button primary" style={{ maxWidth: '240px' }}>
                            Try Again
                        </button>
                    </motion.div>
                )}
                {customer && !actionFeedback && !scanError && (
                    <motion.div
                        key="overlay-customer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="scan-overlay"
                    >
                        <p className="staff-header-label" style={{ marginBottom: '8px' }}>MEMBER DETECTED</p>
                        <h2 className="detected-name" style={{ fontSize: '36px', marginBottom: '4px' }}>{customer.name}</h2>
                        <p className="detected-vip-tag">VIP MEMBER</p>
                        <div className="detected-divider" style={{ margin: '20px 0' }} />
                        <p className="detected-status-text" style={{ marginBottom: '24px' }}>
                            {biz === 'laundry'
                                ? `Laundry Credit: R${currentBalance}`
                                : `${biz === 'coffee' ? 'Coffee' : 'Salon'} Progress: ${currentBalance} / ${target}`}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
                            <button disabled={loading} onClick={() => handleUpdate(activeAction)} className="staff-button primary" style={{ height: '52px' }}>
                                {loading ? 'Processing…' : activeAction === 'add' ? 'Confirm Visit' : 'Confirm Reward'}
                            </button>
                            <button disabled={loading} onClick={goHome} className="staff-button" style={{ height: '48px' }}>
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button onClick={goHome} className="exit-scan-button">
                Exit Scan
            </button>
        </motion.div>
    );

    return (
        <div className="staff-root">
            <div className="glow-bg" />
            <AnimatePresence mode="wait">
                {staffView === 'home'
                    ? renderHome()
                    : renderScanner()
                }
            </AnimatePresence>

            <style>{`
                /* ── html5-qrcode UI strip ── */
                #reader__dashboard,
                #reader__camera_selection,
                #reader__status_span,
                #reader button,
                #reader img,
                #reader select,
                #reader__header_message,
                .html5-qrcode-element { display: none !important; }

                #reader__scan_region, #reader {
                    border: none !important;
                    background: transparent !important;
                }

                #reader video {
                    border-radius: 36px !important;
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                }

                /* ── Layout ── */
                .staff-root {
                    min-height: 100svh;
                    width: 100%;
                    background: #050408;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 20px;
                    position: relative;
                    overflow: hidden;
                }

                .scan-view-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 28px;
                    position: relative;
                    max-width: 400px;
                    width: 100%;
                }

                /* ── Scanner frame ── */
                .scanner-frame-wrapper {
                    position: relative;
                    width: 300px;
                    height: 300px;
                    border-radius: 40px;
                    overflow: hidden;
                    background: #000;
                    border: 2px solid rgba(157, 80, 255, 0.35);
                    box-shadow:
                        0 0 60px rgba(157, 80, 255, 0.15),
                        inset 0 0 30px rgba(0,0,0,0.6);
                    flex-shrink: 0;
                }

                .scanner-frame-wrapper::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 40px;
                    border: 3px solid rgba(157, 80, 255, 0.5);
                    pointer-events: none;
                    z-index: 12;
                }

                /* ── Scan line ── */
                .scan-line {
                    position: absolute;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #9d50ff, transparent);
                    box-shadow: 0 0 12px #9d50ff;
                    z-index: 11;
                    animation: scanMove 2.5s infinite ease-in-out;
                    top: 0;
                }

                @keyframes scanMove {
                    0%,100% { top: 4%; opacity: 0.5; }
                    50%      { top: 92%; opacity: 1;   }
                }

                /* ── Camera initialising overlay ── */
                .camera-init-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 15;
                    background: rgba(5,4,8,0.85);
                    backdrop-filter: blur(8px);
                    border-radius: 38px;
                    gap: 16px;
                }

                .camera-init-text {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.3em;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                }

                .camera-spinner {
                    width: 32px;
                    height: 32px;
                    border: 2px solid rgba(157, 80, 255, 0.2);
                    border-top-color: #9d50ff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                /* ── Scan overlay (customer / error / feedback) ── */
                .scan-overlay {
                    position: absolute;
                    inset: 0;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 300px;
                    height: 300px;
                    border-radius: 40px;
                    background: rgba(5, 4, 8, 0.93);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 20;
                    padding: 24px;
                    text-align: center;
                }

                /* ── Staff header label ── */
                .staff-header-label {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.4em;
                    color: rgba(209,184,255,0.6);
                    text-transform: uppercase;
                }

                /* ── Member detected card (used as overlay) ── */
                .member-detected-card {
                    width: 100%;
                    max-width: 360px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 32px 24px;
                }

                .detected-vip-tag {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.4em;
                    color: rgba(157, 80, 255, 0.8);
                    text-transform: uppercase;
                    margin-top: 6px;
                }

                .detected-divider {
                    width: 100%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(157,80,255,0.4), transparent);
                }

                .detected-status-text {
                    font-size: 15px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.7);
                }

                /* ── Feedback ── */
                .feedback-circle {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border: 2px solid rgba(157,80,255,0.6);
                    background: rgba(157,80,255,0.08);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    box-shadow: 0 0 40px rgba(157,80,255,0.3);
                }

                .feedback-check {
                    font-size: 40px;
                    color: #9d50ff;
                }

                .feedback-title {
                    font-size: 28px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    background: linear-gradient(180deg, #fff, #d1b8ff);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                /* ── Error ── */
                .error-circle {
                    width: 80px;
                    height: 80px;
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.4);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }

                .error-icon {
                    font-size: 32px;
                    color: #ef4444;
                    font-weight: 900;
                }

                .error-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ef4444;
                    margin-bottom: 24px;
                }

                .back-link {
                    margin-top: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.3);
                    background: none;
                    border: none;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default StaffScanner;

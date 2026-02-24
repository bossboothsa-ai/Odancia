import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Plus, Gift, Coffee, Shirt, Scissors } from 'lucide-react';

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
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
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
    }, []);

    const handleFetchCustomer = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/users/${id}`);
            setCustomer(response.data);
        } catch (error) {
            alert("Invalid QR Code or Member not found.");
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
            setSuccessMsg(type === 'add' ? 'Points Added!' : 'Reward Redeemed!');
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
        <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center">
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white font-bold">Scanning...</h2>
                    <button onClick={() => navigate(`/staff/dashboard/${business}`)} className="p-2 glass rounded-full">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {!customer && (
                    <div className="rounded-3xl overflow-hidden glass border-white/10">
                        <div id="reader"></div>
                    </div>
                )}

                <AnimatePresence>
                    {customer && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4"
                        >
                            <div className="premium-card mb-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-[#d4af37] rounded-2xl flex items-center justify-center font-black text-2xl text-black">
                                        {customer.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                                        <p className="text-[#a0a0a0] text-sm">VIP Member</p>
                                    </div>
                                </div>

                                <div className="bg-black/40 p-6 rounded-2xl mb-6">
                                    <p className="text-xs text-[#444] uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black text-white">
                                            {business === 'laundry' ? `R${currentBalance}` : `${currentBalance} / ${target}`}
                                        </span>
                                        <span className="text-[#d4af37] mb-2">
                                            {business === 'coffee' ? <Coffee size={24} /> : business === 'salon' ? <Scissors size={24} /> : <Shirt size={24} />}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        disabled={loading}
                                        onClick={() => handleUpdate('add')}
                                        className="btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        <span>Add {business === 'laundry' ? 'Credit' : 'Visit'}</span>
                                    </button>

                                    <button
                                        disabled={loading || !isEligible}
                                        onClick={() => handleUpdate('redeem')}
                                        className={`p-6 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 ${isEligible ? 'bg-white text-black' : 'bg-white/5 text-white/20'
                                            }`}
                                    >
                                        <Gift size={20} />
                                        <span>Redeem Reward</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setCustomer(null)}
                                className="w-full py-4 glass text-[#a0a0a0] font-bold rounded-2xl"
                            >
                                Scan Another Member
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {successMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#4caf50] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50"
                        >
                            <CheckCircle size={24} />
                            <span className="font-bold uppercase tracking-widest">{successMsg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StaffScanner;

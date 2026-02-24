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
            {/* Same UI structure as before... */}
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white font-bold">Scanning...</h2>
                    <button onClick={() => navigate(`/staff/dashboard/${business}`)} className="p-2 glass rounded-full">
                        <X size={20} className="text-white" />
                    </button>
                </div>
                {!customer && <div className="rounded-3xl overflow-hidden glass border-white/10"><div id="reader"></div></div>}

                {/* Simplified conditional content for space */}
                {customer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                        <div className="premium-card">
                            <h3 className="text-xl font-bold text-white mb-4">{customer.name}</h3>
                            <div className="bg-black/40 p-6 rounded-2xl mb-6">
                                <p className="text-4xl font-black text-white">
                                    {business === 'laundry' ? `R${currentBalance}` : `${currentBalance} / ${target}`}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button disabled={loading} onClick={() => handleUpdate('add')} className="btn-primary">Add Points</button>
                                <button disabled={loading || !isEligible} onClick={() => handleUpdate('redeem')} className="btn-primary bg-white text-black">Redeem</button>
                            </div>
                        </div>
                        <button onClick={() => setCustomer(null)} className="w-full py-4 mt-4 glass text-[#a0a0a0]">Scan Another</button>
                    </motion.div>
                )}
            </div>

            {successMsg && <div className="fixed bottom-10 bg-green-500 text-white px-8 py-4 rounded-full">{successMsg}</div>}
        </div>
    );
};

export default StaffScanner;

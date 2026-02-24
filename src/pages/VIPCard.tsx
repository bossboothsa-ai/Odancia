import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Coffee, Shirt, Scissors, RefreshCw, Share, Smartphone } from 'lucide-react';

const VIPCard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserData();
        const interval = setInterval(fetchUserData, 10000);
        return () => clearInterval(interval);
    }, [id]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchUserData();
    };

    const handleAddToHome = () => {
        alert("To add to Home Screen:\n1. Tap the Share button\n2. Select 'Add to Home Screen'");
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading your VIP status...</div>;
    if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Member not found.</div>;

    return (
        <div className="min-h-screen bg-[#050505] p-6 pb-24 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-[#d4af37] text-xs uppercase tracking-[0.2em] font-semibold">Elite Membership</h2>
                        <h1 className="text-2xl font-bold text-white uppercase">{user.name}</h1>
                    </div>
                    <button onClick={handleRefresh} className={`p-2 rounded-full glass ${refreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw className="text-[#d4af37] w-5 h-5" />
                    </button>
                </div>

                <div className="premium-card mb-8 flex flex-col items-center py-10">
                    <div className="bg-white p-4 rounded-3xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <QRCodeSVG value={user.id} size={200} level="H" />
                    </div>
                    <p className="text-sm text-[#a0a0a0] mb-2">Member ID</p>
                    <code className="text-[#d4af37] font-mono text-lg tracking-widest">{user.id.toUpperCase()}</code>
                </div>

                <div className="w-full space-y-4 mb-10">
                    <h3 className="text-xs text-[#444] uppercase tracking-widest mb-4">Current Rewards</h3>

                    {/* Coffee Shop */}
                    <div className="glass p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#d4af37]">
                                <Coffee size={20} />
                            </div>
                            <div>
                                <p className="font-semibold">Coffee Shop</p>
                                <p className="text-sm text-[#a0a0a0]">{user.balances.coffee} / 8 visits</p>
                            </div>
                        </div>
                        <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-[#d4af37]" style={{ width: `${Math.min((user.balances.coffee / 8) * 100, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Laundry */}
                    <div className="glass p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-blue-400">
                                <Shirt size={20} />
                            </div>
                            <div>
                                <p className="font-semibold">Laundry Credit</p>
                                <p className="text-sm text-[#a0a0a0]">R{user.balances.laundry} Available</p>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-blue-400">R{user.balances.laundry}</div>
                    </div>

                    {/* Salon */}
                    <div className="glass p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-purple-400">
                                <Scissors size={20} />
                            </div>
                            <div>
                                <p className="font-semibold">VIP Salon</p>
                                <p className="text-sm text-[#a0a0a0]">{user.balances.salon} / 5 visits</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i <= user.balances.salon ? 'bg-purple-400' : 'bg-[#222]'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleAddToHome}
                        className="glass flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium"
                    >
                        <Smartphone size={18} />
                        Add to Home
                    </button>
                    <button
                        className="glass flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: 'My VIP Card', url: window.location.href });
                            } else {
                                alert('Copy this URL to save your card: ' + window.location.href);
                            }
                        }}
                    >
                        <Share size={18} />
                        Share Card
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VIPCard;

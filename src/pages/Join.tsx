import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Phone, Crown } from 'lucide-react';

const Join: React.FC = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Use absolute URL in dev, relative in production
    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/api/register`, { name, phone });
            const user = response.data;
            // Store in localStorage for "stay logged in" feel
            localStorage.setItem('vip_user', JSON.stringify(user));
            // SMS Simulation
            alert(`[SMS SIMULATION]\nWelcome to VIP Rewards!\nAccess your digital card here: ${window.location.origin}/card/${user.id}`);
            navigate(`/card/${user.id}`);
        } catch (error) {
            console.error('Registration failed', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#d4af37] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                        <Crown className="text-black w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join the Elite</h1>
                    <p className="text-[#a0a0a0]">Become a VIP Member in 10 seconds</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a0a0a0] w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="pl-12"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a0a0a0] w-5 h-5" />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                className="pl-12"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Processing...' : 'Get My VIP Card'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-[#444]">
                    Premium QR Loyalty System &copy; 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Join;

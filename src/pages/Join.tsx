import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const Join: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        dob: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_BASE = import.meta.env.DEV
        ? `http://${window.location.hostname}:3002`
        : window.location.origin;

    // MEMBER PERSISTENCE: Check if already a member on mount
    useEffect(() => {
        const savedMemberId = localStorage.getItem('vip_member_id');
        if (savedMemberId) {
            navigate(`/card/${savedMemberId}`, { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.dob) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/api/register`, formData);
            const user = response.data;

            // SAVE MEMBER ID LOCALLY
            localStorage.setItem('vip_member_id', user.id);

            navigate(`/card/${user.id}`);
        } catch (error) {
            alert('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#050408] relative overflow-hidden">
            <div className="glow-bg"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm text-center z-10"
            >
                <div className="mb-12">
                    <p className="member-label">✦ ELITE MEMBERSHIP</p>
                    <h1 className="customer-name" style={{ fontSize: '36px' }}>JOIN THE CLUB</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-lavender transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-lavender transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                    <div className="text-left px-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1 mb-2 block">Your Birthday 🎂</label>
                        <input
                            type="date"
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-lavender transition-all"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="staff-button primary mt-6"
                    >
                        {loading ? 'Verifying...' : 'GET MY VIP CARD'}
                    </button>
                </form>

                <p className="mt-12 text-[10px] text-white/10 uppercase tracking-widest font-bold">
                    Odancia Elite System &copy; 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Join;

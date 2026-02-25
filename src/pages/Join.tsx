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

    // Redirection handled by App.tsx globally
    useEffect(() => { }, []);

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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="onboarding-container"
            >
                <div className="text-center mb-12">
                    <p className="member-label">✦ ELITE MEMBERSHIP</p>
                    <h1 className="onboarding-title">Join the club</h1>
                    <div className="w-12 h-[1px] bg-white/10 mx-auto"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="onboarding-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            className="onboarding-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        <div className="pt-2">
                            <p className="input-label pl-1">Your Birthday 🎂</p>
                            <input
                                type="date"
                                className="onboarding-input"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="staff-button primary"
                        >
                            {loading ? 'Verifying...' : 'Create VIP Card'}
                        </button>
                    </div>
                </form>

                <div className="mt-16 text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-bold">
                        Odancia
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Join;

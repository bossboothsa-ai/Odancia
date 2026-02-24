import React, { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.dob) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/api/register`, formData);
            const user = response.data;
            localStorage.setItem('vip_user', JSON.stringify(user));
            navigate(`/card/${user.id}`);
        } catch (error) {
            alert('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm text-center"
            >
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">✦ JOIN THE CLUB</h1>
                    <p className="text-gray-500 font-medium uppercase tracking-[0.2em] text-xs">Be part of the elite</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email (Optional)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div className="text-left px-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1 mb-2 block">Your Birthday 🎂</label>
                        <input
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-main mt-6"
                    >
                        {loading ? 'Entering...' : 'GET MY VIP CARD'}
                    </button>
                </form>

                <p className="mt-12 text-[10px] text-gray-700 uppercase tracking-widest font-bold">
                    Odancia Elite Membership System &copy; 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Join;

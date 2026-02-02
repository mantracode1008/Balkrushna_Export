import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { User, AlertTriangle, Diamond, Sparkles, KeyRound, ChevronRight } from 'lucide-react';

// Precision Grid Background
const PrecisionGrid = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Horizontal Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4rem]" />
            {/* Vertical Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_100%]" />

            {/* Radial Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80" />

            {/* Light Refraction / Shimmer */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen"
            />
            <motion.div
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, 50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen"
            />
        </div>
    );
};

// 3D Floating Diamond Shapes
const FloatingDiamonds = () => {
    const diamonds = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        size: Math.random() * 30 + 10,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.15 + 0.05,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {diamonds.map((d) => (
                <motion.div
                    key={d.id}
                    className="absolute text-blue-300"
                    style={{
                        left: `${d.left}%`,
                        top: `${d.top}%`,
                        opacity: d.opacity,
                    }}
                    animate={{
                        y: [0, -40, 0],
                        rotate: [0, 180, 360],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: d.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: d.delay,
                    }}
                >
                    <Diamond size={d.size} strokeWidth={1} />
                </motion.div>
            ))}
        </div>
    );
};

// Twinkling Sparkles Effect
const DiamondSparkles = () => {
    const sparkles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 2 + 1,
        scale: Math.random() * 0.5 + 0.5,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {sparkles.map((s) => (
                <motion.div
                    key={s.id}
                    className="absolute text-white"
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0, s.scale, 0],
                        rotate: [0, 45, 90],
                    }}
                    transition={{
                        duration: s.duration,
                        repeat: Infinity,
                        delay: s.delay,
                        ease: "easeInOut",
                    }}
                >
                    <Sparkles size={12 * s.scale} fill="currentColor" />
                </motion.div>
            ))}
        </div>
    );
};

const Login = () => {
    const navigate = useNavigate();
    const [identity, setIdentity] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user && user.accessToken) navigate('/');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Attempt Admin Login first (covers email or username like 'admin12')
            await authService.loginAdmin(identity, secret);
            navigate('/');
        } catch (adminErr) {
            // 2. If Admin not found (404), try Staff Login
            if (adminErr.response && adminErr.response.status === 404) {
                try {
                    await authService.loginStaff(identity, secret);
                    navigate('/');
                } catch (staffErr) {
                    // Staff also failed (or not found)
                    setError(staffErr.response?.data?.message || "Authentication Failed");
                    setSecret('');
                }
            } else {
                // Admin found but wrong password (401) or Server Error
                setError(adminErr.response?.data?.message || "Authentication Failed");
                setSecret('');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative bg-[#020617] text-slate-200 overflow-hidden font-sans flex items-center justify-center">
            <PrecisionGrid />
            <FloatingDiamonds />
            <DiamondSparkles />

            <div className="relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 px-6 lg:px-12 items-center h-full min-h-[600px]">

                {/* Brand Section - Floating Left */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
                >
                    <div className="relative group p-4">
                        {/* Soft Glow behind logo */}
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700" />

                        {/* Logo Container with Sheen */}
                        <div className="relative overflow-hidden rounded-xl">
                            <img
                                src="/logo.png"
                                alt="Balkrushna Exports"
                                className="h-40 lg:h-56 w-auto object-contain filter brightness-0 invert opacity-95 relative z-10 drop-shadow-2xl"
                            />
                            {/* Sheen Animation */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeInOut" }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 max-w-lg relative z-20">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-display drop-shadow-lg">
                            Balkrushna Exports
                        </h1>
                        <div className="h-px w-24 bg-gradient-to-r from-blue-500/50 to-transparent mx-auto lg:mx-0" />
                        <p className="text-blue-100/70 text-lg font-light tracking-wide">
                            Premium Diamond Inventory Management
                        </p>
                    </div>
                </motion.div>

                {/* Login Form - Floating Glass Right */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-[450px] mx-auto lg:ml-auto"
                >
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden group">

                        {/* Form Header */}
                        <div className="mb-8 space-y-2">
                            <h2 className="text-2xl font-semibold text-white tracking-wide">Access Portal</h2>
                            <p className="text-sm text-slate-400">Secure entry for authorized personnel</p>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 overflow-hidden"
                                >
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                                        <AlertTriangle size={16} />
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Identity Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Identity</label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'identity' ? 'text-blue-400' : 'text-slate-600'}`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={identity}
                                        onChange={(e) => setIdentity(e.target.value)}
                                        onFocus={() => setFocusedField('identity')}
                                        onBlur={() => setFocusedField(null)}
                                        autoComplete="off"
                                        className={`block w-full pl-12 pr-4 py-4 bg-slate-900/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300
                                            ${focusedField === 'identity'
                                                ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)] bg-slate-900/60'
                                                : 'border-white/5 hover:border-white/10'
                                            }`}
                                        placeholder="Email or Name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Secret Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Pin / Password</label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focusedField === 'secret' ? 'text-blue-400' : 'text-slate-600'}`}>
                                        <KeyRound className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        onFocus={() => setFocusedField('secret')}
                                        onBlur={() => setFocusedField(null)}
                                        autoComplete="off"
                                        className={`block w-full pl-12 pr-4 py-4 bg-slate-900/40 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300 font-mono tracking-widest
                                            ${focusedField === 'secret'
                                                ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)] bg-slate-900/60'
                                                : 'border-white/5 hover:border-white/10'
                                            }`}
                                        placeholder="Enter Password" // Changed from dots to text
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 group/btn"
                            >
                                {loading ? (
                                    <span className="text-sm tracking-wide">Authenticating...</span>
                                ) : (
                                    <>
                                        <span className="text-sm tracking-wide">Enter System</span>
                                        <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 transform -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                                    </>
                                )}
                            </motion.button>

                        </form>
                    </div>

                    <div className="mt-8 text-center" style={{ zIndex: 30, position: 'relative' }}>
                        <p className="text-slate-500/50 text-[10px] uppercase tracking-widest font-medium">Balkrushna Exports &copy; {new Date().getFullYear()}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;

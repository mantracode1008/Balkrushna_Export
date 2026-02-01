import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, User, Calendar, Search, MoreVertical, AlertCircle, CheckCircle, Smartphone, MapPin, Key } from 'lucide-react';
import authService from '../services/auth.service';
import MainLayout from '../components/MainLayout';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobile: '', address: '', pin: '' });
    const [resetData, setResetData] = useState({ id: null, name: '', newPin: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStaff = async () => {
        try {
            const data = await authService.getAllStaff();
            setStaff(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.pin.length !== 4) {
            setError("PIN must be exactly 4 digits for staff.");
            return;
        }
        try {
            const res = await authService.createStaff(formData.name, formData.mobile, formData.pin, formData.address);
            setSuccess(`Staff Created! ID: ${res.data.staff_id}`);
            setShowAddForm(false);
            setFormData({ name: '', mobile: '', address: '', pin: '' });
            fetchStaff();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create staff");
        }
    };

    const handleResetClick = (user) => {
        setResetData({ id: user.id, name: user.name, newPin: '' });
        setShowResetModal(true);
        setError('');
        setSuccess('');
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (resetData.newPin.length !== 4) {
            setError("PIN must be exactly 4 digits.");
            return;
        }
        try {
            await authService.updateStaffPin(resetData.id, resetData.newPin);
            setSuccess(`PIN Reset for ${resetData.name}`);
            setShowResetModal(false);
            setResetData({ id: null, name: '', newPin: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset PIN");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this staff member? This action cannot be undone.")) return;

        setDeletingId(id);
        setError('');
        try {
            await authService.deleteStaff(id);
            setSuccess("Staff member removed successfully.");
            setTimeout(() => setSuccess(''), 3000);
            fetchStaff();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to delete staff. Ensure you have admin privileges.");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const isRecent = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // 30 days new joiner
    };

    const filteredStaff = staff.filter(s =>
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.mobile && s.mobile.includes(searchTerm)) ||
        (s.staff_id && s.staff_id.toString().includes(searchTerm))
    );

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Management</h1>
                        <p className="text-slate-500 font-medium mt-2">Manage your team's access and view their profiles.</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <UserPlus size={18} />
                        Add Member
                    </button>
                </div>

                {/* Notifications */}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                )}

                {/* Search & Toolbar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Name, Mobile or ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Professional Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4">Staff Member</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Status & Role</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400 text-sm">Loading Staff Data...</td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                    <User className="text-slate-300 w-6 h-6" />
                                                </div>
                                                <p className="text-slate-500 font-medium text-sm">No staff members found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-100">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">ID: {user.staff_id || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                                        {user.mobile}
                                                    </div>
                                                    {user.address && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 max-w-[150px] truncate" title={user.address}>
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            {user.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Active Staff'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatDate(user.created_at || user.createdAt)}
                                                        </span>
                                                        {isRecent(user.created_at || user.createdAt) && (
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-1">
                                                                New Joiner
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleResetClick(user)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Reset PIN"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={deletingId === user.id}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Staff"
                                                    >
                                                        {deletingId === user.id ? (
                                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal for Reset PIN */}
            {showResetModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Reset PIN</h2>
                            <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Enter new PIN for <strong>{resetData.name}</strong>.</p>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">New PIN (4 Digits)</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onChange={e => setResetData({ ...resetData, newPin: e.target.value.replace(/\D/g, '') })}
                                    value={resetData.newPin}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors text-sm">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-200 text-sm">Update PIN</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Add Staff */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Add New Staff</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Form Fields */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    value={formData.name}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    value={formData.mobile}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    value={formData.address}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">PIN (4 Digits)</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                    value={formData.pin}
                                />
                                <p className="text-[10px] text-slate-400">Used for login authentication.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors text-sm">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-200 text-sm">Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default StaffManagement;

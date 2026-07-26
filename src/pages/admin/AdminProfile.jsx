// src/pages/admin/AdminProfile.jsx
// The admin's own account details — distinct from the public-facing "Coach
// Bio" in Site Settings. This is what auto-fills the Trainer Info step of
// the Diet Plan wizard, keyed to whoever is actually logged in.
import { useState, useEffect } from 'react';
import { Loader2, Save, User, Lock } from 'lucide-react';
import { fetchAdminProfile, saveAdminProfile, changePassword, getStoredAdmin } from './adminApi';
import { TextInput } from './content/SettingsFields';
import { useToast } from './ToastProvider';

const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };

export default function AdminProfile() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({ displayName: '', qualification: '', contact: '' });
    const [username, setUsername] = useState('');

    const [pwSaving, setPwSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const p = await fetchAdminProfile();
                setUsername(p.username);
                setProfile({
                    displayName: p.display_name || '',
                    qualification: p.qualification || '',
                    contact: p.contact || '',
                });
            } catch (e) { toast.error(e.message); }
            finally { setLoading(false); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setField = (key) => (val) => setProfile((p) => ({ ...p, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAdminProfile(profile);
            toast.success('Profile saved — used for Diet Plan trainer autofill going forward.');
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) { toast.error('Enter your current and new password'); return; }
        if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
        setPwSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success('Password updated');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e) { toast.error(e.message); }
        finally { setPwSaving(false); }
    };

    if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;

    const admin = getStoredAdmin();

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h1 className="text-xl font-black text-white">My Profile</h1>
                <p className="text-xs text-white/35 mt-1">Your name, qualification, and contact — used to auto-fill the Trainer Info step whenever you create a new Diet Plan.</p>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }}>
                        <User className="w-4 h-4" style={{ color: '#e71763' }} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white">Account Details</p>
                        <p className="text-xs text-white/30">Username: {username} {admin?.role && <span className="capitalize">· {admin.role}</span>}</p>
                    </div>
                </div>
                <TextInput label="Display Name" value={profile.displayName} onChange={setField('displayName')} placeholder="Your name as it should appear to clients" />
                <TextInput label="Qualification" value={profile.qualification} onChange={setField('qualification')} placeholder="e.g. Certified Nutritionist, ACSM" />
                <TextInput label="Contact" value={profile.contact} onChange={setField('contact')} placeholder="Phone or email shown on diet plan PDFs" />

                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.3)' }}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Profile
                </button>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Lock className="w-4 h-4 text-white/50" />
                    </div>
                    <p className="text-sm font-black text-white">Change Password</p>
                </div>
                <TextInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" type="password" />
                <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput label="New Password" value={newPassword} onChange={setNewPassword} placeholder="At least 10 characters" type="password" />
                    <TextInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" type="password" />
                </div>
                <button onClick={handleChangePassword} disabled={pwSaving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white/70 disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    Update Password
                </button>
            </div>
        </div>
    );
}

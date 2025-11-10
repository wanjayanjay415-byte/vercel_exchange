import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getUserById, updateUsername, updatePassword, sendEmailVerification } from '../lib/auth';

interface SettingsProps {
  userId: string;
}

export default function Settings({ userId }: SettingsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getUserById(userId);
      if (u) {
        setUsername(u.username || '');
        setEmail((u as any).email || '');
      }
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSave = async () => {
    setErr(null); setMsg(null);
    try {
      await updateUsername(userId, username.trim());
      setMsg('Username berhasil diupdate');
      localStorage.setItem('username', username.trim());
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  const handlePasswordSave = async () => {
    setErr(null); setMsg(null);
    if (newPassword !== confirmPassword) {
      setErr('Password konfirmasi tidak cocok');
      return;
    }
    try {
      await updatePassword(userId, currentPassword, newPassword);
      setMsg('Password berhasil diubah');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  const handleSendVerification = async () => {
    setErr(null); setMsg(null);
    try {
      await sendEmailVerification(userId);
      setMsg('Permintaan verifikasi email tercatat. Periksa inbox email Anda.');
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          aria-label="Kembali ke Dashboard"
          onClick={() => navigate('/')}
          className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-md"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Pengaturan Akun</h2>
      </div>
      {loading ? (
        <div className="text-slate-400">Memuat...</div>
      ) : (
        <div className="space-y-6">
          {msg && <div className="p-3 bg-emerald-700/40 text-emerald-100 rounded">{msg}</div>}
          {err && <div className="p-3 bg-red-700/40 text-red-100 rounded">{err}</div>}

          <section className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Ubah Username</h3>
            <div className="flex gap-2">
              <input value={username} onChange={e => setUsername(e.target.value)} className="flex-1 p-2 rounded bg-slate-900/40 text-white" />
              <button onClick={handleUsernameSave} className="px-3 py-2 bg-emerald-600 rounded text-white">Simpan</button>
            </div>
          </section>

          <section className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Ubah Password</h3>
            <div className="space-y-2">
              <input type="password" placeholder="Password saat ini" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" />
              <input type="password" placeholder="Password baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" />
              <input type="password" placeholder="Konfirmasi password baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" />
              <div className="flex justify-end">
                <button onClick={handlePasswordSave} className="px-3 py-2 bg-emerald-600 rounded text-white">Ganti Password</button>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Verifikasi Email</h3>
            <div className="text-slate-300 mb-2">Email terdaftar: <span className="font-medium text-white">{email || '—'}</span></div>
            <div className="flex gap-2">
              <button onClick={handleSendVerification} className="px-3 py-2 bg-orange-500 rounded text-white">Kirim Tautan Verifikasi</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

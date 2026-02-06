import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogIn, Eye, EyeOff } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export function StudentLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const q = query(
        collection(db, 'Peserta'),
        where('username', '==', username)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Username tidak ditemukan');
        setLoading(false);
        return;
      }

      const pesertaDoc = snapshot.docs[0];
      const pesertaData = pesertaDoc.data();

      if (pesertaData.password !== password) {
        setError('Password salah');
        setLoading(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem('peserta', JSON.stringify({
        id: pesertaDoc.id,
        ...pesertaData
      }));

      navigate('/ujian');
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex flex-col">
      {/* Admin Access - Gear Icon */}
      <div className="absolute top-4 right-4">
        <Link
          to="/admin/login"
          className="flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
          title="Login Admin"
        >
          <Settings className="h-6 w-6 text-white" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 p-6 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl font-bold text-red-600">CBT</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Selamat Datang</h1>
            <p className="text-red-100 mt-1">Masuk untuk memulai ujian</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username / No. WA</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Belum punya akun?{' '}
                <Link to="/register" className="text-red-600 hover:underline font-medium">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-white/60 text-sm">&copy; 2024 CBT Application</p>
      </div>
    </div>
  );
}

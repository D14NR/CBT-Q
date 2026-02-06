import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export function StudentRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nama_peserta: '',
    asal_sekolah: '',
    jenjang_studi: '',
    kelas: '',
    no_wa_peserta: '',
    no_wa_ortu: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-fill username when WA is entered
      if (name === 'no_wa_peserta') {
        updated.username = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan Konfirmasi Password tidak sama');
      return;
    }

    setLoading(true);

    try {
      // Check if username exists
      const q = query(
        collection(db, 'Peserta'),
        where('username', '==', formData.username)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError('Username/No. WA sudah terdaftar');
        setLoading(false);
        return;
      }

      // Register
      const { confirmPassword, ...dataToSave } = formData;
      await addDoc(collection(db, 'Peserta'), dataToSave);

      alert('Pendaftaran berhasil! Silakan login.');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex flex-col py-8">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:text-red-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Kembali</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg">
              <UserPlus className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-white">Daftar Akun Baru</h1>
            <p className="text-red-100 mt-1">Lengkapi data diri Anda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama_peserta"
                  required
                  value={formData.nama_peserta}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">No. WhatsApp Peserta</label>
                <input
                  type="tel"
                  name="no_wa_peserta"
                  required
                  value={formData.no_wa_peserta}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500">Akan digunakan sebagai username</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username otomatis dari No. WA"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Asal Sekolah</label>
                <input
                  type="text"
                  name="asal_sekolah"
                  required
                  value={formData.asal_sekolah}
                  onChange={handleChange}
                  placeholder="Nama sekolah"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Jenjang Studi</label>
                <select
                  name="jenjang_studi"
                  required
                  value={formData.jenjang_studi}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Pilih Jenjang</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA/SMK</option>
                  <option value="Mahasiswa">Mahasiswa</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kelas</label>
                <input
                  type="text"
                  name="kelas"
                  required
                  value={formData.kelas}
                  onChange={handleChange}
                  placeholder="Contoh: 10 IPA 1"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">No. WhatsApp Orang Tua</label>
                <input
                  type="tel"
                  name="no_wa_ortu"
                  required
                  value={formData.no_wa_ortu}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Buat password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Konfirmasi Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Sudah punya akun?{' '}
                <Link to="/" className="text-red-600 hover:underline font-medium">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, Calendar, Key, BookOpen } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Agenda {
  id: string;
  agenda_ujian: string;
  deskripsi_ujian: string;
  jenis_tes: string;
  token_ujian: string;
  tgljam_mulai: string;
  tgljam_selesai: string;
}

interface Peserta {
  id: string;
  nama_peserta: string;
  asal_sekolah: string;
  kelas: string;
}

export function StudentExamListPage() {
  const navigate = useNavigate();
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [tokenInput, setTokenInput] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('peserta');
    if (!stored) {
      navigate('/');
      return;
    }
    setPeserta(JSON.parse(stored));
    fetchAgendas();
  }, [navigate]);

  const fetchAgendas = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Agenda Ujian'));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
      
      // Filter active exams (current time is between start and end)
      const now = new Date();
      const activeAgendas = items.filter(a => {
        const start = new Date(a.tgljam_mulai);
        const end = new Date(a.tgljam_selesai);
        return now >= start && now <= end;
      });
      
      setAgendas(activeAgendas);
    } catch (error) {
      console.error('Error fetching agendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('peserta');
    navigate('/');
  };

  const handleStartExam = (agenda: Agenda) => {
    const inputToken = tokenInput[agenda.id]?.toUpperCase().trim();
    
    if (!inputToken) {
      alert('Masukkan token ujian terlebih dahulu');
      return;
    }

    if (inputToken !== agenda.token_ujian) {
      alert('Token ujian tidak valid');
      return;
    }

    // Navigate to exam page
    navigate(`/ujian/${agenda.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!peserta) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">CBT</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Portal Ujian</h1>
              <p className="text-red-100 text-sm">Computer Based Test</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">
                {peserta.nama_peserta.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{peserta.nama_peserta}</h2>
              <p className="text-gray-600">{peserta.asal_sekolah}</p>
              <p className="text-gray-500 text-sm">Kelas {peserta.kelas}</p>
            </div>
          </div>
        </div>

        {/* Exam List */}
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-red-600" />
          Ujian Tersedia
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data ujian...</p>
          </div>
        ) : agendas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600">Tidak Ada Ujian Aktif</h4>
            <p className="text-gray-500 mt-2">Saat ini tidak ada ujian yang sedang berlangsung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agendas.map(agenda => (
              <div key={agenda.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
                  <h4 className="font-bold text-lg">{agenda.agenda_ujian}</h4>
                  <span className="inline-block bg-white/20 px-2 py-1 rounded text-xs mt-2">
                    {agenda.jenis_tes}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-gray-600 text-sm">{agenda.deskripsi_ujian}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Mulai: {formatDate(agenda.tgljam_mulai)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Selesai: {formatDate(agenda.tgljam_selesai)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Key className="h-4 w-4" />
                      Token Ujian
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Masukkan token"
                        value={tokenInput[agenda.id] || ''}
                        onChange={(e) => setTokenInput(prev => ({
                          ...prev,
                          [agenda.id]: e.target.value
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center uppercase tracking-wider font-mono"
                        maxLength={10}
                      />
                      <button
                        onClick={() => handleStartExam(agenda)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Mulai
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        &copy; 2024 CBT Application
      </footer>
    </div>
  );
}

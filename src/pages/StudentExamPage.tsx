import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

interface Soal {
  id: string;
  no_soal: string;
  type_soal: string;
  pertanyaan: string;
  gambar_url?: string;
  pilihan_a?: string;
  pilihan_b?: string;
  pilihan_c?: string;
  pilihan_d?: string;
  pilihan_e?: string;
  pernyataan_1?: string;
  pernyataan_2?: string;
  pernyataan_3?: string;
  pernyataan_4?: string;
  pernyataan_5?: string;
  pasangan_kiri_1?: string;
  pasangan_kiri_2?: string;
  pasangan_kiri_3?: string;
  pasangan_kiri_4?: string;
  pasangan_kiri_5?: string;
  pasangan_kanan_1?: string;
  pasangan_kanan_2?: string;
  pasangan_kanan_3?: string;
  pasangan_kanan_4?: string;
  pasangan_kanan_5?: string;
  kunci_jawaban: string;
  mata_pelajaran?: string;
  mapel_id?: string;
}

interface Mapel {
  id: string;
  mata_pelajaran: string;
  durasi_ujian: string;
  jumlah_soal: string;
  agenda_id: string;
}

interface Peserta {
  id: string;
  nama_peserta: string;
}

export function StudentExamPage() {
  const { agendaId } = useParams();
  const navigate = useNavigate();
  
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [selectedMapel, setSelectedMapel] = useState<Mapel | null>(null);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('peserta');
    if (!stored) {
      navigate('/');
      return;
    }
    setPeserta(JSON.parse(stored));
    fetchMapels();
  }, [navigate, agendaId]);

  // Timer
  useEffect(() => {
    if (!isExamStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft]);

  const fetchMapels = async () => {
    try {
      const q = query(
        collection(db, 'Mata Pelajaran'),
        where('agenda_id', '==', agendaId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mapel));
      setMapels(items);
    } catch (error) {
      console.error('Error fetching mapels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSoal = async (mapelId: string) => {
    try {
      const q = query(
        collection(db, 'Bank Soal'),
        where('mapel_id', '==', mapelId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Soal));
      // Sort by no_soal
      items.sort((a, b) => parseInt(a.no_soal) - parseInt(b.no_soal));
      setSoalList(items);
    } catch (error) {
      console.error('Error fetching soal:', error);
    }
  };

  const startExam = async (mapel: Mapel) => {
    setSelectedMapel(mapel);
    setTimeLeft(parseInt(mapel.durasi_ujian) * 60); // Convert to seconds
    await fetchSoal(mapel.id);
    setIsExamStarted(true);
  };

  const handleAnswer = (soalId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [soalId]: answer }));
  };

  const handleFinish = async () => {
    if (!peserta || !selectedMapel) return;

    try {
      // Calculate score
      let correct = 0;
      soalList.forEach(soal => {
        const userAnswer = answers[soal.id]?.toUpperCase() || '';
        const correctAnswer = soal.kunci_jawaban?.toUpperCase() || '';
        if (userAnswer === correctAnswer) {
          correct++;
        }
      });

      const score = Math.round((correct / soalList.length) * 100);

      // Save result to Firestore
      await addDoc(collection(db, 'Hasil Ujian'), {
        peserta_id: peserta.id,
        peserta_nama: peserta.nama_peserta,
        agenda_id: agendaId,
        mapel_id: selectedMapel.id,
        mapel_nama: selectedMapel.mata_pelajaran,
        jawaban: answers,
        benar: correct,
        salah: soalList.length - correct,
        skor: score,
        waktu_selesai: new Date().toISOString()
      });

      setIsExamFinished(true);
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Gagal menyimpan hasil ujian');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSoal = soalList[currentIndex];
  const isAnswered = (soalId: string) => !!answers[soalId];

  // Render question based on type
  const renderQuestion = () => {
    if (!currentSoal) return null;

    const type = currentSoal.type_soal;

    return (
      <div className="space-y-6">
        {/* Question Text */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentSoal.pertanyaan}</p>
          {currentSoal.gambar_url && (
            <img src={currentSoal.gambar_url} alt="Gambar Soal" className="mt-4 max-w-full rounded-lg" />
          )}
        </div>

        {/* Options based on type */}
        {(type === 'Pilihan Ganda Tunggal (PG)' || type === 'Pilihan Ganda Kompleks (PK)') && (
          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map(opt => {
              const optionText = currentSoal[`pilihan_${opt.toLowerCase()}` as keyof Soal];
              if (!optionText) return null;
              
              const isSelected = type === 'Pilihan Ganda Tunggal (PG)' 
                ? answers[currentSoal.id] === opt
                : answers[currentSoal.id]?.includes(opt);

              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (type === 'Pilihan Ganda Tunggal (PG)') {
                      handleAnswer(currentSoal.id, opt);
                    } else {
                      // PK - Multiple selection
                      const current = answers[currentSoal.id] || '';
                      if (current.includes(opt)) {
                        handleAnswer(currentSoal.id, current.replace(opt, ''));
                      } else {
                        handleAnswer(currentSoal.id, current + opt);
                      }
                    }
                  }}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {opt}
                  </span>
                  <span className="flex-1 pt-1">{optionText}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Benar/Salah or Setuju/Tidak */}
        {(type === 'Pilihan Benar/Salah (BS)' || type === 'Pilihan Setuju/Tidak (ST)') && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(num => {
              const pernyataan = currentSoal[`pernyataan_${num}` as keyof Soal];
              if (!pernyataan) return null;

              const currentAnswer = answers[currentSoal.id] || '';
              const selectedValue = currentAnswer[num - 1] || '';
              const opt1 = type === 'Pilihan Benar/Salah (BS)' ? 'B' : 'S';
              const opt2 = type === 'Pilihan Benar/Salah (BS)' ? 'S' : 'T';
              const label1 = type === 'Pilihan Benar/Salah (BS)' ? 'Benar' : 'Setuju';
              const label2 = type === 'Pilihan Benar/Salah (BS)' ? 'Salah' : 'Tidak';

              const handleSelect = (value: string) => {
                const arr = currentAnswer.split('');
                while (arr.length < num) arr.push('');
                arr[num - 1] = value;
                handleAnswer(currentSoal.id, arr.join(''));
              };

              return (
                <div key={num} className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-800 mb-3">{num}. {pernyataan}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSelect(opt1)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedValue === opt1
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {label1}
                    </button>
                    <button
                      onClick={() => handleSelect(opt2)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedValue === opt2
                          ? 'bg-red-500 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {label2}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Menjodohkan */}
        {type === 'Menjodohkan (MJ)' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Cocokkan pernyataan di kiri dengan jawaban di kanan. Format: 1A2B3C...</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Pernyataan</h5>
                {[1, 2, 3, 4, 5].map(num => {
                  const kiri = currentSoal[`pasangan_kiri_${num}` as keyof Soal];
                  if (!kiri) return null;
                  return (
                    <div key={num} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-bold text-blue-600">{num}.</span> {kiri}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700">Jawaban</h5>
                {[1, 2, 3, 4, 5].map(num => {
                  const kanan = currentSoal[`pasangan_kanan_${num}` as keyof Soal];
                  if (!kanan) return null;
                  return (
                    <div key={num} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="font-bold text-green-600">{String.fromCharCode(64 + num)}.</span> {kanan}
                    </div>
                  );
                })}
              </div>
            </div>
            <input
              type="text"
              placeholder="Ketik jawaban: 1A2B3C..."
              value={answers[currentSoal.id] || ''}
              onChange={(e) => handleAnswer(currentSoal.id, e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-mono text-center text-lg tracking-widest"
            />
          </div>
        )}

        {/* Uraian */}
        {type === 'Uraian (UR)' && (
          <textarea
            placeholder="Tulis jawaban Anda di sini..."
            value={answers[currentSoal.id] || ''}
            onChange={(e) => handleAnswer(currentSoal.id, e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 min-h-[150px]"
          />
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Select Mapel
  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pilih Mata Pelajaran</h2>
            
            {mapels.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Tidak ada mata pelajaran tersedia untuk ujian ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mapels.map(mapel => (
                  <button
                    key={mapel.id}
                    onClick={() => startExam(mapel)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-left group"
                  >
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-red-600">
                      {mapel.mata_pelajaran}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>⏱️ Durasi: {mapel.durasi_ujian} menit</p>
                      <p>📝 Jumlah Soal: {mapel.jumlah_soal} soal</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/ujian')}
              className="mt-6 text-gray-600 hover:text-red-600 flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali ke Daftar Ujian
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam Finished
  if (isExamFinished) {
    const correct = soalList.filter(soal => 
      answers[soal.id]?.toUpperCase() === soal.kunci_jawaban?.toUpperCase()
    ).length;
    const score = Math.round((correct / soalList.length) * 100);

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 ${
            score >= 70 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <span className={`text-4xl font-bold ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
              {score}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ujian Selesai!</h2>
          <p className="text-gray-600 mb-6">{selectedMapel?.mata_pelajaran}</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Benar</span>
              <span className="font-bold text-green-600">{correct}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Salah</span>
              <span className="font-bold text-red-600">{soalList.length - correct}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Soal</span>
              <span className="font-bold">{soalList.length}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/ujian')}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  // Main Exam Interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-800">{selectedMapel?.mata_pelajaran}</h1>
            <p className="text-sm text-gray-600">{peserta?.nama_peserta}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-800'
          }`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Question Number */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Soal No. {currentIndex + 1}
                </h3>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  {currentSoal?.type_soal?.split('(')[0]?.trim()}
                </span>
              </div>

              {renderQuestion()}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </button>
                {currentIndex < soalList.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmFinish(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    <Flag className="h-4 w-4" />
                    Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Question Navigator */}
        <aside className="w-64 bg-white border-l border-gray-200 p-4 hidden lg:block">
          <h4 className="font-bold text-gray-800 mb-4">Navigasi Soal</h4>
          <div className="grid grid-cols-5 gap-2">
            {soalList.map((soal, idx) => (
              <button
                key={soal.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  idx === currentIndex
                    ? 'bg-red-600 text-white'
                    : isAnswered(soal.id)
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Belum dijawab</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmFinish(true)}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
          >
            <Flag className="h-4 w-4" />
            Selesai Ujian
          </button>
        </aside>
      </div>

      {/* Confirm Finish Modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-yellow-600 mb-4">
              <AlertTriangle className="h-8 w-8" />
              <h3 className="text-lg font-bold">Konfirmasi Selesai</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin menyelesaikan ujian?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Soal dijawab: <span className="font-bold text-green-600">{Object.keys(answers).length}</span> dari {soalList.length}
              </p>
              <p className="text-sm text-gray-600">
                Belum dijawab: <span className="font-bold text-red-600">{soalList.length - Object.keys(answers).length}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

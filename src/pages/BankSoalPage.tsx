import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus } from 'lucide-react';

interface BankSoal {
  id: string;
  mata_pelajaran: string;
  type_soal: string;
  no_soal: string;
  pertanyaan: string;
  gambar_url: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  pilihan_e: string;
  kunci_jawaban: string;
  [key: string]: any; // Allow dynamic keys for pasangan fields
}

const INITIAL_STATE: any = {
  mata_pelajaran: '',
  type_soal: 'Pilihan Ganda',
  no_soal: '',
  pertanyaan: '',
  gambar_url: '',
  pilihan_a: '',
  pilihan_b: '',
  pilihan_c: '',
  pilihan_d: '',
  pilihan_e: '',
  kunci_jawaban: '',
};

// Initialize Pasangan fields
for (let i = 1; i <= 8; i++) {
  INITIAL_STATE[`pasangan_kiri_${i}`] = '';
  INITIAL_STATE[`pasangan_kanan_${i}`] = '';
}

export function BankSoalPage() {
  const [data, setData] = useState<BankSoal[]>([]);
  const [mapelList, setMapelList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const fetchBankSoal = async () => {
    const querySnapshot = await getDocs(collection(db, 'Bank Soal'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankSoal));
    setData(items);
  };

  const fetchMapel = async () => {
      const querySnapshot = await getDocs(collection(db, 'Mata Pelajaran'));
      const items = querySnapshot.docs.map(doc => doc.data().mata_pelajaran);
      setMapelList(items);
  }

  useEffect(() => {
    fetchBankSoal();
    fetchMapel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'Bank Soal', editingId);
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, 'Bank Soal'), formData);
      }
      setIsModalOpen(false);
      setFormData(INITIAL_STATE);
      setEditingId(null);
      fetchBankSoal();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: BankSoal) => {
    const newState = { ...INITIAL_STATE, ...item };
    setFormData(newState);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: BankSoal) => {
    if (confirm(`Apakah Anda yakin ingin menghapus soal no ${item.no_soal}?`)) {
      try {
        await deleteDoc(doc(db, 'Bank Soal', item.id));
        fetchBankSoal();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Gagal menghapus data");
      }
    }
  };

  const columns = [
    { header: 'Mapel', accessor: 'mata_pelajaran' as keyof BankSoal },
    { header: 'No', accessor: 'no_soal' as keyof BankSoal },
    { header: 'Type', accessor: 'type_soal' as keyof BankSoal },
    { header: 'Pertanyaan', accessor: (item: BankSoal) => item.pertanyaan.substring(0, 50) + '...' },
    { header: 'Kunci', accessor: 'kunci_jawaban' as keyof BankSoal },
  ];

  return (
    <Layout title="Bank Soal">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Kelola bank soal ujian.</p>
        <button
          onClick={() => {
            setFormData(INITIAL_STATE);
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Soal
        </button>
      </div>

      <Table
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        keyExtractor={(item) => item.id}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Soal' : 'Tambah Soal'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select
                required
                value={formData.mata_pelajaran}
                onChange={e => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Pilih Mapel</option>
                {mapelList.map((mapel, idx) => (
                    <option key={idx} value={mapel}>{mapel}</option>
                ))}
              </select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">No. Soal</label>
                <input
                  required
                  type="number"
                  value={formData.no_soal}
                  onChange={e => setFormData({ ...formData, no_soal: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type Soal</label>
             <select
              required
              value={formData.type_soal}
              onChange={e => setFormData({ ...formData, type_soal: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Pilihan Ganda">Pilihan Ganda</option>
              <option value="Essay">Essay</option>
              <option value="Menjodohkan">Menjodohkan</option>
            </select>
          </div>
         
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pertanyaan</label>
            <textarea
              required
              value={formData.pertanyaan}
              onChange={e => setFormData({ ...formData, pertanyaan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
          </div>
           <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gambar URL (Opsional)</label>
            <input
              type="text"
              value={formData.gambar_url}
              onChange={e => setFormData({ ...formData, gambar_url: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {formData.type_soal === 'Pilihan Ganda' && (
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-700">Pilihan Jawaban</h4>
                <input placeholder="Pilihan A" value={formData.pilihan_a} onChange={e => setFormData({ ...formData, pilihan_a: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                <input placeholder="Pilihan B" value={formData.pilihan_b} onChange={e => setFormData({ ...formData, pilihan_b: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                <input placeholder="Pilihan C" value={formData.pilihan_c} onChange={e => setFormData({ ...formData, pilihan_c: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                <input placeholder="Pilihan D" value={formData.pilihan_d} onChange={e => setFormData({ ...formData, pilihan_d: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                <input placeholder="Pilihan E" value={formData.pilihan_e} onChange={e => setFormData({ ...formData, pilihan_e: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          )}

          {formData.type_soal === 'Menjodohkan' && (
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-700">Pasangan Jawaban</h4>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div key={num} className="grid grid-cols-2 gap-2">
                  <input
                    placeholder={`Pasangan Kiri ${num}`}
                    value={formData[`pasangan_kiri_${num}`]}
                    onChange={e => setFormData({ ...formData, [`pasangan_kiri_${num}`]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={`Pasangan Kanan ${num}`}
                    value={formData[`pasangan_kanan_${num}`]}
                    onChange={e => setFormData({ ...formData, [`pasangan_kanan_${num}`]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kunci Jawaban</label>
            <input
              required
              type="text"
              value={formData.kunci_jawaban}
              onChange={e => setFormData({ ...formData, kunci_jawaban: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Misal: A"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

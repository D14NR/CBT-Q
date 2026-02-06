import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus } from 'lucide-react';

interface Peserta {
  id: string;
  username: string;
  password?: string;
  nama_peserta: string;
  asal_sekolah: string;
  jenjang_studi: string;
  kelas: string;
  no_wa_peserta: string;
  no_wa_ortu: string;
}

const INITIAL_STATE = {
  username: '',
  password: '',
  nama_peserta: '',
  asal_sekolah: '',
  jenjang_studi: '',
  kelas: '',
  no_wa_peserta: '',
  no_wa_ortu: ''
};

export function PesertaPage() {
  const [data, setData] = useState<Peserta[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const fetchPeserta = async () => {
    const querySnapshot = await getDocs(collection(db, 'Peserta'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Peserta));
    setData(items);
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'Peserta', editingId);
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, 'Peserta'), formData);
      }
      setIsModalOpen(false);
      setFormData(INITIAL_STATE);
      setEditingId(null);
      fetchPeserta();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Peserta) => {
    setFormData({
      username: item.username,
      password: item.password || '',
      nama_peserta: item.nama_peserta,
      asal_sekolah: item.asal_sekolah,
      jenjang_studi: item.jenjang_studi,
      kelas: item.kelas,
      no_wa_peserta: item.no_wa_peserta,
      no_wa_ortu: item.no_wa_ortu
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Peserta) => {
    if (confirm(`Apakah Anda yakin ingin menghapus peserta ${item.nama_peserta}?`)) {
      try {
        await deleteDoc(doc(db, 'Peserta', item.id));
        fetchPeserta();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Gagal menghapus data");
      }
    }
  };

  const columns = [
    { header: 'Nama Peserta', accessor: 'nama_peserta' as keyof Peserta },
    { header: 'Username', accessor: 'username' as keyof Peserta },
    { header: 'Sekolah', accessor: 'asal_sekolah' as keyof Peserta },
    { header: 'Kelas', accessor: 'kelas' as keyof Peserta },
    { header: 'WA Peserta', accessor: 'no_wa_peserta' as keyof Peserta },
  ];

  return (
    <Layout title="Data Peserta">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Kelola data peserta ujian.</p>
        <button
          onClick={() => {
            setFormData(INITIAL_STATE);
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Peserta
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
        title={editingId ? 'Edit Peserta' : 'Tambah Peserta'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              required
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              required
              type="text"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Peserta</label>
            <input
              required
              type="text"
              value={formData.nama_peserta}
              onChange={e => setFormData({ ...formData, nama_peserta: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Asal Sekolah</label>
            <input
              required
              type="text"
              value={formData.asal_sekolah}
              onChange={e => setFormData({ ...formData, asal_sekolah: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Jenjang Studi</label>
            <select
              required
              value={formData.jenjang_studi}
              onChange={e => setFormData({ ...formData, jenjang_studi: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              required
              type="text"
              value={formData.kelas}
              onChange={e => setFormData({ ...formData, kelas: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">No. WA Peserta</label>
            <input
              required
              type="tel"
              value={formData.no_wa_peserta}
              onChange={e => setFormData({ ...formData, no_wa_peserta: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">No. WA Ortu</label>
            <input
              required
              type="tel"
              value={formData.no_wa_ortu}
              onChange={e => setFormData({ ...formData, no_wa_ortu: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
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

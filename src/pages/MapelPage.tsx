import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus } from 'lucide-react';

interface Mapel {
  id: string;
  mata_pelajaran: string;
  durasi_ujian: string;
  jumlah_soal: string;
  status_mata_pelajaran: string;
  agenda_id?: string;
  agenda_nama?: string;
}

const INITIAL_STATE = {
  mata_pelajaran: '',
  durasi_ujian: '',
  jumlah_soal: '',
  status_mata_pelajaran: 'Aktif',
  agenda_id: '',
  agenda_nama: ''
};

export function MapelPage() {
  const [data, setData] = useState<Mapel[]>([]);
  const [agendas, setAgendas] = useState<{id: string, agenda_ujian: string}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const fetchMapel = async () => {
    const querySnapshot = await getDocs(collection(db, 'Mata Pelajaran'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mapel));
    setData(items);
  };

  const fetchAgendas = async () => {
    const querySnapshot = await getDocs(collection(db, 'Agenda Ujian'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, agenda_ujian: doc.data().agenda_ujian }));
    setAgendas(items);
  };

  useEffect(() => {
    fetchMapel();
    fetchAgendas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'Mata Pelajaran', editingId);
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, 'Mata Pelajaran'), formData);
      }
      setIsModalOpen(false);
      setFormData(INITIAL_STATE);
      setEditingId(null);
      fetchMapel();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Mapel) => {
    setFormData({
      mata_pelajaran: item.mata_pelajaran,
      durasi_ujian: item.durasi_ujian,
      jumlah_soal: item.jumlah_soal,
      status_mata_pelajaran: item.status_mata_pelajaran,
      agenda_id: item.agenda_id || '',
      agenda_nama: item.agenda_nama || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Mapel) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${item.mata_pelajaran}?`)) {
      try {
        await deleteDoc(doc(db, 'Mata Pelajaran', item.id));
        fetchMapel();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Gagal menghapus data");
      }
    }
  };

  const columns = [
    { header: 'Agenda', accessor: 'agenda_nama' as keyof Mapel },
    { header: 'Mata Pelajaran', accessor: 'mata_pelajaran' as keyof Mapel },
    { header: 'Durasi (Menit)', accessor: 'durasi_ujian' as keyof Mapel },
    { header: 'Jumlah Soal', accessor: 'jumlah_soal' as keyof Mapel },
    { 
      header: 'Status', 
      accessor: (item: Mapel) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          item.status_mata_pelajaran === 'Aktif' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {item.status_mata_pelajaran}
        </span>
      )
    },
  ];

  return (
    <Layout title="Mata Pelajaran">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Kelola mata pelajaran yang diujikan.</p>
        <button
          onClick={() => {
            setFormData(INITIAL_STATE);
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Mapel
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
        title={editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Agenda Ujian</label>
            <select
              required
              value={formData.agenda_id}
              onChange={e => {
                const selectedAgenda = agendas.find(a => a.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  agenda_id: e.target.value,
                  agenda_nama: selectedAgenda ? selectedAgenda.agenda_ujian : '' 
                });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Pilih Agenda</option>
              {agendas.map(agenda => (
                <option key={agenda.id} value={agenda.id}>
                  {agenda.agenda_ujian}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <input
              required
              type="text"
              value={formData.mata_pelajaran}
              onChange={e => setFormData({ ...formData, mata_pelajaran: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Durasi Ujian (Menit)</label>
              <input
                required
                type="number"
                value={formData.durasi_ujian}
                onChange={e => setFormData({ ...formData, durasi_ujian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jumlah Soal</label>
              <input
                required
                type="number"
                value={formData.jumlah_soal}
                onChange={e => setFormData({ ...formData, jumlah_soal: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              required
              value={formData.status_mata_pelajaran}
              onChange={e => setFormData({ ...formData, status_mata_pelajaran: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
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

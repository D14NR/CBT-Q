import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, RefreshCw } from 'lucide-react';

interface Agenda {
  id: string;
  agenda_ujian: string;
  deskripsi_ujian: string;
  jenis_tes: string;
  token_ujian: string;
  tgljam_mulai: string;
  tgljam_selesai: string;
}

const INITIAL_STATE = {
  agenda_ujian: '',
  deskripsi_ujian: '',
  jenis_tes: '',
  token_ujian: '',
  tgljam_mulai: '',
  tgljam_selesai: ''
};

export function AgendaPage() {
  const [data, setData] = useState<Agenda[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const fetchAgenda = async () => {
    const querySnapshot = await getDocs(collection(db, 'Agenda Ujian'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agenda));
    setData(items);
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, token_ujian: token }));
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'Agenda Ujian', editingId);
        await updateDoc(docRef, formData);
      } else {
        await addDoc(collection(db, 'Agenda Ujian'), formData);
      }
      setIsModalOpen(false);
      setFormData(INITIAL_STATE);
      setEditingId(null);
      fetchAgenda();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Agenda) => {
    setFormData({
      agenda_ujian: item.agenda_ujian,
      deskripsi_ujian: item.deskripsi_ujian,
      jenis_tes: item.jenis_tes,
      token_ujian: item.token_ujian,
      tgljam_mulai: item.tgljam_mulai,
      tgljam_selesai: item.tgljam_selesai
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Agenda) => {
    if (confirm(`Apakah Anda yakin ingin menghapus agenda ${item.agenda_ujian}?`)) {
      try {
        await deleteDoc(doc(db, 'Agenda Ujian', item.id));
        fetchAgenda();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Gagal menghapus data");
      }
    }
  };

  const columns = [
    { header: 'Agenda Ujian', accessor: 'agenda_ujian' as keyof Agenda },
    { header: 'Jenis Tes', accessor: 'jenis_tes' as keyof Agenda },
    { header: 'Token', accessor: 'token_ujian' as keyof Agenda },
    { header: 'Mulai', accessor: 'tgljam_mulai' as keyof Agenda },
    { header: 'Selesai', accessor: 'tgljam_selesai' as keyof Agenda },
  ];

  return (
    <Layout title="Agenda Ujian">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Kelola jadwal dan agenda ujian.</p>
        <button
          onClick={() => {
            setFormData(INITIAL_STATE);
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Agenda
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
        title={editingId ? 'Edit Agenda' : 'Tambah Agenda'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Agenda Ujian</label>
            <input
              required
              type="text"
              value={formData.agenda_ujian}
              onChange={e => setFormData({ ...formData, agenda_ujian: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Deskripsi Ujian</label>
            <textarea
              required
              value={formData.deskripsi_ujian}
              onChange={e => setFormData({ ...formData, deskripsi_ujian: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Jenis Tes</label>
            <input
              required
              type="text"
              value={formData.jenis_tes}
              onChange={e => setFormData({ ...formData, jenis_tes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Misal: UTS, UAS, Tryout"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Token Ujian</label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                value={formData.token_ujian}
                onChange={e => setFormData({ ...formData, token_ujian: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={generateToken}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                title="Generate Token"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tgl & Jam Mulai</label>
              <input
                required
                type="datetime-local"
                value={formData.tgljam_mulai}
                onChange={e => setFormData({ ...formData, tgljam_mulai: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tgl & Jam Selesai</label>
              <input
                required
                type="datetime-local"
                value={formData.tgljam_selesai}
                onChange={e => setFormData({ ...formData, tgljam_selesai: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
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

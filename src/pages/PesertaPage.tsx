import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Search, Trash2, Upload, FileDown, Download } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  // New Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPeserta = async () => {
    const querySnapshot = await getDocs(collection(db, 'Peserta'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Peserta));
    setData(items);
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  // Filtered Data Logic
  const filteredData = data.filter(item => {
    const matchSearch = item.nama_peserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSekolah = filterSekolah ? item.asal_sekolah === filterSekolah : true;
    return matchSearch && matchSekolah;
  });

  const uniqueSchools = Array.from(new Set(data.map(item => item.asal_sekolah))).filter(Boolean);

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

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} peserta terpilih?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'Peserta', id))));
        setSelectedIds([]);
        fetchPeserta();
        alert("Data terpilih berhasil dihapus");
      } catch (error) {
        console.error("Error deleting selected: ", error);
        alert("Gagal menghapus sebagian data");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data peserta? Tindakan ini tidak dapat dibatalkan.")) {
      const confirm2 = prompt("Ketik 'HAPUS' untuk mengonfirmasi:");
      if (confirm2 !== 'HAPUS') return;

      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'Peserta'));
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'Peserta', d.id)));
        await Promise.all(deletePromises);
        setSelectedIds([]);
        fetchPeserta();
        alert("Semua data berhasil dihapus");
      } catch (error) {
        console.error("Error deleting all: ", error);
        alert("Gagal menghapus semua data");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(data.map(({id, ...rest}) => rest));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Peserta");
    writeFile(wb, "Data_Peserta.xlsx");
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        username: 'user123',
        password: 'password123',
        nama_peserta: 'Nama Siswa',
        asal_sekolah: 'Nama Sekolah',
        jenjang_studi: 'SMA',
        kelas: '10 IPA 1',
        no_wa_peserta: '08123456789',
        no_wa_ortu: '08123456788'
      }
    ];
    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "Template_Peserta.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = read(arrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws) as any[];

      const promises = jsonData.map(item => {
        const newItem = {
          username: item.username || item.no_wa_peserta || '',
          password: item.password || '',
          nama_peserta: item.nama_peserta || '',
          asal_sekolah: item.asal_sekolah || '',
          jenjang_studi: item.jenjang_studi || '',
          kelas: item.kelas || '',
          no_wa_peserta: item.no_wa_peserta || '',
          no_wa_ortu: item.no_wa_ortu || ''
        };
        return addDoc(collection(db, 'Peserta'), newItem);
      });

      await Promise.all(promises);
      fetchPeserta();
      setIsImportModalOpen(false);
      alert(`Berhasil mengimpor ${jsonData.length} data.`);
    } catch (error) {
      console.error("Error importing: ", error);
      alert("Gagal mengimpor data. Pastikan format Excel benar.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <div className="space-y-4 mb-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-gray-600">Kelola data peserta ujian.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <FileDown className="h-4 w-4" /> Export Excel
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Upload className="h-4 w-4" /> Import Excel
            </button>
            <button
              onClick={() => {
                setFormData(INITIAL_STATE);
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" /> Tambah Peserta
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
            <select
              value={filterSekolah}
              onChange={(e) => setFilterSekolah(e.target.value)}
              className="w-full md:w-48 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(sekolah => (
                <option key={sekolah} value={sekolah}>{sekolah}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm border border-red-200"
              >
                <Trash2 className="h-4 w-4" /> Hapus Terpilih ({selectedIds.length})
              </button>
            )}
             <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-200"
              >
                <Trash2 className="h-4 w-4" /> Hapus Semua
              </button>
          </div>
        </div>
      </div>

      <Table
        data={filteredData}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        keyExtractor={(item) => item.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* CRUD Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Peserta' : 'Tambah Peserta'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* ... existing fields ... */}
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
              onChange={e => setFormData({ ...formData, no_wa_peserta: e.target.value, username: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500">Username akan otomatis disamakan dengan No. WA</p>
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

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Peserta"
      >
        <div className="space-y-6 p-2">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Langkah 1: Download Template</h4>
            <p className="text-sm text-blue-600 mb-3">
              Unduh template Excel berikut untuk memastikan format data sesuai dengan sistem.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" /> Download Template
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Langkah 2: Upload File</h4>
            <p className="text-sm text-gray-600 mb-3">
              Pilih file Excel yang sudah diisi dengan data peserta.
            </p>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100"
            />
            {loading && <p className="text-sm text-red-600 mt-2 font-medium">Sedang memproses import data...</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

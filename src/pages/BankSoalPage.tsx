import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Table } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Upload, Download } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';

interface BankSoal {
  id: string;
  agenda_id: string;
  mata_pelajaran: string;
  mapel_id?: string;
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
  [key: string]: any;
}

interface Agenda {
  id: string;
  agenda_ujian: string;
}

interface Mapel {
  id: string;
  mata_pelajaran: string;
  agenda_id?: string;
}

const INITIAL_STATE: any = {
  agenda_id: '',
  mata_pelajaran: '',
  mapel_id: '',
  type_soal: 'Pilihan Ganda Tunggal (PG)',
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

for (let i = 1; i <= 8; i++) {
  INITIAL_STATE[`pasangan_kiri_${i}`] = '';
  INITIAL_STATE[`pasangan_kanan_${i}`] = '';
  INITIAL_STATE[`pernyataan_${i}`] = '';
}

export function BankSoalPage() {
  const [data, setData] = useState<BankSoal[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [allMapels, setAllMapels] = useState<Mapel[]>([]);
  const [filteredMapels, setFilteredMapels] = useState<Mapel[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importAgendaId, setImportAgendaId] = useState('');
  const [importMapelId, setImportMapelId] = useState(''); // can be 'all'
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBankSoal = async () => {
    const querySnapshot = await getDocs(collection(db, 'Bank Soal'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankSoal));
    setData(items);
  };

  const fetchAgendas = async () => {
    const querySnapshot = await getDocs(collection(db, 'Agenda Ujian'));
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, agenda_ujian: doc.data().agenda_ujian } as Agenda));
    setAgendas(items);
  };

  const fetchMapels = async () => {
    const querySnapshot = await getDocs(collection(db, 'Mata Pelajaran'));
    const items = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      mata_pelajaran: doc.data().mata_pelajaran,
      agenda_id: doc.data().agenda_id 
    } as Mapel));
    setAllMapels(items);
  };

  useEffect(() => {
    fetchBankSoal();
    fetchAgendas();
    fetchMapels();
  }, []);

  useEffect(() => {
    if (formData.agenda_id) {
      const filtered = allMapels.filter(m => m.agenda_id === formData.agenda_id);
      setFilteredMapels(filtered);
    } else {
      setFilteredMapels([]);
    }
  }, [formData.agenda_id, allMapels]);

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

  const getKeyHint = (type: string) => {
    switch (type) {
      case 'Pilihan Ganda Tunggal (PG)': return 'Contoh: A';
      case 'Pilihan Ganda Kompleks (PK)': return 'Contoh: ACD (Jika jawaban benar A, C, dan D)';
      case 'Pilihan Benar/Salah (BS)': return 'Contoh: BBSSB (B=Benar, S=Salah)';
      case 'Pilihan Setuju/Tidak (ST)': return 'Contoh: SSTTS (S=Setuju, T=Tidak)';
      case 'Menjodohkan (MJ)': return 'Contoh: 1E2D3C4B5A';
      case 'Uraian (UR)': return 'Tuliskan jawaban singkat';
      default: return '';
    }
  };

  // Import Logic
  const handleDownloadTemplate = () => {
    if (!importAgendaId) {
      alert("Pilih Agenda terlebih dahulu");
      return;
    }
    if (!importMapelId) {
      alert("Pilih Mata Pelajaran terlebih dahulu");
      return;
    }

    const baseTemplate = {
      type_soal: 'Pilihan Ganda Tunggal (PG)',
      no_soal: 1,
      pertanyaan: 'Isi pertanyaan disini',
      gambar_url: '',
      pilihan_a: 'Opsi A',
      pilihan_b: 'Opsi B',
      pilihan_c: 'Opsi C',
      pilihan_d: 'Opsi D',
      pilihan_e: 'Opsi E',
      kunci_jawaban: 'A',
      pernyataan_1: '',
      pernyataan_2: '',
      pasangan_kiri_1: '',
      pasangan_kanan_1: '',
    };

    let templateData = [];
    if (importMapelId === 'all') {
       // Add 'Mata Pelajaran' column for clarity
       templateData = [{ mata_pelajaran: 'Matematika', ...baseTemplate }];
    } else {
       templateData = [baseTemplate];
    }

    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template_Soal");
    writeFile(wb, "Template_Bank_Soal.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importAgendaId || !importMapelId) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = read(arrayBuffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws) as any[];

      // Filter Mapels for this Agenda to find IDs
      const agendaMapels = allMapels.filter(m => m.agenda_id === importAgendaId);
      const mapelNameMap = new Map(agendaMapels.map(m => [m.mata_pelajaran.toLowerCase(), m.id]));
      const mapelIdMap = new Map(agendaMapels.map(m => [m.id, m.mata_pelajaran]));

      const promises = jsonData.map(item => {
        let targetMapelId = '';
        let targetMapelName = '';

        if (importMapelId === 'all') {
            // Try to find mapel by name in excel
            const excelMapelName = item.mata_pelajaran || '';
            targetMapelId = mapelNameMap.get(excelMapelName.toLowerCase().trim()) || '';
            targetMapelName = excelMapelName;
            
            if (!targetMapelId) {
                console.warn(`Mapel '${excelMapelName}' not found in Agenda. Skipping.`);
                return null; // Skip if mapel not found
            }
        } else {
            targetMapelId = importMapelId;
            targetMapelName = mapelIdMap.get(importMapelId) || '';
        }

        const newItem = { ...INITIAL_STATE, ...item };
        // Clean up undefined/null
        Object.keys(newItem).forEach(key => newItem[key] === undefined && delete newItem[key]);
        
        newItem.agenda_id = importAgendaId;
        newItem.mapel_id = targetMapelId;
        newItem.mata_pelajaran = targetMapelName;

        return addDoc(collection(db, 'Bank Soal'), newItem);
      });

      const validPromises = promises.filter(p => p !== null);
      await Promise.all(validPromises);

      fetchBankSoal();
      setIsImportModalOpen(false);
      alert(`Berhasil mengimpor ${validPromises.length} soal.`);
    } catch (error) {
      console.error("Error importing: ", error);
      alert("Gagal mengimpor data. Pastikan format Excel benar.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const columns = [
    { header: 'Mapel', accessor: 'mata_pelajaran' as keyof BankSoal },
    { header: 'No', accessor: 'no_soal' as keyof BankSoal },
    { header: 'Type', accessor: (item: BankSoal) => {
        const typeMap: {[key:string]: string} = {
            'Pilihan Ganda Tunggal (PG)': 'PG',
            'Pilihan Ganda Kompleks (PK)': 'PK',
            'Pilihan Benar/Salah (BS)': 'BS',
            'Pilihan Setuju/Tidak (ST)': 'ST',
            'Menjodohkan (MJ)': 'MJ',
            'Uraian (UR)': 'UR'
        };
        return typeMap[item.type_soal] || item.type_soal;
    }},
    { header: 'Pertanyaan', accessor: (item: BankSoal) => item.pertanyaan?.substring(0, 40) + '...' },
    { header: 'Kunci', accessor: 'kunci_jawaban' as keyof BankSoal },
  ];

  return (
    <Layout title="Bank Soal">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Kelola bank soal ujian.</p>
        <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" /> Import Excel
            </button>
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
      </div>

      <Table
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        keyExtractor={(item) => item.id}
      />

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Bank Soal"
      >
        <div className="space-y-6 p-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pilih Agenda</label>
                    <select
                        value={importAgendaId}
                        onChange={e => {
                            setImportAgendaId(e.target.value);
                            setImportMapelId('');
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                        <option value="">-- Pilih Agenda --</option>
                        {agendas.map(a => (
                            <option key={a.id} value={a.id}>{a.agenda_ujian}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pilih Mapel</label>
                    <select
                        disabled={!importAgendaId}
                        value={importMapelId}
                        onChange={e => setImportMapelId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                    >
                        <option value="">-- Pilih Mapel --</option>
                        <option value="all">Semua Mata Pelajaran</option>
                        {allMapels.filter(m => m.agenda_id === importAgendaId).map(m => (
                            <option key={m.id} value={m.id}>{m.mata_pelajaran}</option>
                        ))}
                    </select>
                </div>
             </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Langkah 1: Download Template</h4>
                <p className="text-sm text-blue-600 mb-3">
                    Sesuaikan template dengan pilihan Mapel Anda.
                </p>
                <button
                    onClick={handleDownloadTemplate}
                    disabled={!importMapelId}
                    className="flex items-center gap-2 bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    <Download className="h-4 w-4" /> Download Template
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Langkah 2: Upload File</h4>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleImport}
                    ref={fileInputRef}
                    disabled={!importMapelId}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700
                    hover:file:bg-red-100 disabled:opacity-50"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Soal' : 'Tambah Soal'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto px-2 pb-2">
          
          {/* Section 1: Agenda & Mapel */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Agenda Ujian</label>
              <select
                required
                value={formData.agenda_id}
                onChange={e => setFormData({ 
                    ...formData, 
                    agenda_id: e.target.value,
                    mata_pelajaran: '', // Reset mapel when agenda changes
                    mapel_id: ''
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Pilih Agenda</option>
                {agendas.map(agenda => (
                    <option key={agenda.id} value={agenda.id}>{agenda.agenda_ujian}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select
                required
                disabled={!formData.agenda_id}
                value={formData.mapel_id || (filteredMapels.find(m => m.mata_pelajaran === formData.mata_pelajaran)?.id || '')}
                onChange={e => {
                    const selected = filteredMapels.find(m => m.id === e.target.value);
                    setFormData({ 
                        ...formData, 
                        mapel_id: e.target.value,
                        mata_pelajaran: selected ? selected.mata_pelajaran : ''
                    });
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-200"
              >
                <option value="">Pilih Mapel</option>
                {filteredMapels.map((mapel) => (
                    <option key={mapel.id} value={mapel.id}>{mapel.mata_pelajaran}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type Soal</label>
                <select
                required
                value={formData.type_soal}
                onChange={e => setFormData({ ...formData, type_soal: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                <option value="Pilihan Ganda Tunggal (PG)">Pilihan Ganda Tunggal (PG)</option>
                <option value="Pilihan Ganda Kompleks (PK)">Pilihan Ganda Kompleks (PK)</option>
                <option value="Pilihan Benar/Salah (BS)">Pilihan Benar/Salah (BS)</option>
                <option value="Pilihan Setuju/Tidak (ST)">Pilihan Setuju/Tidak (ST)</option>
                <option value="Menjodohkan (MJ)">Menjodohkan (MJ)</option>
                <option value="Uraian (UR)">Uraian (UR)</option>
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
            <label className="text-sm font-medium text-gray-700">Pertanyaan</label>
            <textarea
              required
              value={formData.pertanyaan}
              onChange={e => setFormData({ ...formData, pertanyaan: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
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

          {/* Conditional Rendering based on Type Soal */}
          
          {/* Pilihan Ganda & Kompleks */}
          {(formData.type_soal === 'Pilihan Ganda Tunggal (PG)' || formData.type_soal === 'Pilihan Ganda Kompleks (PK)') && (
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-700">Pilihan Jawaban</h4>
                {['A', 'B', 'C', 'D', 'E'].map(opt => (
                     <div key={opt} className="flex items-center gap-2">
                        <span className="font-bold w-4">{opt}</span>
                        <input 
                            placeholder={`Pilihan ${opt}`} 
                            value={formData[`pilihan_${opt.toLowerCase()}`]} 
                            onChange={e => setFormData({ ...formData, [`pilihan_${opt.toLowerCase()}`]: e.target.value })} 
                            className="w-full rounded-lg border border-gray-300 px-3 py-2" 
                        />
                     </div>
                ))}
            </div>
          )}

          {/* Benar/Salah & Setuju/Tidak */}
          {(formData.type_soal === 'Pilihan Benar/Salah (BS)' || formData.type_soal === 'Pilihan Setuju/Tidak (ST)') && (
             <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-700">Pernyataan</h4>
                {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className="flex items-center gap-2">
                        <span className="text-sm font-bold w-6">{num}.</span>
                        <input 
                            placeholder={`Pernyataan ${num}`} 
                            value={formData[`pernyataan_${num}`]} 
                            onChange={e => setFormData({ ...formData, [`pernyataan_${num}`]: e.target.value })} 
                            className="w-full rounded-lg border border-gray-300 px-3 py-2" 
                        />
                    </div>
                ))}
             </div>
          )}

          {/* Menjodohkan */}
          {formData.type_soal === 'Menjodohkan (MJ)' && (
            <div className="grid grid-cols-1 gap-3 border p-4 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-700">Pasangan Jawaban</h4>
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="grid grid-cols-2 gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs font-bold">{num}.</span>
                    <input
                        placeholder={`Kiri ${num}`}
                        value={formData[`pasangan_kiri_${num}`]}
                        onChange={e => setFormData({ ...formData, [`pasangan_kiri_${num}`]: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="text-xs font-bold">{String.fromCharCode(64 + num)}.</span>
                    <input
                        placeholder={`Kanan ${num}`}
                        value={formData[`pasangan_kanan_${num}`]}
                        onChange={e => setFormData({ ...formData, [`pasangan_kanan_${num}`]: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <label className="text-sm font-medium text-gray-700">Kunci Jawaban</label>
            <input
              required
              type="text"
              value={formData.kunci_jawaban}
              onChange={e => setFormData({ ...formData, kunci_jawaban: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={getKeyHint(formData.type_soal)}
            />
            <p className="text-xs text-gray-500 italic">{getKeyHint(formData.type_soal)}</p>
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

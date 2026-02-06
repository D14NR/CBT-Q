import { Layout } from '@/components/Layout';
import { Users, Calendar, BookOpen, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

const cards = [
  { title: 'Peserta', icon: Users, to: '/admin/peserta', color: 'bg-blue-500' },
  { title: 'Agenda Ujian', icon: Calendar, to: '/admin/agenda', color: 'bg-green-500' },
  { title: 'Mata Pelajaran', icon: BookOpen, to: '/admin/mapel', color: 'bg-orange-500' },
  { title: 'Bank Soal', icon: FileQuestion, to: '/admin/bank-soal', color: 'bg-purple-500' },
];

export function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
          >
            <div className={`p-4 rounded-lg ${card.color} text-white`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{card.title}</h3>
              <p className="text-sm text-gray-500">Kelola Data</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Selamat Datang di Panel Admin CBT</h3>
        <p className="text-gray-600">
          Silakan gunakan menu di samping untuk mengelola data Peserta, Agenda Ujian, Mata Pelajaran, dan Bank Soal.
        </p>
      </div>
    </Layout>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Student Pages
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentRegisterPage } from './pages/StudentRegisterPage';
import { StudentExamListPage } from './pages/StudentExamListPage';
import { StudentExamPage } from './pages/StudentExamPage';

// Admin Pages
import { AdminLoginPage } from './pages/AdminLoginPage';
import { Dashboard } from './pages/Dashboard';
import { PesertaPage } from './pages/PesertaPage';
import { AgendaPage } from './pages/AgendaPage';
import { MapelPage } from './pages/MapelPage';
import { BankSoalPage } from './pages/BankSoalPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/ujian" element={<StudentExamListPage />} />
        <Route path="/ujian/:agendaId" element={<StudentExamPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/peserta" element={<PesertaPage />} />
        <Route path="/admin/agenda" element={<AgendaPage />} />
        <Route path="/admin/mapel" element={<MapelPage />} />
        <Route path="/admin/bank-soal" element={<BankSoalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

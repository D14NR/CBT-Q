import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PesertaPage } from './pages/PesertaPage';
import { AgendaPage } from './pages/AgendaPage';
import { MapelPage } from './pages/MapelPage';
import { BankSoalPage } from './pages/BankSoalPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/peserta" element={<PesertaPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/mapel" element={<MapelPage />} />
        <Route path="/bank-soal" element={<BankSoalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

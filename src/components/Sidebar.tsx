import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BookOpen, FileQuestion } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/peserta', icon: Users, label: 'Peserta' },
    { to: '/agenda', icon: Calendar, label: 'Agenda Ujian' },
    { to: '/mapel', icon: BookOpen, label: 'Mata Pelajaran' },
    { to: '/bank-soal', icon: FileQuestion, label: 'Bank Soal' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-red-700 text-white shadow-xl z-50">
      <div className="flex h-16 items-center justify-center border-b border-red-600">
        <h1 className="text-xl font-bold tracking-wider">CBT APP</h1>
      </div>
      <nav className="mt-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-red-700 shadow-md"
                  : "text-red-100 hover:bg-red-600 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-4 left-0 w-full px-4 text-center text-xs text-red-200">
        &copy; 2024 CBT App
      </div>
    </aside>
  );
}

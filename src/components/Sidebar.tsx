import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BookOpen, FileQuestion, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Sidebar() {
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/peserta', icon: Users, label: 'Peserta' },
    { to: '/admin/agenda', icon: Calendar, label: 'Agenda Ujian' },
    { to: '/admin/mapel', icon: BookOpen, label: 'Mata Pelajaran' },
    { to: '/admin/bank-soal', icon: FileQuestion, label: 'Bank Soal' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-red-700 text-white shadow-xl z-50 flex flex-col">
      <div className="flex h-16 items-center justify-center border-b border-red-600">
        <h1 className="text-xl font-bold tracking-wider">CBT ADMIN</h1>
      </div>
      <nav className="mt-4 px-2 space-y-1 flex-1">
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
      <div className="p-4 border-t border-red-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-800 hover:bg-red-900 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
      <div className="pb-4 px-4 text-center text-xs text-red-200">
        &copy; 2024 CBT App
      </div>
    </aside>
  );
}

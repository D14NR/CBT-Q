import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center px-8 border-b border-gray-200 sticky top-0 z-40">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

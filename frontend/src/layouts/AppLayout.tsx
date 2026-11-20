import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SmartShield AI. Dedicated to safe digital payments in India.</p>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Official Portal: cybercrime.gov.in</span>
            <span className="text-red-500 font-medium">Helpline: 1930</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, PhoneCall, AlertTriangle, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Investigate', path: '/investigate' },
    { label: 'Before-You-Pay', path: '/before-you-pay' },
    { label: 'Emergency', path: '/emergency' },
    { label: 'Scam Discovery', path: '/discovery' },
    { label: 'Recovery', path: '/recovery' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 apple-blur border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-apple-sm bg-accent flex items-center justify-center text-white shadow-subtle group-hover:bg-accent-hover transition-colors">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground">SmartShield</span>
            <span className="text-xs font-semibold text-accent ml-1 px-1.5 py-0.5 rounded bg-accent-subtle">AI</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive(link.path)
                  ? 'bg-foreground text-white'
                  : 'text-muted hover:text-foreground hover:bg-black/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action: Emergency 1930 & Profile */}
        <div className="flex items-center gap-3">
          <Link
            to="/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>1930 Helpline</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground hidden sm:inline">{user.full_name}</span>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => demoLogin()}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-surface text-foreground hover:bg-gray-50 transition-colors"
              >
                Demo Login
              </button>
              <Link
                to="/login"
                className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors shadow-subtle"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

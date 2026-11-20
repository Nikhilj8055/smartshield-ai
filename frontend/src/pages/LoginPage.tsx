import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    const success = await demoLogin();
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Demo login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-apple-sm bg-accent text-white flex items-center justify-center mx-auto shadow-subtle">
          <Shield className="w-5 h-5 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In to SmartShield AI</h1>
        <p className="text-xs text-muted">Access your investigations and protected safety profiles</p>
      </div>

      <div className="bg-surface rounded-apple border border-border p-6 sm:p-8 shadow-subtle space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-apple-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-apple-sm text-xs text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs text-muted uppercase tracking-wider"><span className="bg-surface px-2">or</span></div>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="w-full py-2.5 rounded-full border border-border bg-background text-foreground text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>One-Click Demo Login (Priya Sharma)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <p className="text-center text-xs text-muted pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

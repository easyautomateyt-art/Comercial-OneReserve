import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await api.login({ username, password });
      onLogin(user);
    } catch (err) {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-app-bg flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md bg-app-surface border border-app-accent/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-app-accent/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            OneReserve<span className="text-app-accent">.Comercial</span>
          </h1>
          <p className="text-app-muted text-sm uppercase tracking-widest">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-app-accent uppercase tracking-wider">Identificador</label>
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario..."
                className="w-full bg-app-bg border border-app-accent/30 rounded-lg p-3 pl-10 text-white outline-none focus:border-app-accent transition-colors"
              />
              <UserIcon size={18} className="absolute left-3 top-3.5 text-app-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-accent uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-app-bg border border-app-accent/30 rounded-lg p-3 pl-10 text-white outline-none focus:border-app-accent transition-colors"
              />
              <Lock size={18} className="absolute left-3 top-3.5 text-app-muted" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="mt-8 space-y-3">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-app-accent text-app-bg font-bold py-3 rounded-xl shadow-lg hover:bg-[#33F1EE] active:scale-[0.98] transition-all flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Acceder'}
            </button>
            
            <button 
              type="button"
              onClick={() => onLogin({ id: 'demo', username: 'demo', name: 'Usuario Demo', role: 'commercial', password: '' })}
              className="w-full bg-app-surface border border-app-accent/30 text-app-muted hover:text-white hover:border-app-accent font-bold py-3 rounded-xl transition-all text-sm"
            >
              Entrar en Modo Demo (Offline)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

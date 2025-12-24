import React from 'react';
import { MapPin, List, PlusCircle, BarChart3, Users, LogOut } from 'lucide-react';
import { AppView, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, user }) => {
  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-none p-4 border-b border-app-accent/20 flex justify-between items-center bg-app-bg z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            OneReserve<span className="text-app-accent">.Comercial</span>
          </h1>
          <p className="text-[10px] text-app-muted uppercase tracking-widest">Fuerza de Ventas</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-app-accent/10 border border-app-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,232,229,0.2)]">
                <span className="text-app-accent font-bold text-xs">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                </span>
            </div>
            <button 
                onClick={onLogout}
                className="text-app-muted hover:text-red-400 transition-colors p-1"
                title="Cerrar Sesión"
            >
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-app-bg">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-app-surface border-t border-app-accent/20 safe-area-bottom z-20">
        <div className="flex justify-around items-center p-2">
          <NavButton 
            active={currentView === AppView.DASHBOARD} 
            onClick={() => onChangeView(AppView.DASHBOARD)}
            icon={<BarChart3 size={22} />}
            label="Inicio"
          />
           <NavButton 
            active={currentView === AppView.CLIENTS || currentView === AppView.CLIENT_FOLDER} 
            onClick={() => onChangeView(AppView.CLIENTS)}
            icon={<Users size={22} />}
            label="Clientes"
          />
          <div className="-mt-8">
            <button 
                onClick={() => onChangeView(AppView.NEW_VISIT)}
                className="bg-app-accent text-app-bg p-3.5 rounded-full shadow-[0_0_15px_rgba(0,232,229,0.5)] hover:shadow-[0_0_25px_rgba(0,232,229,0.7)] transition-all transform hover:scale-105 active:scale-95 border-2 border-app-bg"
            >
                <PlusCircle size={30} strokeWidth={2.5} />
            </button>
          </div>
          <NavButton 
            active={currentView === AppView.EXPLORE} 
            onClick={() => onChangeView(AppView.EXPLORE)}
            icon={<MapPin size={22} />}
            label="Mapa"
          />
          <NavButton 
            active={currentView === AppView.HISTORY} 
            onClick={() => onChangeView(AppView.HISTORY)}
            icon={<List size={22} />}
            label="Historial"
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 w-16 transition-all duration-200 ${active ? 'text-app-accent scale-110' : 'text-app-muted hover:text-white'}`}
  >
    {icon}
    <span className="text-[9px] mt-1 font-medium tracking-wide">{label}</span>
  </button>
);

export default Layout;
import React from 'react';
import { Client, VisitReport, User } from '../types';
import { BarChart3, Users, MapPin, DollarSign, TrendingUp, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  clients: Client[];
  visits: VisitReport[];
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ clients, visits, user, onLogout }) => {
  const totalExpenses = visits.reduce((acc, v) => {
    return acc + (v.expensesAdded?.reduce((s, e) => s + e.amount, 0) || 0);
  }, 0);

  const accepted = visits.filter(v => v.status === 'aceptado').length;
  const rejected = visits.filter(v => v.status === 'rechazado').length;
  const proposals = visits.filter(v => v.status === 'propuesta').length;

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-app-accent/20 bg-app-surface sticky top-0 z-10 flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white">Panel Directivo</h1>
           <p className="text-app-muted text-sm">Bienvenido, {user.name}</p>
        </div>
        <button onClick={onLogout} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm font-bold border border-red-900/50 p-2 rounded-lg bg-red-900/10">
            <LogOut size={16} /> Salir
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                <div className="flex items-center gap-2 text-app-accent mb-2">
                    <Users size={20} />
                    <span className="text-xs uppercase font-bold tracking-wider">Total Clientes</span>
                </div>
                <span className="text-3xl font-bold text-white">{clients.length}</span>
            </div>
            <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                <div className="flex items-center gap-2 text-app-accent mb-2">
                    <MapPin size={20} />
                    <span className="text-xs uppercase font-bold tracking-wider">Visitas Totales</span>
                </div>
                <span className="text-3xl font-bold text-white">{visits.length}</span>
            </div>
            <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                <div className="flex items-center gap-2 text-app-accent mb-2">
                    <TrendingUp size={20} />
                    <span className="text-xs uppercase font-bold tracking-wider">Tasa Cierre</span>
                </div>
                <span className="text-3xl font-bold text-white">
                    {visits.length > 0 ? Math.round((accepted / visits.length) * 100) : 0}%
                </span>
            </div>
            <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                <div className="flex items-center gap-2 text-app-accent mb-2">
                    <DollarSign size={20} />
                    <span className="text-xs uppercase font-bold tracking-wider">Gastos Equipo</span>
                </div>
                <span className="text-3xl font-bold text-white">{totalExpenses.toFixed(0)}€</span>
            </div>
        </div>

        {/* Pipeline Chart Simulation */}
        <div className="bg-app-surface p-6 rounded-xl border border-app-accent/10">
            <h3 className="text-lg font-bold text-white mb-4">Estado del Pipeline</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm text-white mb-1">
                        <span>Aceptados</span>
                        <span>{accepted}</span>
                    </div>
                    <div className="w-full bg-app-bg rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(accepted / (visits.length || 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm text-white mb-1">
                        <span>En Propuesta</span>
                        <span>{proposals}</span>
                    </div>
                    <div className="w-full bg-app-bg rounded-full h-3">
                        <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${(proposals / (visits.length || 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm text-white mb-1">
                        <span>Rechazados</span>
                        <span>{rejected}</span>
                    </div>
                    <div className="w-full bg-app-bg rounded-full h-3">
                        <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(rejected / (visits.length || 1)) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Global Activity Feed */}
        <div>
            <h3 className="text-lg font-bold text-white mb-4">Actividad Reciente del Equipo</h3>
            <div className="space-y-3">
                {visits.slice(0, 10).map(visit => (
                    <div key={visit.id} className="bg-app-surface p-4 rounded-lg flex justify-between items-start border-l-4 border-l-app-accent">
                        <div>
                            <p className="font-bold text-white">{visit.placeName}</p>
                            <p className="text-sm text-app-muted truncate max-w-xs">"{visit.feedback}"</p>
                            <div className="mt-1 flex gap-2">
                                <span className="text-[10px] bg-app-bg px-2 py-1 rounded text-white">{new Date(visit.timestamp).toLocaleDateString()}</span>
                                {visit.voiceNotes && visit.voiceNotes.length > 0 && (
                                    <span className="text-[10px] bg-app-accent/20 text-app-accent px-2 py-1 rounded">🎤 Audio</span>
                                )}
                            </div>
                        </div>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                            visit.status === 'aceptado' ? 'bg-green-900 text-green-400' : 
                            visit.status === 'rechazado' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'
                        }`}>
                            {visit.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
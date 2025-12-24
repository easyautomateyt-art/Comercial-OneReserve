import React from 'react';
import { VisitReport } from '../types';
import { TrendingUp, MapPin, Clock } from 'lucide-react';

interface DashboardProps {
  visits: VisitReport[];
  onViewDetails: (visit: VisitReport) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ visits, onViewDetails }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysVisits = visits.filter(v => v.timestamp >= today.getTime());
  const positiveCount = visits.filter(v => v.status === 'aceptado').length;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-app-surface to-app-bg border border-app-accent/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-app-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-white mb-1">Hola, Comercial</h2>
        <p className="text-app-muted text-sm">Aquí tienes el resumen de tu jornada.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-white mb-1">{todaysVisits.length}</span>
            <span className="text-xs text-app-muted uppercase tracking-widest font-semibold">Visitas Hoy</span>
        </div>
        <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-app-accent mb-1">
                <span className="text-4xl font-bold">{positiveCount}</span>
                <TrendingUp size={20} />
            </div>
            <span className="text-xs text-app-muted uppercase tracking-widest font-semibold">Aceptados</span>
        </div>
      </div>

      {/* Recent List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-app-accent" />
            Recientes
        </h3>
        <div className="space-y-3">
          {visits.length === 0 ? (
            <div className="text-center p-8 bg-app-surface/50 rounded-xl border border-dashed border-app-muted/30">
                <p className="text-app-muted">No has registrado visitas aún.</p>
            </div>
          ) : (
            visits.slice(0, 5).map(visit => (
              <div 
                key={visit.id} 
                onClick={() => onViewDetails(visit)}
                className="bg-app-surface p-4 rounded-xl border-l-4 border-l-app-accent hover:bg-app-surface/80 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-white group-hover:text-app-accent transition-colors">{visit.placeName}</h4>
                        <p className="text-xs text-app-muted flex items-center gap-1 mt-1">
                            <MapPin size={12} />
                            {visit.placeAddress}
                        </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        visit.status === 'aceptado' ? 'bg-green-900/50 text-green-400' :
                        visit.status === 'rechazado' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                    }`}>
                        {visit.status || 'Propuesta'}
                    </span>
                </div>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2 italic">"{visit.feedback}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
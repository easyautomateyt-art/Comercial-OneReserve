import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ExploreMap from './components/ExploreMap';
import VisitForm from './components/VisitForm';
import ClientFolder from './components/ClientFolder';
import { AppView, VisitReport, Place, Client, User } from './types';
import { Loader2, Folder, Search, UserPlus, Users } from 'lucide-react';
import { api } from './services/api';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Selection States
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [visitMode, setVisitMode] = useState<'create' | 'existing' | null>(null);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.id === 'demo') {
        const savedClients = localStorage.getItem('demo_clients');
        const savedVisits = localStorage.getItem('demo_visits');
        if (savedClients) setClients(JSON.parse(savedClients));
        if (savedVisits) setVisits(JSON.parse(savedVisits));
        return;
      }

      try {
        const [fetchedClients, fetchedVisits] = await Promise.all([
          api.getClients(),
          api.getVisits()
        ]);
        setClients(fetchedClients);
        setVisits(fetchedVisits);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };

    if (currentUser) {
      loadData();
    }

    const savedUser = localStorage.getItem('one_reserve_user');
    if (savedUser && !currentUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? AppView.ADMIN_DASHBOARD : AppView.DASHBOARD);
    }
    
    navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied")
    );

    setTimeout(() => setIsInitializing(false), 1500); 
  }, [currentUser]);

  useEffect(() => {
      if(currentUser) {
          localStorage.setItem('one_reserve_user', JSON.stringify(currentUser));
          if (currentUser.id === 'demo') {
              localStorage.setItem('demo_clients', JSON.stringify(clients));
              localStorage.setItem('demo_visits', JSON.stringify(visits));
          }
      }
      else localStorage.removeItem('one_reserve_user');
  }, [currentUser, clients, visits]);

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? AppView.ADMIN_DASHBOARD : AppView.DASHBOARD);
  };

  const handleLogout = () => {
      localStorage.removeItem('one_reserve_user');
      setCurrentUser(null);
      setCurrentView(AppView.LOGIN);
      window.location.reload(); // Force clean state
  };

  const handleSaveVisit = async (report: VisitReport, updatedClientData?: Partial<Client>) => {
    try {
      // 1. Update or Create Client
      let client = clients.find(c => c.id === report.clientId) || clients.find(c => c.name === report.placeName);
      let savedClient: Client;

      if (client) {
          // Update existing client
          const updatedClient: Client = {
              ...client,
              ...updatedClientData,
              phones: [...(client.phones || []), ...(updatedClientData?.phones || [])].filter((v,i,a) => a.indexOf(v)===i),
              emails: [...(client.emails || []), ...(updatedClientData?.emails || [])].filter((v,i,a) => a.indexOf(v)===i),
              
              visitIds: [...client.visitIds, report.id],
              totalTimeSpentMinutes: client.totalTimeSpentMinutes + report.durationMinutes,
          };
          
          if (currentUser?.id === 'demo') {
              savedClient = updatedClient;
          } else {
              savedClient = await api.updateClient(updatedClient);
          }
          setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
      } else {
          // Create new client
          const newClient: Client = {
              id: crypto.randomUUID(),
              name: report.placeName,
              address: report.placeAddress,
              location: report.location,
              contactName: updatedClientData?.contactName || '',
              phones: updatedClientData?.phones || [],
              emails: updatedClientData?.emails || [],
              totalTimeSpentMinutes: report.durationMinutes,
              expenses: [],
              documents: [],
              visitIds: [report.id]
          };
          
          if (currentUser?.id === 'demo') {
              savedClient = newClient;
          } else {
              savedClient = await api.createClient(newClient);
          }
          setClients(prev => [savedClient, ...prev]);
      }

      // 2. Save Visit
      const visitToSave = { ...report, clientId: savedClient.id };
      
      if (currentUser?.id === 'demo') {
          setVisits(prev => [visitToSave, ...prev]);
      } else {
          const savedVisit = await api.createVisit(visitToSave);
          setVisits(prev => [savedVisit, ...prev]);
      }

      // Reset states
      setCurrentView(AppView.DASHBOARD);
      setSelectedPlace(null);
      setSelectedClient(null);
      setVisitMode(null);
    } catch (error) {
      console.error("Failed to save visit", error);
      alert("Error al guardar la visita");
    }
  };

  const handleCheckInFromMap = (place: Place) => {
    setSelectedPlace(place);
    setSelectedClient(null);
    setVisitMode('create');
    setCurrentView(AppView.NEW_VISIT);
  };

  const handleOpenClient = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
          setSelectedClient(client);
          setCurrentView(AppView.CLIENT_FOLDER);
      }
  };

  const handleNewVisitForClient = (client: Client) => {
      setSelectedClient(client);
      setVisitMode('existing');
      setCurrentView(AppView.NEW_VISIT);
  };

  const updateClient = (updated: Client) => {
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedClient(updated);
  };

  // Logic for the Main Plus Button reset
  const handleMainPlusClick = () => {
      setSelectedClient(null);
      setSelectedPlace(null);
      setVisitMode(null); // Will trigger selection screen
      setCurrentView(AppView.NEW_VISIT);
  };

  const handleViewVisitDetails = (visit: VisitReport) => {
    const client = clients.find(c => c.id === visit.clientId);
    if (client) {
      setSelectedClient(client);
      setCurrentView(AppView.CLIENT_FOLDER);
    }
  };

  if (isInitializing) {
    return (
        <div className="h-screen w-screen bg-app-bg flex items-center justify-center flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-white animate-pulse">
            OneReserve<span className="text-app-accent">.Comercial</span>
          </h1>
          <Loader2 className="text-app-accent animate-spin" size={32} />
        </div>
    )
  }

  // --- VIEW RENDERING ---

  if (!currentUser || currentView === AppView.LOGIN) {
      return <Login onLogin={handleLogin} />;
  }

  // Admin View
  if (currentUser.role === 'admin' && currentView === AppView.ADMIN_DASHBOARD) {
      return <AdminDashboard clients={clients} visits={visits} user={currentUser} onLogout={handleLogout} />;
  }

  // Commercial View
  return (
    <Layout 
      currentView={currentView} 
      onChangeView={(v) => {
          if(v === AppView.NEW_VISIT) handleMainPlusClick();
          else setCurrentView(v);
      }}
      onLogout={handleLogout}
      user={currentUser}
    >
      
      {currentView === AppView.DASHBOARD && (
        <Dashboard 
            visits={visits} 
            onViewDetails={handleViewVisitDetails} 
        />
      )}
      
      {currentView === AppView.EXPLORE && (
        <ExploreMap 
            onCheckIn={handleCheckInFromMap} 
            onOpenClient={handleOpenClient}
            clients={clients}
        />
      )}
      
      {currentView === AppView.NEW_VISIT && (
        <>
            {/* If no mode selected, show selection screen */}
            {!visitMode && (
                <div className="p-6 h-full flex flex-col justify-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">¿Qué tipo de visita es?</h2>
                    
                    <button 
                        onClick={() => setVisitMode('create')}
                        className="bg-app-surface border border-app-accent/20 p-6 rounded-xl mb-4 flex items-center gap-4 hover:bg-app-accent/10 transition-all group"
                    >
                        <div className="w-12 h-12 bg-app-accent/20 text-app-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UserPlus size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-white text-lg">Nuevo Cliente</h3>
                            <p className="text-sm text-app-muted">Dar de alta un nuevo negocio</p>
                        </div>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-app-accent/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                        <span className="px-2 bg-app-bg text-sm text-app-muted">O</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-app-muted text-sm font-bold uppercase mb-2">Buscar Cliente Existente</h3>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                            {clients.length === 0 && <p className="text-center text-app-muted py-4">No tienes clientes aún.</p>}
                            {clients.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => handleNewVisitForClient(c)}
                                    className="w-full bg-app-surface p-3 rounded-lg border border-app-accent/10 flex items-center justify-between hover:border-app-accent/50 transition-colors"
                                >
                                    <span className="text-white font-medium">{c.name}</span>
                                    <Users size={16} className="text-app-muted"/>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* If mode selected, show form */}
            {visitMode && (
                <VisitForm 
                    initialPlace={selectedPlace}
                    existingClient={visitMode === 'existing' ? selectedClient : null}
                    onSave={handleSaveVisit}
                    onCancel={() => setCurrentView(AppView.DASHBOARD)}
                    userLocation={userLocation}
                />
            )}
        </>
      )}

      {currentView === AppView.CLIENTS && (
          <div className="p-4 space-y-4">
               <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <Folder className="text-app-accent"/> Mis Clientes
               </h2>
               <div className="space-y-3">
                   {clients.length === 0 && (
                       <p className="text-app-muted text-center py-10">No hay clientes registrados.</p>
                   )}
                   {clients.map(client => (
                       <div 
                        key={client.id}
                        onClick={() => handleOpenClient(client.id)}
                        className="bg-app-surface p-4 rounded-xl border border-app-accent/10 flex items-center justify-between hover:bg-app-surface/80 cursor-pointer"
                       >
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-app-accent/10 rounded-full flex items-center justify-center text-app-accent font-bold">
                                   {client.name.charAt(0)}
                               </div>
                               <div>
                                   <h3 className="font-bold text-white">{client.name}</h3>
                                   <p className="text-xs text-app-muted">{client.address}</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <span className="text-lg font-bold text-white block">{client.totalTimeSpentMinutes}m</span>
                               <span className="text-[10px] text-app-muted uppercase">Tiempo Total</span>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}

      {currentView === AppView.CLIENT_FOLDER && selectedClient && (
          <ClientFolder 
            client={selectedClient} 
            visits={visits}
            onBack={() => setCurrentView(AppView.CLIENTS)} 
            onUpdateClient={updateClient}
            onNewVisit={handleNewVisitForClient}
            isDemo={currentUser?.id === 'demo'}
          />
      )}

      {currentView === AppView.HISTORY && (
        <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Historial Completo</h2>
            <div className="space-y-4">
                {visits.map(v => (
                     <div 
                        key={v.id} 
                        onClick={() => handleViewVisitDetails(v)}
                        className="bg-app-surface p-4 rounded-xl border border-app-accent/10 cursor-pointer hover:bg-app-surface/80 transition-colors"
                     >
                        <div className="flex justify-between">
                            <h3 className="font-bold text-white">{v.placeName}</h3>
                            <span className="text-xs text-app-muted">{new Date(v.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-app-text mt-2 text-sm line-clamp-2">{v.feedback}</p>
                        <div className="mt-2 flex gap-2">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                                v.status === 'aceptado' ? 'bg-green-900/50 text-green-400' :
                                v.status === 'rechazado' ? 'bg-red-900/50 text-red-400' :
                                'bg-yellow-900/50 text-yellow-400'
                            }`}>
                                {v.status}
                            </span>
                        </div>
                     </div>
                ))}
            </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
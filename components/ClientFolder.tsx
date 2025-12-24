import React, { useState } from 'react';
import { ArrowLeft, Clock, DollarSign, FileText, Calendar, Plus, MapPin, PlayCircle, Phone, Mail, User, Mic, MessageCircle } from 'lucide-react';
import { Client, Expense, ClientDoc, VisitReport, Contact } from '../types';
import { api } from '../services/api';

interface ClientFolderProps {
  client: Client;
  visits?: VisitReport[]; // Pass all visits to filter history
  onBack: () => void;
  onUpdateClient: (updatedClient: Client) => void;
  onNewVisit: (client: Client) => void;
}

const ClientFolder: React.FC<ClientFolderProps> = ({ client, visits = [], onBack, onUpdateClient, onNewVisit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'docs' | 'expenses' | 'contacts'>('overview');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '', email: '' });

  const clientVisits = visits.filter(v => v.clientId === client.id).sort((a,b) => b.timestamp - a.timestamp);

  const handleAddDoc = () => {
      const docTypes = ['Factura', 'Catálogo', 'Contrato', 'Presupuesto'];
      const randomType = docTypes[Math.floor(Math.random() * docTypes.length)];
      const newDoc: ClientDoc = {
          id: crypto.randomUUID(),
          name: `${randomType} - ${new Date().toLocaleDateString()}`,
          type: 'pdf',
          date: Date.now()
      };
      onUpdateClient({
          ...client,
          documents: [newDoc, ...client.documents]
      });
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addedContact = await api.addContact(client.id, newContact);
      onUpdateClient({
        ...client,
        contacts: [...(client.contacts || []), addedContact]
      });
      setShowAddContact(false);
      setNewContact({ name: '', role: '', phone: '', email: '' });
    } catch (error) {
      console.error("Failed to add contact", error);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="bg-app-surface border-b border-app-accent/20 p-4 pb-6">
        <button onClick={onBack} className="text-app-muted hover:text-white mb-4 flex items-center gap-1">
            <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                <p className="text-app-muted flex items-center gap-1 mt-1 text-sm">
                    <MapPin size={14} /> {client.address}
                </p>
            </div>
            <div className="w-12 h-12 bg-app-accent text-app-bg rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(0,232,229,0.3)]">
                {client.name.substring(0, 2).toUpperCase()}
            </div>
        </div>

        {/* Contact Info Chips */}
        <div className="flex flex-wrap gap-2">
            {client.contactName && (
                <div className="flex items-center gap-1 bg-app-bg/50 px-3 py-1.5 rounded-full border border-app-accent/10">
                    <User size={12} className="text-app-accent"/> <span className="text-xs text-white">{client.contactName}</span>
                </div>
            )}
            {client.phones.map((p, i) => (
                <a key={i} href={`tel:${p}`} className="flex items-center gap-1 bg-app-bg/50 px-3 py-1.5 rounded-full border border-app-accent/10 hover:border-app-accent/50 transition-colors">
                    <Phone size={12} className="text-app-accent"/> <span className="text-xs text-white">{p}</span>
                </a>
            ))}
            {client.emails.map((e, i) => (
                <a key={i} href={`mailto:${e}`} className="flex items-center gap-1 bg-app-bg/50 px-3 py-1.5 rounded-full border border-app-accent/10 hover:border-app-accent/50 transition-colors">
                    <Mail size={12} className="text-app-accent"/> <span className="text-xs text-white">{e}</span>
                </a>
            ))}
        </div>
        
        {/* New Visit Quick Action */}
        <div className="mt-6">
            <button 
                onClick={() => onNewVisit(client)}
                className="w-full bg-app-accent text-app-bg font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-[#33F1EE] transition-colors"
            >
                <PlayCircle size={20} />
                Registrar Nueva Visita
            </button>
        </div>
      </div>

      {/* Tabs - Sticky */}
      <div className="flex bg-app-surface border-b border-app-accent/10 sticky top-0 z-20 overflow-x-auto no-scrollbar">
          {(['overview', 'history', 'docs', 'expenses', 'contacts'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 p-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-4 ${activeTab === tab ? 'border-app-accent text-app-accent' : 'border-transparent text-app-muted'}`}
            >
                {tab === 'overview' ? 'Resumen' : tab === 'history' ? 'Historial' : tab === 'docs' ? 'Docs' : tab === 'expenses' ? 'Gastos' : 'Contactos'}
            </button>
          ))}
      </div>

      {/* Content */}
      <div className="p-4 bg-app-bg pb-20">
          
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">Personas de Contacto</h3>
                <button onClick={() => setShowAddContact(!showAddContact)} className="text-app-accent text-sm flex items-center gap-1">
                  <Plus size={16} /> Añadir
                </button>
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContact} className="bg-app-surface p-4 rounded-xl border border-app-accent/20 mb-4 space-y-3">
                  <input 
                    placeholder="Nombre" 
                    value={newContact.name}
                    onChange={e => setNewContact({...newContact, name: e.target.value})}
                    className="w-full bg-app-bg border border-app-accent/20 rounded p-2 text-white text-sm"
                    required
                  />
                  <input 
                    placeholder="Cargo / Rol" 
                    value={newContact.role}
                    onChange={e => setNewContact({...newContact, role: e.target.value})}
                    className="w-full bg-app-bg border border-app-accent/20 rounded p-2 text-white text-sm"
                    required
                  />
                  <input 
                    placeholder="Teléfono" 
                    value={newContact.phone}
                    onChange={e => setNewContact({...newContact, phone: e.target.value})}
                    className="w-full bg-app-bg border border-app-accent/20 rounded p-2 text-white text-sm"
                  />
                  <input 
                    placeholder="Email" 
                    value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})}
                    className="w-full bg-app-bg border border-app-accent/20 rounded p-2 text-white text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setShowAddContact(false)} className="text-app-muted text-xs">Cancelar</button>
                    <button type="submit" className="bg-app-accent text-app-bg px-3 py-1 rounded text-xs font-bold">Guardar</button>
                  </div>
                </form>
              )}

              {client.contacts?.map(contact => (
                <div key={contact.id} className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold">{contact.name}</h4>
                      <p className="text-app-muted text-xs">{contact.role}</p>
                    </div>
                    <div className="flex gap-2">
                      {contact.phone && (
                        <>
                          <a href={`tel:${contact.phone}`} className="p-2 bg-app-bg rounded-full text-app-accent hover:bg-app-accent hover:text-app-bg transition-colors">
                            <Phone size={16} />
                          </a>
                          <a href={`https://wa.me/${contact.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="p-2 bg-app-bg rounded-full text-green-400 hover:bg-green-400 hover:text-black transition-colors">
                            <MessageCircle size={16} />
                          </a>
                        </>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="p-2 bg-app-bg rounded-full text-blue-400 hover:bg-blue-400 hover:text-black transition-colors">
                          <Mail size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {contact.phone && <p className="text-xs text-app-muted flex items-center gap-2"><Phone size={12}/> {contact.phone}</p>}
                    {contact.email && <p className="text-xs text-app-muted flex items-center gap-2"><Mail size={12}/> {contact.email}</p>}
                  </div>
                </div>
              ))}
              {(!client.contacts || client.contacts.length === 0) && (
                <p className="text-app-muted text-center text-sm py-4">No hay contactos registrados.</p>
              )}
            </div>
          )}
          
          {activeTab === 'overview' && (
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                          <div className="flex items-center gap-2 text-app-muted mb-2 text-xs uppercase tracking-wider">
                              <Clock size={14} /> Tiempo Total
                          </div>
                          <span className="text-2xl font-bold text-white">{client.totalTimeSpentMinutes} <span className="text-sm font-normal text-app-muted">min</span></span>
                      </div>
                      <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                          <div className="flex items-center gap-2 text-app-muted mb-2 text-xs uppercase tracking-wider">
                              <Calendar size={14} /> Visitas
                          </div>
                          <span className="text-2xl font-bold text-white">{client.visitIds.length}</span>
                      </div>
                  </div>

                  <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                      <h3 className="font-bold text-white mb-3">Última Actividad</h3>
                      {clientVisits.length > 0 ? (
                           <p className="text-app-muted text-sm italic">
                            Visita el {new Date(clientVisits[0].timestamp).toLocaleDateString()} - <span className="text-app-accent">{clientVisits[0].status}</span>
                           </p>
                      ) : (
                          <p className="text-app-muted text-sm italic">Sin actividad reciente.</p>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'history' && (
              <div className="space-y-4">
                  {clientVisits.length === 0 && <p className="text-center text-app-muted py-4">No hay visitas registradas.</p>}
                  {clientVisits.map(visit => (
                      <div key={visit.id} className="bg-app-surface border border-app-accent/10 rounded-xl overflow-hidden">
                          {/* Header of Visit Card */}
                          <div 
                            className="p-4 flex justify-between items-start cursor-pointer hover:bg-app-surface/80"
                            onClick={() => setExpandedVisitId(expandedVisitId === visit.id ? null : visit.id)}
                          >
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-white text-sm">{new Date(visit.timestamp).toLocaleDateString()}</span>
                                      <span className="text-xs text-app-muted">{new Date(visit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <p className="text-sm text-gray-300 line-clamp-2">{visit.feedback}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase whitespace-nowrap ${
                                  visit.status === 'aceptado' ? 'bg-green-900/50 text-green-400' :
                                  visit.status === 'rechazado' ? 'bg-red-900/50 text-red-400' :
                                  'bg-yellow-900/50 text-yellow-400'
                              }`}>
                                  {visit.status}
                              </span>
                          </div>

                          {/* Expanded Details */}
                          {expandedVisitId === visit.id && (
                              <div className="border-t border-app-accent/10 p-4 bg-black/20 space-y-3">
                                  {/* Audio Notes */}
                                  {visit.voiceNotes && visit.voiceNotes.length > 0 && (
                                      <div className="space-y-2">
                                          <p className="text-xs font-bold text-app-accent uppercase">Notas de Voz</p>
                                          {visit.voiceNotes.map(vn => (
                                              <div key={vn.id} className="bg-app-bg p-2 rounded flex items-center gap-3">
                                                  <div className="bg-app-accent/20 p-2 rounded-full"><Mic size={16} className="text-app-accent"/></div>
                                                  <div className="flex-1">
                                                      <p className="text-xs text-white mb-1">{vn.name}</p>
                                                      {vn.data && <audio controls src={vn.data} className="w-full h-8" />}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  {/* Docs */}
                                  {visit.documentsAdded && visit.documentsAdded.length > 0 && (
                                      <div>
                                          <p className="text-xs font-bold text-app-accent uppercase mb-1">Documentos Adjuntos</p>
                                          {visit.documentsAdded.map(d => (
                                              <div key={d.id} className="text-sm text-white flex items-center gap-2 py-1">
                                                  <FileText size={14}/> {d.name}
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  {/* Expenses */}
                                  {visit.expensesAdded && visit.expensesAdded.length > 0 && (
                                      <div>
                                          <p className="text-xs font-bold text-app-accent uppercase mb-1">Gastos</p>
                                          {visit.expensesAdded.map(e => (
                                              <div key={e.id} className="text-sm text-white flex justify-between py-1 border-b border-white/5 last:border-0">
                                                  <span>{e.concept}</span>
                                                  <span className="font-bold">{e.amount}€</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'docs' && (
              <div className="space-y-4">
                  <button 
                    onClick={handleAddDoc}
                    className="w-full border-2 border-dashed border-app-accent/30 rounded-xl p-4 flex flex-col items-center justify-center text-app-muted hover:border-app-accent hover:text-app-accent transition-all"
                  >
                      <Plus size={24} className="mb-2" />
                      <span className="font-bold text-sm">Añadir Documento General</span>
                  </button>

                  <div className="space-y-2">
                      {client.documents.map(doc => (
                          <div key={doc.id} className="bg-app-surface p-3 rounded-lg flex items-center justify-between border-l-2 border-l-app-accent">
                              <div className="flex items-center gap-3">
                                  <FileText className="text-app-accent" size={20} />
                                  <div>
                                      <p className="text-white font-medium text-sm">{doc.name}</p>
                                      <p className="text-[10px] text-app-muted">{new Date(doc.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className="text-xs bg-app-bg px-2 py-1 rounded text-app-muted uppercase">{doc.type}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'expenses' && (
              <div className="space-y-4">
                   <div className="bg-gradient-to-r from-app-surface to-app-bg border border-app-accent/20 rounded-xl p-4 flex justify-between items-center">
                       <span className="text-app-muted text-sm">Total Gastos</span>
                       <span className="text-2xl font-bold text-white">
                           {client.expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}€
                       </span>
                   </div>

                   <div className="space-y-2">
                      {client.expenses.map(exp => (
                          <div key={exp.id} className="bg-app-surface p-3 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className="bg-red-900/30 p-2 rounded-full text-red-400">
                                      <DollarSign size={16} />
                                  </div>
                                  <div>
                                      <p className="text-white font-medium text-sm">{exp.concept}</p>
                                      <p className="text-[10px] text-app-muted">{new Date(exp.date).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className="font-bold text-white">{exp.amount}€</span>
                          </div>
                      ))}
                   </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default ClientFolder;
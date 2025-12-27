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
  isDemo?: boolean;
}

const ClientFolder: React.FC<ClientFolderProps> = ({ client, visits = [], onBack, onUpdateClient, onNewVisit, isDemo }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'docs' | 'expenses' | 'contacts'>('overview');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '', email: '' });

  const clientVisits = visits.filter(v => v.clientId === client.id).sort((a,b) => b.timestamp - a.timestamp);

  // Get all expenses (general + from visits)
  const allExpenses = [
      ...client.expenses,
      ...clientVisits.flatMap(v => (v.expensesAdded || []).map(e => ({ ...e, visitDate: v.timestamp })))
  ].sort((a, b) => b.date - a.date);

  const totalExpenses = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Get all documents (general + from visits)
  const allDocuments = [
      ...client.documents,
      ...clientVisits.flatMap(v => (v.documentsAdded || []).map(d => ({ ...d, visitDate: v.timestamp })))
  ].sort((a, b) => b.date - a.date);

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
      let addedContact: Contact;
      if (isDemo) {
          addedContact = { ...newContact, id: crypto.randomUUID() };
      } else {
          addedContact = await api.addContact(client.id, newContact);
      }
      
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

  const openDocument = (data: string) => {
      const newWindow = window.open();
      if (newWindow) {
          newWindow.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
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
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${client.location.lat},${client.location.lng}`, '_blank')}
                        className="ml-2 text-app-accent hover:underline text-xs font-bold uppercase"
                    >
                        Ver en Maps
                    </button>
                </p>
            </div>
            <div className="w-12 h-12 bg-app-accent text-app-bg rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(0,232,229,0.3)]">
                {client.name.substring(0, 2).toUpperCase()}
            </div>
        </div>

        {/* Contact Info Chips */}
        <div className="flex flex-wrap gap-2">
            {client.contactName && (
                <button onClick={() => setActiveTab('contacts')} className="flex items-center gap-1 bg-app-bg/50 px-3 py-1.5 rounded-full border border-app-accent/10 hover:border-app-accent hover:text-app-accent transition-all cursor-pointer">
                    <User size={12} className="text-app-accent"/> <span className="text-xs text-white">{client.contactName}</span>
                </button>
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
                {tab === 'overview' ? 'Resumen' : tab === 'history' ? 'Historial' : tab === 'docs' ? 'Documentos' : tab === 'expenses' ? 'Gastos' : 'Contactos'}
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
                  <div className="grid grid-cols-3 gap-2">
                      <div className="bg-app-surface p-3 rounded-xl border border-app-accent/10">
                          <div className="flex items-center gap-1 text-app-muted mb-1 text-[10px] uppercase tracking-wider">
                              <Clock size={12} /> Tiempo
                          </div>
                          <span className="text-lg font-bold text-white">{client.totalTimeSpentMinutes} <span className="text-[10px] font-normal text-app-muted">min</span></span>
                      </div>
                      <div className="bg-app-surface p-3 rounded-xl border border-app-accent/10">
                          <div className="flex items-center gap-1 text-app-muted mb-1 text-[10px] uppercase tracking-wider">
                              <Calendar size={12} /> Visitas
                          </div>
                          <span className="text-lg font-bold text-white">{client.visitIds.length}</span>
                      </div>
                      <div className="bg-app-surface p-3 rounded-xl border border-app-accent/10">
                          <div className="flex items-center gap-1 text-app-muted mb-1 text-[10px] uppercase tracking-wider">
                              <DollarSign size={12} /> Coste
                          </div>
                          <span className="text-lg font-bold text-white">{totalExpenses.toFixed(2)}€</span>
                      </div>
                  </div>

                  {allExpenses.length > 0 && (
                      <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                          <h3 className="font-bold text-white mb-3 flex justify-between items-center">
                              <span>Desglose de Gastos</span>
                              <button onClick={() => setActiveTab('expenses')} className="text-app-accent text-xs font-normal">Ver todos</button>
                          </h3>
                          <div className="space-y-2">
                              {allExpenses.slice(0, 3).map(exp => (
                                  <div key={exp.id} className="flex justify-between items-center text-xs">
                                      <div className="flex flex-col">
                                          <span className="text-white font-medium">{exp.concept}</span>
                                          <span className="text-[10px] text-app-muted">{new Date(exp.date).toLocaleDateString()}</span>
                                      </div>
                                      <span className="font-bold text-red-400">{exp.amount}€</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                      <h3 className="font-bold text-white mb-3 flex justify-between items-center">
                          <span>Historial de Visitas</span>
                          <button onClick={() => setActiveTab('history')} className="text-app-accent text-xs font-normal">Ver todo</button>
                      </h3>
                      <div className="space-y-3">
                        {clientVisits.length > 0 ? (
                            clientVisits.slice(0, 3).map(visit => (
                                <div key={visit.id} className="border-l-2 border-app-accent/30 pl-3 py-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-white">{new Date(visit.timestamp).toLocaleDateString()}</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                            visit.status === 'aceptado' ? 'bg-green-900/50 text-green-400' :
                                            visit.status === 'rechazado' ? 'bg-red-900/50 text-red-400' :
                                            'bg-yellow-900/50 text-yellow-400'
                                        }`}>
                                            {visit.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-app-muted line-clamp-1">{visit.feedback}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-app-muted text-sm italic">Sin actividad reciente.</p>
                        )}
                      </div>
                  </div>

                  {allDocuments.length > 0 && (
                      <div className="bg-app-surface p-4 rounded-xl border border-app-accent/10">
                          <h3 className="font-bold text-white mb-3 flex justify-between items-center">
                              <span>Documentos Recientes</span>
                              <button onClick={() => setActiveTab('docs')} className="text-app-accent text-xs font-normal">Ver todos</button>
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                              {allDocuments.slice(0, 2).map(doc => (
                                  <button 
                                    key={doc.id} 
                                    onClick={() => doc.data && openDocument(doc.data)}
                                    className="flex items-center gap-3 bg-app-bg/50 p-2 rounded-lg border border-app-accent/5 text-left"
                                  >
                                      <FileText size={16} className="text-app-accent" />
                                      <span className="text-xs text-white truncate">{doc.name}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
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
                                      {visit.expensesAdded && visit.expensesAdded.length > 0 && (
                                          <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                              <DollarSign size={10} /> {visit.expensesAdded.reduce((acc, curr) => acc + curr.amount, 0).toFixed(0)}€
                                          </span>
                                      )}
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
                                              <button 
                                                key={d.id} 
                                                onClick={() => d.data && openDocument(d.data)}
                                                className="text-sm text-white flex items-center gap-2 py-1 hover:text-app-accent w-full text-left"
                                              >
                                                  <FileText size={14}/> {d.name}
                                              </button>
                                          ))}
                                      </div>
                                  )}

                                  {/* Expenses */}
                                  {visit.expensesAdded && visit.expensesAdded.length > 0 && (
                                      <div className="mt-2">
                                          <p className="text-xs font-bold text-app-accent uppercase mb-1">Gastos de la Visita</p>
                                          <div className="space-y-1">
                                              {visit.expensesAdded.map(e => (
                                                  <div key={e.id} className="text-sm text-white flex justify-between py-1 border-b border-white/5 last:border-0">
                                                      <span>{e.concept}</span>
                                                      <span className="font-bold text-red-400">{e.amount}€</span>
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="flex justify-between pt-1 border-t border-app-accent/20 mt-1">
                                              <span className="text-xs font-bold text-app-accent">Total Visita</span>
                                              <span className="text-xs font-bold text-app-accent">{visit.expensesAdded.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}€</span>
                                          </div>
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
                      {allDocuments.length === 0 && (
                          <p className="text-center text-app-muted py-10">No hay documentos registrados.</p>
                      )}
                      {allDocuments.map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => doc.data && openDocument(doc.data)}
                            className="bg-app-surface p-3 rounded-lg flex items-center justify-between border-l-2 border-l-app-accent w-full hover:bg-app-surface/80 transition-colors text-left"
                          >
                              <div className="flex items-center gap-3">
                                  <FileText className="text-app-accent" size={20} />
                                  <div>
                                      <p className="text-white font-medium text-sm">{doc.name}</p>
                                      <p className="text-[10px] text-app-muted">
                                          {new Date(doc.date).toLocaleDateString()} 
                                          {doc.visitDate && ` (Visita)`}
                                      </p>
                                  </div>
                              </div>
                              <span className="text-xs bg-app-bg px-2 py-1 rounded text-app-muted uppercase">{doc.type}</span>
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'expenses' && (
              <div className="space-y-4">
                   <div className="bg-gradient-to-r from-app-surface to-app-bg border border-app-accent/20 rounded-xl p-4 flex justify-between items-center">
                       <span className="text-app-muted text-sm">Total Gastos</span>
                       <span className="text-2xl font-bold text-white">
                           {totalExpenses.toFixed(2)}€
                       </span>
                   </div>

                   <div className="space-y-2">
                      {allExpenses.length === 0 && (
                          <p className="text-center text-app-muted py-10">No hay gastos registrados.</p>
                      )}
                      {allExpenses.map(exp => (
                          <div key={exp.id} className="bg-app-surface p-3 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className="bg-red-900/30 p-2 rounded-full text-red-400">
                                      <DollarSign size={16} />
                                  </div>
                                  <div>
                                      <p className="text-white font-medium text-sm">{exp.concept}</p>
                                      <p className="text-[10px] text-app-muted">
                                          {new Date(exp.date).toLocaleDateString()}
                                          {exp.visitDate && ` (Visita)`}
                                      </p>
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
import React, { useState, useRef } from 'react';
import { Save, MapPin, X, Clock, DollarSign, Plus, Search, CheckCircle, FileText, Check, Ban, Lightbulb, Upload, User, Phone, Mail, Mic, StopCircle, Trash2 } from 'lucide-react';
import { Place, VisitReport, Expense, ClientDoc, Client } from '../types';
import { getAddressSuggestions, getCoordinatesForAddress } from '../services/gemini';

interface VisitFormProps {
  initialPlace?: Place | null;
  existingClient?: Client | null;
  onSave: (report: VisitReport, updatedClientData?: Partial<Client>) => void;
  onCancel: () => void;
  userLocation: { lat: number; lng: number } | null;
}

const VisitForm: React.FC<VisitFormProps> = ({ initialPlace, existingClient, onSave, onCancel, userLocation }) => {
  const isLocked = !!existingClient;
  
  // Basic Info
  const [placeName, setPlaceName] = useState(existingClient?.name || initialPlace?.name || '');
  const [address, setAddress] = useState(existingClient?.address || initialPlace?.address || '');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'aceptado' | 'rechazado' | 'propuesta'>('propuesta');
  const [duration, setDuration] = useState<number>(30);

  // Contact Info
  const [contactName, setContactName] = useState(existingClient?.contactName || '');
  const [phones, setPhones] = useState<string[]>(existingClient?.phones || []);
  const [emails, setEmails] = useState<string[]>(existingClient?.emails || []);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  // Expenses & Docs
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<ClientDoc[]>([]);

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<ClientDoc[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  
  // Address Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- Handlers ---

  const handleAddressSearch = async () => {
      if (!address || !userLocation) return;
      console.log(`[VisitForm] Requesting suggestions for: ${address}`);
      setLoadingSuggestions(true);
      setShowSuggestions(true);
      try {
          const results = await getAddressSuggestions(address, userLocation.lat, userLocation.lng);
          console.log(`[VisitForm] Suggestions received:`, results);
          setSuggestions(results);
      } catch (err) {
          console.error("[VisitForm] Suggestion error:", err);
      } finally {
          setLoadingSuggestions(false);
      }
  };

  const selectSuggestion = (selected: string) => {
      setAddress(selected);
      setShowSuggestions(false);
  };

  const addPhone = () => {
      if(newPhone) { setPhones([...phones, newPhone]); setNewPhone(''); }
  };
  const removePhone = (idx: number) => setPhones(phones.filter((_, i) => i !== idx));

  const addEmail = () => {
      if(newEmail) { setEmails([...emails, newEmail]); setNewEmail(''); }
  };
  const removeEmail = (idx: number) => setEmails(emails.filter((_, i) => i !== idx));

  const addExpense = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseConcept) return;
    setExpenses([...expenses, {
        id: crypto.randomUUID(),
        amount: parseFloat(expenseAmount),
        concept: expenseConcept,
        date: Date.now()
    }]);
    setExpenseAmount('');
    setExpenseConcept('');
  };

  const removeExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const addDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setDocuments([...documents, {
                  id: crypto.randomUUID(),
                  name: file.name,
                  type: file.type.includes('image') ? 'img' : 'doc',
                  date: Date.now(),
                  data: reader.result as string
              }]);
          };
          reader.readAsDataURL(file);
      }
  };
  const removeDocument = (id: string) => setDocuments(documents.filter(d => d.id !== id));

  const removeVoiceNote = (id: string) => setVoiceNotes(voiceNotes.filter(v => v.id !== id));

  // Audio Recording Logic
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result as string;
                setVoiceNotes(prev => [...prev, {
                    id: crypto.randomUUID(),
                    name: `Nota de Voz ${new Date().toLocaleTimeString()}`,
                    type: 'audio',
                    date: Date.now(),
                    data: base64Audio
                }]);
            };
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone", err);
        alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          // Stop all tracks to release mic
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName || !address) return;

    setIsSubmitting(true);
    setSubmitStatus('Guardando...');

    // Determine Location
    let finalLocation = existingClient?.location || initialPlace?.location;
    
    // If address changed from what we had, or we don't have a location, geocode it
    const originalAddress = existingClient?.address || initialPlace?.address || '';
    if (address !== originalAddress || !finalLocation) {
        setSubmitStatus('Geolocalizando dirección...');
        const coords = await getCoordinatesForAddress(address);
        if (coords) {
            finalLocation = coords;
        } else if (!finalLocation) {
            finalLocation = userLocation || { lat: 0, lng: 0 };
        }
    }

    const report: VisitReport = {
      id: crypto.randomUUID(),
      clientId: existingClient?.id,
      placeId: existingClient?.id || initialPlace?.id || crypto.randomUUID(),
      placeName,
      placeAddress: address,
      timestamp: Date.now(),
      feedback,
      status, 
      tags: [],
      location: finalLocation,
      durationMinutes: duration,
      expensesAdded: expenses,
      documentsAdded: documents,
      voiceNotes: voiceNotes
    };

    // Prepare Updated Client Data
    const updatedClientData: Partial<Client> = {
        name: placeName,
        address: address,
        location: finalLocation,
        contactName,
        phones,
        emails
    };

    onSave(report, updatedClientData);
    setIsSubmitting(false);
    setSubmitStatus('');
  };

  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in-up pb-24">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-app-bg/95 backdrop-blur z-10 py-2 border-b border-app-accent/10">
        <h2 className="text-xl font-bold text-white">
            {isLocked ? 'Nueva Visita' : 'Alta Nuevo Cliente'}
        </h2>
        <button onClick={onCancel} className="text-app-muted hover:text-white">
            <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* === SECTION 1: BASIC INFO === */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-app-accent uppercase tracking-wider">Nombre Local *</label>
                <div className="relative">
                    <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="Ej: Restaurante El Puerto"
                    className="w-full bg-app-surface border border-app-accent/30 rounded-lg p-3 pl-10 text-white outline-none focus:border-app-accent"
                    required
                    />
                    <MapPin size={18} className="absolute left-3 top-3.5 text-app-accent" />
                </div>
            </div>

            <div className="space-y-2 relative">
                <label className="text-xs font-bold text-app-accent uppercase tracking-wider">Dirección *</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if(showSuggestions) setShowSuggestions(false);
                            }}
                            className="w-full bg-app-surface border border-app-accent/30 rounded-lg p-3 text-white outline-none focus:border-app-accent"
                            required
                        />
                    </div>
                    <button 
                        type="button" onClick={handleAddressSearch}
                        className="bg-app-accent/10 text-app-accent border border-app-accent/30 rounded-lg px-3 hover:bg-app-accent hover:text-app-bg transition-colors"
                    >
                        {loadingSuggestions ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" /> : <Search size={20} />}
                    </button>
                </div>
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-app-surface border border-app-accent rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {suggestions.map((sug, idx) => (
                            <button key={idx} type="button" onClick={() => selectSuggestion(sug)} className="w-full text-left p-3 text-sm text-white hover:bg-app-accent hover:text-app-bg border-b border-app-accent/10">
                                {sug}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* === SECTION 2: CONTACT INFO === */}
        <div className="bg-app-surface/30 p-4 rounded-xl border border-app-accent/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><User size={16} className="text-app-accent"/> Datos de Contacto</h3>
            
            <div>
                <input 
                    type="text" 
                    placeholder="Nombre Persona de Contacto"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full bg-app-bg border border-app-accent/10 rounded-lg p-2 text-sm text-white outline-none focus:border-app-accent/50"
                />
            </div>

            {/* Phones */}
            <div className="space-y-2">
                {phones.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-app-bg p-2 rounded text-sm text-white">
                        <span className="flex items-center gap-2"><Phone size={14} className="text-app-muted"/> {p}</span>
                        <button type="button" onClick={() => removePhone(idx)} className="text-red-400"><Trash2 size={14}/></button>
                    </div>
                ))}
                <div className="flex gap-2">
                    <input 
                        type="tel" placeholder="Nuevo Teléfono"
                        value={newPhone} onChange={e => setNewPhone(e.target.value)}
                        className="flex-1 bg-app-bg border border-app-accent/10 rounded-lg p-2 text-sm text-white outline-none"
                    />
                    <button type="button" onClick={addPhone} className="bg-app-accent/10 text-app-accent px-3 rounded-lg"><Plus size={16}/></button>
                </div>
            </div>

            {/* Emails */}
            <div className="space-y-2">
                {emails.map((email, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-app-bg p-2 rounded text-sm text-white">
                        <span className="flex items-center gap-2"><Mail size={14} className="text-app-muted"/> {email}</span>
                        <button type="button" onClick={() => removeEmail(idx)} className="text-red-400"><Trash2 size={14}/></button>
                    </div>
                ))}
                <div className="flex gap-2">
                    <input 
                        type="email" placeholder="Nuevo Email"
                        value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        className="flex-1 bg-app-bg border border-app-accent/10 rounded-lg p-2 text-sm text-white outline-none"
                    />
                    <button type="button" onClick={addEmail} className="bg-app-accent/10 text-app-accent px-3 rounded-lg"><Plus size={16}/></button>
                </div>
            </div>
        </div>

        {/* === SECTION 3: VISIT DETAILS === */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-app-muted uppercase tracking-wider">Resultado</label>
            <div className="grid grid-cols-3 gap-2">
                {(['aceptado', 'propuesta', 'rechazado'] as const).map(s => (
                     <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all capitalize ${
                            status === s 
                            ? s === 'aceptado' ? 'bg-green-500/20 border-green-500 text-green-400' 
                                : s === 'rechazado' ? 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-app-surface border-app-accent/10 text-gray-400'
                        }`}
                    >
                        {s === 'aceptado' && <Check size={20} />}
                        {s === 'propuesta' && <Lightbulb size={20} />}
                        {s === 'rechazado' && <Ban size={20} />}
                        <span className="text-[10px] font-bold">{s}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Documents & Audio */}
        <div className="space-y-2 bg-app-surface/50 p-4 rounded-xl border border-dashed border-app-muted/30">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-app-accent uppercase tracking-wider flex items-center gap-1">
                    <Upload size={12}/> Archivos & Notas de Voz
                </label>
                <label className="bg-app-accent/10 text-app-accent px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1">
                    <Plus size={12} /> Adjuntar Doc
                    <input type="file" className="hidden" onChange={addDocument} />
                </label>
            </div>
            
            {/* Audio Recorder */}
            <div className="flex items-center gap-4 py-2 border-b border-app-accent/10 mb-2">
                 <button 
                    type="button" 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-app-surface border border-app-accent text-app-accent'}`}
                 >
                     {isRecording ? <><StopCircle size={18}/> Detener</> : <><Mic size={18}/> Grabar Nota Voz</>}
                 </button>
                 {isRecording && <span className="text-xs text-red-400">Grabando...</span>}
            </div>

            <div className="space-y-2">
                {voiceNotes.map(note => (
                    <div key={note.id} className="flex justify-between items-center p-2 bg-app-bg rounded border border-app-accent/10">
                         <div className="flex items-center gap-2">
                             <Mic size={14} className="text-app-accent"/>
                             <span className="text-sm text-white">Nota de Voz ({new Date(note.date).toLocaleTimeString()})</span>
                         </div>
                         <button type="button" onClick={() => removeVoiceNote(note.id)} className="text-red-400 p-1"><X size={14}/></button>
                    </div>
                ))}

                {documents.map(doc => (
                     <div key={doc.id} className="flex justify-between items-center p-2 bg-app-bg rounded border border-app-accent/10">
                        <span className="text-sm text-white flex items-center gap-2"><FileText size={14} className="text-app-accent"/> {doc.name}</span>
                        <button type="button" onClick={() => removeDocument(doc.id)} className="text-red-400"><X size={14}/></button>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Expenses */}
        <div className="space-y-2 bg-app-surface/50 p-4 rounded-xl border border-dashed border-app-muted/30">
            <label className="text-xs font-bold text-app-accent uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={12}/> Gastos
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" placeholder="Concepto" value={expenseConcept} onChange={e => setExpenseConcept(e.target.value)}
                    className="flex-1 bg-app-bg border border-app-accent/10 rounded-lg p-2 text-sm text-white outline-none"
                />
                <input 
                    type="number" placeholder="€" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                    className="w-20 bg-app-bg border border-app-accent/10 rounded-lg p-2 text-sm text-white outline-none"
                />
                <button onClick={addExpense} className="bg-app-accent/20 text-app-accent p-2 rounded-lg"><Plus size={18} /></button>
            </div>
            {expenses.length > 0 && (
                <div className="mt-2 space-y-1">
                    {expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center text-sm p-2 bg-app-bg rounded text-white">
                            <span>{exp.concept}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-app-accent font-bold">{exp.amount}€</span>
                                <button type="button" onClick={() => removeExpense(exp.id)} className="text-red-400"><X size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-app-accent uppercase tracking-wider">Feedback / Reporte *</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="¿Cómo fue la visita? ¿Qué necesita el cliente?"
            className="w-full h-32 bg-app-surface border border-app-accent/30 rounded-lg p-3 text-white focus:border-app-accent outline-none resize-none"
            required
          />
        </div>

        <div className="pt-2">
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-app-accent text-app-bg font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-[#33F1EE] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <span>{submitStatus || 'Procesando...'}</span>
                ) : (
                    <>
                        <Save size={20} />
                        <span>{isLocked ? 'Guardar Visita' : 'Crear Cliente y Visita'}</span>
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default VisitForm;
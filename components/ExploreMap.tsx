import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, FolderOpen, Plus, Coffee, Briefcase, ShoppingBag, Pill, Scissors, Utensils, Beef, Sparkles } from 'lucide-react';
import { Place, Client } from '../types';
import { searchNearbyPlaces } from '../services/gemini';

// Declare Leaflet global
declare global {
  interface Window {
    L: any;
  }
}

interface ExploreMapProps {
  onCheckIn: (place: Place) => void;
  onOpenClient: (clientId: string) => void;
  clients: Client[];
}

const ExploreMap: React.FC<ExploreMapProps> = ({ onCheckIn, onOpenClient, clients }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current && window.L && location) {
      const L = window.L;
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([location.lat, location.lng], 15);

      // Dark Matter Tile Layer (Free CartoDB)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);

      // User Location Marker
      const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `<div style="width: 16px; height: 16px; background: #00E8E5; border-radius: 50%; box-shadow: 0 0 10px #00E8E5; border: 2px solid white;"></div>`,
          iconSize: [20, 20]
      });
      L.marker([location.lat, location.lng], { icon: userIcon }).addTo(mapRef.current);
    }
  }, [location]);

  // Update Markers (Clients + Search Results)
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Client Markers (Cyan Folders)
    clients.forEach(client => {
        const icon = L.divIcon({
            className: 'client-marker',
            html: `
                <div style="
                    background: #001F20; 
                    border: 2px solid #00E8E5; 
                    border-radius: 8px; 
                    padding: 4px; 
                    color: #00E8E5; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center;
                    width: 32px; height: 32px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.5);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div style="
                    position: absolute; 
                    top: -25px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    background: #00E8E5; 
                    color: #001F20; 
                    font-size: 10px; 
                    font-weight: bold; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    white-space: nowrap;
                    z-index: 100;">
                    ${client.name}
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        const marker = L.marker([client.location.lat, client.location.lng], { icon })
            .addTo(mapRef.current)
            .on('click', () => onOpenClient(client.id));
        
        markersRef.current.push(marker);
    });

    // Add Search Result Markers (White/Gray Pins)
    searchResults.forEach(place => {
        // Skip if this place is already a client (simple check by name)
        if (clients.some(c => c.name === place.name)) return;

        const icon = L.divIcon({
            className: 'search-marker',
            html: `
                <div style="
                    background: white; 
                    border-radius: 50%; 
                    width: 28px; height: 28px; 
                    display: flex; justify-content: center; align-items: center;
                    color: #001F20;
                    box-shadow: 0 0 5px rgba(255,255,255,0.5);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([place.location!.lat, place.location!.lng], { icon })
            .addTo(mapRef.current)
            .on('click', () => {
                 // Create a custom popup content
                 const popupContent = document.createElement('div');
                 popupContent.className = 'p-3 text-center min-w-[200px]';
                 popupContent.innerHTML = `
                    <div class="mb-2">
                        <span class="text-[10px] uppercase tracking-wide text-gray-500 border border-gray-300 rounded px-1">${place.type || 'Negocio'}</span>
                    </div>
                    <h3 class="font-bold text-app-bg text-base leading-tight mb-1">${place.name}</h3>
                    <div class="text-xs text-gray-600 mb-3 flex items-start justify-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span class="text-left">${place.address}</span>
                    </div>
                 `;
                 const btn = document.createElement('button');
                 btn.className = 'bg-app-accent text-app-bg px-4 py-2 rounded-lg text-xs font-bold w-full uppercase shadow hover:bg-[#33F1EE] transition-colors flex items-center justify-center gap-2';
                 btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Crear Cliente`;
                 btn.onclick = () => onCheckIn(place);
                 popupContent.appendChild(btn);

                 marker.bindPopup(popupContent).openPopup();
            });

        markersRef.current.push(marker);
    });

  }, [clients, searchResults]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Loc error", err)
    );
  }, []);

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!location || !q) return;
    console.log(`[ExploreMap] Searching for: ${q} at ${location.lat}, ${location.lng}`);
    setLoading(true);
    setQuery(q);
    
    // Clear previous results to show loading state implies refreshing
    setSearchResults([]);
    
    try {
        const results = await searchNearbyPlaces(q, location.lat, location.lng);
        console.log(`[ExploreMap] Found ${results.length} results`);
        setSearchResults(results);
        
        if (results.length > 0 && mapRef.current) {
            const group = new window.L.featureGroup(results.map((r: any) => window.L.marker([r.location.lat, r.location.lng])));
            mapRef.current.fitBounds(group.getBounds().pad(0.2));
        }
    } catch (err) {
        console.error("[ExploreMap] Search error:", err);
    } finally {
        setLoading(false);
    }
  };

  const categories = [
      { id: 'restaurante', label: 'Restaurante', icon: <Utensils size={14}/> },
      { id: 'peluqueria', label: 'Peluquería', icon: <Scissors size={14}/> },
      { id: 'carniceria', label: 'Carnicería', icon: <Beef size={14}/> },
      { id: 'belleza', label: 'Salón de belleza', icon: <Sparkles size={14}/> },
  ];

  return (
    <div className="flex flex-col h-full bg-app-bg relative">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2">
          <div className="bg-app-surface/90 backdrop-blur border border-app-accent/20 rounded-xl p-2 shadow-2xl flex gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar tipo de negocio (ej. Talleres)..."
                    className="w-full bg-transparent border-none text-white placeholder-app-muted focus:ring-0 outline-none pl-9 py-2 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search size={16} className="absolute left-2 top-2.5 text-app-muted" />
            </div>
            <button 
                onClick={() => handleSearch()}
                disabled={loading || !location}
                className="bg-app-accent text-app-bg p-2 rounded-lg"
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
            </button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleSearch(cat.label)}
                    className="bg-app-surface/90 backdrop-blur border border-app-accent/20 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-app-accent hover:text-app-bg transition-colors shadow-lg"
                  >
                      {cat.icon}
                      {cat.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 z-0 w-full h-full bg-app-bg" />
      
      {!location && (
          <div className="absolute inset-0 flex items-center justify-center bg-app-bg z-[1000]">
              <Loader2 className="animate-spin text-app-accent" />
          </div>
      )}
    </div>
  );
};

export default ExploreMap;
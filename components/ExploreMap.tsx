import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';
import { Place, Client } from '../types';

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

  // Update Markers (Clients Only)
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Client Markers (Cyan Folders)
    clients.forEach(client => {
        if (!client.location || typeof client.location.lat !== 'number') return;
        
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
            .addTo(mapRef.current);

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 text-center min-w-[200px]';
        popupContent.innerHTML = `
           <h3 class="font-bold text-app-bg text-base leading-tight mb-1">${client.name}</h3>
           <div class="text-xs text-gray-600 mb-3 flex items-start justify-center gap-1">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
               <span class="text-left">${client.address}</span>
           </div>
        `;
        
        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex gap-2';

        const btnOpen = document.createElement('button');
        btnOpen.className = 'flex-1 bg-app-accent text-app-bg px-2 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-[#33F1EE] transition-colors';
        btnOpen.innerText = 'Ver Ficha';
        btnOpen.onclick = () => onOpenClient(client.id);

        const btnMaps = document.createElement('button');
        btnMaps.className = 'flex-1 bg-gray-200 text-gray-800 px-2 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-gray-300 transition-colors flex items-center justify-center gap-1';
        btnMaps.innerHTML = `Maps`;
        btnMaps.onclick = () => {
            // Use search query with the exact address string as requested
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`, '_blank');
        };

        btnContainer.appendChild(btnOpen);
        btnContainer.appendChild(btnMaps);
        popupContent.appendChild(btnContainer);

        marker.bindPopup(popupContent);
        
        markersRef.current.push(marker);
    });

  }, [clients]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Loc error", err)
    );
  }, []);

  return (
    <div className="flex flex-col h-full bg-app-bg relative">
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
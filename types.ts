export interface User {
  id: string;
  username: string;
  role: 'admin' | 'commercial';
  name: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  type?: string;
  rating?: number;
}

export interface Expense {
  id: string;
  amount: number;
  concept: string;
  date: number;
}

export interface ClientDoc {
  id: string;
  name: string;
  type: 'pdf' | 'img' | 'doc' | 'audio';
  date: number;
  data?: string; // Base64 for audio or small preview
}

export interface Client {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  // New Contact Fields
  contactName?: string;
  phones: string[];
  emails: string[];
  
  totalTimeSpentMinutes: number;
  expenses: Expense[];
  documents: ClientDoc[];
  visitIds: string[];
}

export interface VisitReport {
  id: string;
  clientId?: string; // Link to client
  placeId: string;
  placeName: string;
  placeAddress: string;
  timestamp: number;
  feedback: string;
  status: 'aceptado' | 'rechazado' | 'propuesta';
  tags: string[];
  location: {
    lat: number;
    lng: number;
  };
  durationMinutes: number;
  expensesAdded?: Expense[];
  documentsAdded?: ClientDoc[];
  voiceNotes?: ClientDoc[]; // Specific for audio
}

export enum AppView {
  LOGIN = 'LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  DASHBOARD = 'DASHBOARD',
  EXPLORE = 'EXPLORE',
  HISTORY = 'HISTORY',
  NEW_VISIT = 'NEW_VISIT',
  CLIENTS = 'CLIENTS',
  CLIENT_FOLDER = 'CLIENT_FOLDER'
}
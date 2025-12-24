import { User, Client, VisitReport } from '../types';

const API_URL = '/api'; // Relative path since we serve from same origin

export const api = {
  login: async (credentials: any): Promise<User> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${API_URL}/clients`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  createClient: async (client: Client): Promise<Client> => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Failed to create client');
    return res.json();
  },

  updateClient: async (client: Client): Promise<Client> => {
    const res = await fetch(`${API_URL}/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
  },

  getVisits: async (): Promise<VisitReport[]> => {
    const res = await fetch(`${API_URL}/visits`);
    if (!res.ok) throw new Error('Failed to fetch visits');
    return res.json();
  },

  createVisit: async (visit: VisitReport): Promise<VisitReport> => {
    const res = await fetch(`${API_URL}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visit),
    });
    if (!res.ok) throw new Error('Failed to create visit');
    return res.json();
  },
};

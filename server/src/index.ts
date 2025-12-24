import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import { User, Client, Visit, Expense, Document, Contact } from './models';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images/audio

// Connect to Database
connectDB().then(async () => {
  // Seed default admin if not exists
  try {
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await User.create({
        username: 'admin',
        password: 'adminpassword', // Match user's DB
        role: 'admin',
        name: 'Admin User'
      });
      console.log('Default admin user created: admin / adminpassword');
    }
    
    const commercial = await User.findOne({ where: { username: 'comercial' } });
    if (!commercial) {
      await User.create({
        username: 'comercial',
        password: 'password', // Match user's DB
        role: 'commercial',
        name: 'Comercial User'
      });
      console.log('Default commercial user created: comercial / password');
    }
  } catch (e) {
    console.error("Seeding failed", e);
  }
});

// --- API Routes ---

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // In a real app, compare hashed password
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [
        { model: Expense, as: 'expenses' },
        { model: Document, as: 'documents' },
        { model: Contact, as: 'contacts' }
      ]
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/clients/:id/contacts', async (req, res) => {
  try {
    const contact = await Contact.create({ ...req.body, clientId: req.params.id });
    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (client) {
      await client.update(req.body);
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Visits
app.get('/api/visits', async (req, res) => {
  try {
    const visits = await Visit.findAll({
      include: [
        { model: Expense, as: 'expenses' },
        { model: Document, as: 'documents' }
      ],
      order: [['timestamp', 'DESC']]
    });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const visitData = req.body;
    const visit = await Visit.create(visitData);
    
    // Handle nested creations if necessary, or expect frontend to call separate endpoints
    // For simplicity, let's assume frontend sends expenses/documents separately or we handle them here
    if (visitData.expensesAdded && visitData.expensesAdded.length > 0) {
      for (const exp of visitData.expensesAdded) {
        await Expense.create({ ...exp, visitId: visit.id, clientId: visit.clientId });
      }
    }
    
    if (visitData.documentsAdded && visitData.documentsAdded.length > 0) {
      for (const doc of visitData.documentsAdded) {
        await Document.create({ ...doc, visitId: visit.id, clientId: visit.clientId });
      }
    }

    if (visitData.voiceNotes && visitData.voiceNotes.length > 0) {
        for (const doc of visitData.voiceNotes) {
          await Document.create({ ...doc, visitId: visit.id, clientId: visit.clientId });
        }
      }

    res.json(visit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Serve static files from the React app
const frontendPath = path.join(__dirname, '../../dist');
console.log('Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

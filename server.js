import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'eliteWealthOS';
let db = null;
let clientCollection = null;

// Connect to local MongoDB instance
async function connectMongo() {
  try {
    const client = await MongoClient.connect(mongoUrl, { serverSelectionTimeoutMS: 2000 });
    db = client.db(dbName);
    clientCollection = db.collection('clients');
    console.log('Successfully connected to MongoDB database: eliteWealthOS');
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to Mock Memory DB state.');
  }
}

connectMongo();

// Mock Memory Database fallback
let mockDb = [];

// API endpoints
app.post('/api/clients', async (req, res) => {
  const clientData = req.body;
  if (!clientData.clientId) {
    return res.status(400).json({ error: 'Client ID is mandatory' });
  }

  try {
    if (clientCollection) {
      // Upsert into MongoDB
      await clientCollection.updateOne(
        { clientId: clientData.clientId },
        { $set: clientData },
        { upsert: true }
      );
      return res.json({ success: true, message: 'Client successfully saved to MongoDB' });
    } else {
      // Fallback
      const idx = mockDb.findIndex(c => c.clientId === clientData.clientId);
      if (idx >= 0) {
        mockDb[idx] = clientData;
      } else {
        mockDb.unshift(clientData);
      }
      return res.json({ success: true, message: 'Client saved to memory database (fallback)' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    if (clientCollection) {
      const clients = await clientCollection.find({}).sort({ lastSavedAt: -1 }).toArray();
      return res.json(clients);
    } else {
      return res.json(mockDb);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  const clientId = req.params.id;
  try {
    if (clientCollection) {
      const client = await clientCollection.findOne({ clientId });
      if (!client) return res.status(404).json({ error: 'Client not found' });
      return res.json(client);
    } else {
      const client = mockDb.find(c => c.clientId === clientId);
      if (!client) return res.status(404).json({ error: 'Client not found' });
      return res.json(client);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Elite WealthOS Backend server running at http://localhost:${port}`);
});

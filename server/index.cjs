const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, '../dist')));

// Initial data structure
const initialData = {
  users: {}, // phone -> { name, id, balances: { coffee: 0, laundry: 0, salon: 0 } }
  qrMap: {}  // id -> phone
};

// Load data
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (e) {
      return initialData;
    }
  }
  return initialData;
}

// Save data
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/users/:id', (req, res) => {
  const data = loadData();
  const phone = data.qrMap[req.params.id];
  if (!phone || !data.users[phone]) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(data.users[phone]);
});

app.post('/api/register', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Missing fields' });

  const data = loadData();
  const userId = 'vip_' + Math.random().toString(36).substr(2, 9);

  data.users[phone] = {
    name,
    phone,
    id: userId,
    balances: {
      coffee: 0,
      laundry: 0,
      salon: 0
    }
  };
  data.qrMap[userId] = phone;

  saveData(data);
  res.json(data.users[phone]);
});

app.post('/api/update-points', (req, res) => {
  const { userId, business, amount, type } = req.body;
  const data = loadData();
  const phone = data.qrMap[userId];

  if (!phone || !data.users[phone]) return res.status(404).json({ error: 'User not found' });

  const user = data.users[phone];
  if (type === 'add') {
    user.balances[business] += amount;
  } else if (type === 'redeem') {
    user.balances[business] = 0;
  }

  saveData(data);
  res.json(user);
});

// Fallback to index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

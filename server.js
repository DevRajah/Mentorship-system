const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const pairingRoutes = require('./routes/pairingRoutes');
const menteeRoutes = require('./routes/menteeRoutes');
const mentorRoutes = require('./routes/mentorRoutes');

const app = express();
app.use(express.json());
app.use('/api', pairingRoutes);
app.use('/api', menteeRoutes);
app.use('/api', mentorRoutes);

app.get('/', (req, res) => res.send('Pairing API running.'));

const PORT = process.env.PORT || 4300;

mongoose.connect(process.env.MONGO_URI, { 
//   useNewUrlParser: true,
//   useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

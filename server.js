require('dotenv').config(); // Charge les variables du fichier .env
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = 3000;

app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((err) => console.error('Erreur de connexion à MongoDB :', err));

app.get('/', (req, res) => {
  res.send('L\'API E-Health est en ligne et connectée à la base !');
});

app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Serveur démarré avec succès sur http://localhost:${port}`);
});
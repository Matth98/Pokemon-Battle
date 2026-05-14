// ============================================
// PokéBattle Backend - Node.js/Express
// ============================================
// npm install express cors mongoose dotenv bcrypt jsonwebtoken
// npm install --save-dev nodemon

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// MONGO SCHEMAS
// ============================================

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true }, // Pour multi-user
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
  },
  pokemon: [
    {
      id: String,
      name: String,
      level: Number,
      experience: Number,
    }
  ],
  teams: [
    {
      name: String,
      pokemon: [String], // IDs des Pokémon
    }
  ],
  battles: [
    {
      date: Date,
      opponent: String,
      result: String, // 'win' or 'loss'
      details: String,
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Player = mongoose.model('Player', playerSchema);

// ============================================
// ROUTES API
// ============================================

// GET tous les joueurs
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un joueur par ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Joueur non trouvé' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un joueur
app.post('/api/players', async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ error: 'Nom et userId requis' });
    }
    const player = new Player({
      name,
      userId,
    });
    const saved = await player.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mettre à jour un joueur
app.put('/api/players/:id', async (req, res) => {
  try {
    const { name, stats, pokemon, teams, battles } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (stats) updates.stats = stats;
    if (pokemon) updates.pokemon = pokemon;
    if (teams) updates.teams = teams;
    if (battles) updates.battles = battles;
    updates.updatedAt = Date.now();

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!player) {
      return res.status(404).json({ error: 'Joueur non trouvé' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un joueur
app.delete('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Joueur non trouvé' });
    }
    res.json({ message: 'Joueur supprimé', player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST ajouter une victoire
app.post('/api/players/:id/win', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Joueur non trouvé' });
    }
    player.stats.wins += 1;
    player.updatedAt = Date.now();
    const saved = await player.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST ajouter une défaite
app.post('/api/players/:id/loss', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Joueur non trouvé' });
    }
    player.stats.losses += 1;
    player.updatedAt = Date.now();
    const saved = await player.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET statistiques globales
app.get('/api/stats', async (req, res) => {
  try {
    const players = await Player.find();
    const totalWins = players.reduce((sum, p) => sum + p.stats.wins, 0);
    const totalLosses = players.reduce((sum, p) => sum + p.stats.losses, 0);
    const totalPlayers = players.length;
    const topPlayer = players.sort((a, b) => b.stats.wins - a.stats.wins)[0];

    res.json({
      totalPlayers,
      totalWins,
      totalLosses,
      topPlayer: topPlayer ? {
        name: topPlayer.name,
        wins: topPlayer.stats.wins,
        losses: topPlayer.stats.losses,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONNEXION MONGODB & DÉMARRAGE
// ============================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pokebattle';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur PokéBattle démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur connexion MongoDB:', err);
    process.exit(1);
  });

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = app;

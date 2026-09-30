const User = require('../models/userModel');
const mongoose = require('mongoose'); // <-- Requis pour GridFS
const { GridFSBucket } = require('mongodb'); // <-- Requis pour GridFS
const { Readable } = require('stream'); // Module natif de Node.js pour gérer les flux

// Créer un utilisateur
const createUser = async (req, res) => {
  try {
    const { nom, email, height, weight } = req.body;

    if (!nom || !email) {
      return res.status(400).json({ erreur: 'Les champs "nom" et "email" sont obligatoires.' });
    }

    if (typeof nom !== 'string' || nom.length < 2) {
      return res.status(400).json({ erreur: 'Le nom doit faire au moins 2 caractères.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ erreur: 'Format d\'email invalide.' });
    }

    if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
      return res.status(400).json({ erreur: 'Le poids doit être un nombre positif.' });
    }

    // Mongoose s'occupe de valider et formater les données selon le schéma
    const newUser = new User({
      nom,
      email,
      metrics: { height, weight }
    });

    // On attend la sauvegarde dans MongoDB
    await newUser.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès !', data: newUser });
  } catch (error) {
    // Si l'email existe déjà (contrainte unique), MongoDB renverra une erreur 11000
    if (error.code === 11000) {
      return res.status(400).json({ erreur: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ erreur: 'Erreur serveur.', détails: error.message });
  }
};

// Récupérer tous les utilisateurs
const getUsers = async (req, res) => {
  try {
    const users = await User.find(); // Récupère tous les documents de la collection
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
};

// Récupérer un utilisateur par son ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur ou ID invalide.' });
  }
};

// Mettre à jour un utilisateur (PUT)
const updateUser = async (req, res) => {
  try {
    const { nom, email, height, weight } = req.body;
    
    // On construit l'objet de mise à jour dynamiquement
    const updateFields = {};
    if (nom) updateFields.nom = nom;
    if (email) updateFields.email = email;
    
    // Utilisation de la notation pointée pour modifier une sous-propriété
    // sans écraser le reste de l'objet 'metrics'
    if (height !== undefined) updateFields['metrics.height'] = height;
    if (weight !== undefined) updateFields['metrics.weight'] = weight;

    // Le $set indique à MongoDB de ne modifier QUE ces champs précis
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: updateFields }, 
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    
    res.status(200).json({ message: 'Profil mis à jour !', data: updatedUser });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur ou ID invalide.' });
  }
};
// Supprimer un utilisateur (DELETE)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    
    res.status(200).json({ message: 'Utilisateur supprimé avec succès !' });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur ou ID invalide.' });
  }
};

// Ajouter une séance de sport
const addWorkout = async (req, res) => {
  try {
    const { type, duree, distance, date } = req.body;

    if (!type || !duree) {
      return res.status(400).json({ erreur: 'Le type de sport et la durée sont obligatoires.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }

    user.workouts.push({ type, duree, distance, date });
    await user.save(); // On sauvegarde                                                                   
    res.status(201).json({ message: 'Séance ajoutée avec succès !', data: user.workouts.slice(-1)[0] });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur ou ID invalide.' });
  }
};

// Récupérer l'historique des séances d'un utilisateur
const getWorkouts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    res.status(200).json(user.workouts);
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur ou ID invalide.' });
  }
};

// ==========================================
// 1. Sauvegarder un PDF LOCALEMENT
//
// http://localhost:3000/api/users/<USER_ID>/pdf/local
// ==========================================
const savePdfLocal = async (req, res) => {
  try { 
    if (!req.file) return res.status(400).json({ erreur: 'Veuillez fournir un fichier PDF.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ erreur: 'Utilisateur introuvable.' });

    // On lie le chemin du fichier au profil utilisateur
    user.pdfLocalPath = req.file.path;
    await user.save();

    res.status(200).json({ message: 'PDF sauvegardé localement !', path: req.file.path });
  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
};

// ==========================================
// 2. Sauvegarder un PDF sur MONGODB (GridFS)
//
// http://localhost:3000/api/users/<USER_ID>/pdf/gridfs
// ==========================================
const savePdfGridFS = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erreur: 'Veuillez fournir un fichier PDF.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ erreur: 'Utilisateur introuvable.' });

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype
    });

    // NOUVELLE MÉTHODE : On convertit la RAM en flux continu sécurisé
    const readablePdfStream = Readable.from(req.file.buffer);
    
    // On connecte ("pipe") le flux de lecture vers MongoDB
    readablePdfStream.pipe(uploadStream);

    uploadStream.on('finish', async () => {
      user.pdfGridFSId = uploadStream.id;
      await user.save();
      res.status(200).json({ message: 'PDF sauvegardé dans MongoDB via GridFS !', fileId: uploadStream.id });
    });

    uploadStream.on('error', (err) => {
      res.status(500).json({ erreur: 'Erreur de découpage GridFS.' });
    });

  } catch (error) {
    res.status(500).json({ erreur: 'Erreur serveur.' });
  }
};

// ==========================================
// 3. Télécharger un fichier depuis GridFS
//
// http://localhost:3000/api/users/pdf/download/<FILE_ID>
// ==========================================
const downloadPdfGridFS = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // 1. On récupère les métadonnées pour connaître la taille exacte du fichier
    const fileDocument = await db.collection('pdfs.files').findOne({ _id: fileId });

    if (!fileDocument) {
      return res.status(404).json({ erreur: 'Fichier introuvable dans la base de données.' });
    }

    // 2. On configure les en-têtes vitaux pour les lecteurs PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': fileDocument.length,
      // Indique au navigateur de l'afficher directement (inline) avec son nom d'origine
      'Content-Disposition': `inline; filename="${fileDocument.filename}"` 
    });

    // 3. On crée le flux et on le connecte à la réponse
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

  } catch (error) {
    res.status(500).json({ erreur: 'ID de fichier invalide ou erreur serveur.' });
  }
};

// --- N'oublie pas de mettre à jour les exports à la toute fin du fichier ! ---
module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addWorkout,
  getWorkouts,
  savePdfLocal, // NOUVEAU
  savePdfGridFS, // NOUVEAU
  downloadPdfGridFS // NOUVEAU
};
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const fs = require('fs');

// 1. Création automatique du dossier 'uploads' s'il n'existe pas (pour la route locale)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// 2. Configuration Multer pour le stockage LOCAL
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadLocal = multer({ storage: localStorage });

// 3. Configuration Multer pour le stockage en MÉMOIRE (nécessaire avant l'envoi vers GridFS)
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });


// --- ROUTES EXISTANTES ---
router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/:id/workouts', userController.addWorkout);
router.get('/:id/workouts', userController.getWorkouts);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);


// --- NOUVELLES ROUTES POUR LES PDF ---

// 1. Sauvegarder un PDF localement (utilise uploadLocal)
router.post('/:id/pdf/local', uploadLocal.single('pdf'), userController.savePdfLocal);

// 2. Sauvegarder un PDF sur MongoDB via GridFS (utilise uploadMemory)
router.post('/:id/pdf/gridfs', uploadMemory.single('pdf'), userController.savePdfGridFS);

// 3. Télécharger un PDF depuis MongoDB GridFS
router.get('/pdf/download/:fileId', userController.downloadPdfGridFS);

module.exports = router;
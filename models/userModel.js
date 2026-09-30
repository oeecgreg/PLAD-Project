const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  type: { type: String, required: true },
  duree: { type: Number, required: true },
  distance: { type: Number },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  metrics: {
    height: { type: Number },
    weight: { type: Number }
  },
  workouts: [workoutSchema],
  // NOUVEAUX CHAMPS POUR LES FICHIERS :
  pdfLocalPath: { type: String }, // Chemin du fichier sur ton ordinateur
  pdfGridFSId: { type: mongoose.Schema.Types.ObjectId } // ID du fichier dans la base MongoDB
}, {
    collection: "collection1"
});

module.exports = mongoose.model('User', userSchema);
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
 
const app = express();
app.use(express.json());
 
const url = "mongodb://localhost:27017/";
const dbName = "bibliotheque";
const client = new MongoClient(url);
 
const port = 4000;
let db, Livres;
 
async function run() {
  try {
      await client.connect();
      db = client.db(dbName);
      Livres = db.collection('livres');
      console.log("Connecté à MongoDB");
  } catch (error) {
      console.log(error);
  }
}

run().catch(console.dir);

// Récupérer tous les livres
app.get('/livres', async (req, res) => {
  try {
    const { auteur, disponible, genre, minNote, tri, ordre } = req.query;

    const filtre = {};

    if (auteur) {
      filtre.auteur = auteur;
    }
    
    if (disponible !== undefined) {
      filtre.disponible = disponible === 'true';
    }
    
    if (genre) {
      filtre.genres = genre;
    }
    
    if (minNote) {
      filtre.note = { $gte: parseFloat(minNote) };
    }

    const triMongo = {};
    if (tri === 'note' || tri === 'annee') {
      triMongo[tri] = ordre === 'desc' ? -1 : 1;
    }

    const livres = await Livres.find(filtre).sort(triMongo).toArray();
    res.json(livres);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des livres' });
  }
});

// Ajouter un nouveau livre
app.post('/livres', async (req, res) => {
  try {
    const { titre, auteur, annee, note, genres } = req.body;
    
    if (!titre || !auteur) {
      return res.status(400).json({ error: "Le titre et l'auteur sont obligatoires." });
    }
    if (annee <= 1800) {
      return res.status(400).json({ error: "La date est incorrecte." });
    }
    if (note < 0 || note > 5) {
      return res.status(400).json({ error: "La note doit être comprise entre 0 et 5." });
    }
    if (!Array.isArray(genres)) {
      return res.status(400).json({ error: "Il faut que 'genres' soit un tableau." });
    }
    
      const livre = req.body;
      const result = await Livres.insertOne(livre);
      res.status(201).json(result);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
});

// Modifier un livre existant
app.put('/livres/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    
    delete updates._id;

    const result = await Livres.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json({ message: 'Livre mis à jour avec succès' });
  } catch (err) {
    res.status(400).json({ error: 'Erreur lors de la modification du livre' });
  }
});


// Supprimer un livre
app.delete('/livres/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Livres.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json({ message: 'Livre supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du livre' });
  }
});

// Récupérer un livre par son ID
app.get('/livres/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const livre = await Livres.findOne({ _id: new ObjectId(id) });
    if (!livre) return res.status(404).json({ error: 'Livre non trouvé' });
    res.json(livre);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du livre' });
  }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});

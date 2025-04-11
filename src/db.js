const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/cleanwalk.db');

console.log('Connexion à la base de données:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données SQLite établie');
        initializeDatabase();
    }
});

function initializeDatabase() {
db.serialize(() => {
        db.run('DROP TABLE IF EXISTS events', (err) => {
            if (err) {
                console.error('Erreur lors de la suppression de la table events:', err);
            } else {
                console.log('Table events supprimée');
                
                db.run(`CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
        date TEXT NOT NULL,
                    location TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    participants INTEGER DEFAULT 0,
                    waste_collected REAL DEFAULT 0
                )`, (err) => {
                    if (err) {
                        console.error('Erreur lors de la création de la table events:', err);
                    } else {
                        console.log('Table events créée avec succès');
                        insertTestData();
                    }
                });
            }
        });
    });
}

function insertTestData() {
    console.log('Insertion des données de test...');
    
    const pastEvents = [
        {
            title: "Nettoyage du Parc de la Tête d'Or",
            description: "Grand nettoyage du parc avec focus sur les zones boisées",
            date: "2023-12-15",
            location: "Parc de la Tête d'Or, Lyon",
            latitude: 45.7772,
            longitude: 4.8557,
            participants: 45,
            waste_collected: 120.5
        },
        {
            title: "Clean Walk Vieux Lyon",
            description: "Nettoyage des rues du Vieux Lyon",
            date: "2023-11-20",
            location: "Vieux Lyon, Lyon",
            latitude: 45.7597,
            longitude: 4.8280,
            participants: 32,
            waste_collected: 85.2
        },
        {
            title: "Nettoyage des Berges du Rhône",
            description: "Collecte de déchets le long des berges du Rhône",
            date: "2023-10-10",
            location: "Berges du Rhône, Lyon",
            latitude: 45.7500,
            longitude: 4.8500,
            participants: 28,
            waste_collected: 65.8
        },
        {
            title: "Clean Walk Paris Centre",
            description: "Nettoyage des rues du centre de Paris",
            date: "2023-12-05",
            location: "Quartier du Marais, Paris",
            latitude: 48.8566,
            longitude: 2.3522,
            participants: 65,
            waste_collected: 150.3
        },
        {
            title: "Nettoyage des Canaux de Strasbourg",
            description: "Collecte de déchets dans les canaux de la Petite France",
            date: "2023-11-15",
            location: "Petite France, Strasbourg",
            latitude: 48.5819,
            longitude: 7.7458,
            participants: 38,
            waste_collected: 95.7
        },
        {
            title: "Clean Walk Plage de Marseille",
            description: "Nettoyage de la plage du Prado",
            date: "2023-10-25",
            location: "Plage du Prado, Marseille",
            latitude: 43.2697,
            longitude: 5.3959,
            participants: 52,
            waste_collected: 180.2
        },
        {
            title: "Nettoyage des Jardins de Bordeaux",
            description: "Collecte dans les jardins publics de Bordeaux",
            date: "2023-09-30",
            location: "Jardin Public, Bordeaux",
            latitude: 44.8378,
            longitude: -0.5792,
            participants: 41,
            waste_collected: 110.8
        },
        {
            title: "Clean Walk Lille Centre",
            description: "Nettoyage du centre-ville de Lille",
            date: "2023-09-15",
            location: "Centre-ville, Lille",
            latitude: 50.6292,
            longitude: 3.0573,
            participants: 47,
            waste_collected: 125.6
        },
        {
            title: "Nettoyage du Parc de la Tête d'Or",
            description: "Grand nettoyage du parc avec la participation des habitants",
            date: "2024-02-15",
            location: "Lyon",
            latitude: 45.7772,
            longitude: 4.8549,
            participants: 120,
            waste_collected: 150
        },
        {
            title: "Clean Walk Marseille",
            description: "Nettoyage des plages du Prado",
            date: "2024-02-20",
            location: "Marseille",
            latitude: 43.2697,
            longitude: 5.3959,
            participants: 85,
            waste_collected: 200
        },
        {
            title: "Nettoyage des Berges de la Seine",
            description: "Action citoyenne pour nettoyer les berges",
            date: "2024-02-25",
            location: "Paris",
            latitude: 48.8566,
            longitude: 2.3522,
            participants: 200,
            waste_collected: 300
        }
    ];

    const upcomingEvents = [
        {
            title: "Clean Walk Bordeaux",
            description: "Nettoyage des quais de la Garonne",
            date: "2025-01-10",
            location: "Bordeaux",
            latitude: 44.8378,
            longitude: -0.5792,
            participants: 150,
            waste_collected: 225
        },
        {
            title: "Nettoyage du Canal Saint-Martin",
            description: "Action citoyenne pour préserver le canal",
            date: "2025-01-25",
            location: "Paris",
            latitude: 48.8708,
            longitude: 2.3686,
            participants: 180,
            waste_collected: 270
        },
        {
            title: "Clean Walk Nice",
            description: "Nettoyage de la Promenade des Anglais",
            date: "2025-02-15",
            location: "Nice",
            latitude: 43.7009,
            longitude: 7.2684,
            participants: 95,
            waste_collected: 142
        },
        {
            title: "Nettoyage du Parc de la Villette",
            description: "Grand nettoyage du parc avec animations",
            date: "2025-02-23",
            location: "Paris",
            latitude: 48.8934,
            longitude: 2.3888,
            participants: 220,
            waste_collected: 330
        },
        {
            title: "Clean Walk Strasbourg",
            description: "Nettoyage des berges de l'Ill",
            date: "2025-03-02",
            location: "Strasbourg",
            latitude: 48.5734,
            longitude: 7.7521,
            participants: 110,
            waste_collected: 165
        },
        {
            title: "Clean Walk Nantes",
            description: "Nettoyage des bords de l'Erdre",
            date: "2025-03-20",
            location: "Nantes",
            latitude: 47.2184,
            longitude: -1.5536,
            participants: 0,
            waste_collected: 0
        },
        {
            title: "Nettoyage du Parc des Buttes-Chaumont",
            description: "Action citoyenne pour préserver le parc",
            date: "2025-04-05",
            location: "Paris",
            latitude: 48.8807,
            longitude: 2.3823,
            participants: 0,
            waste_collected: 0
        },
        {
            title: "Clean Walk Montpellier",
            description: "Nettoyage des plages du Lez",
            date: "2025-05-15",
            location: "Montpellier",
            latitude: 43.6108,
            longitude: 3.8767,
            participants: 0,
            waste_collected: 0
        },
        {
            title: "Nettoyage du Parc de Sceaux",
            description: "Grand nettoyage du parc historique",
            date: "2025-06-01",
            location: "Sceaux",
            latitude: 48.7775,
            longitude: 2.3000,
            participants: 0,
            waste_collected: 0
        }
    ];

    const stmt = db.prepare("INSERT INTO events (title, description, date, location, latitude, longitude, participants, waste_collected) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    [...pastEvents, ...upcomingEvents].forEach(event => {
                stmt.run(
            event.title,
            event.description,
                    event.date,
            event.location,
            event.latitude,
            event.longitude,
            event.participants,
            event.waste_collected
                );
            });

            stmt.finalize();
    console.log('Données de test insérées avec succès');
        }

module.exports = db; 
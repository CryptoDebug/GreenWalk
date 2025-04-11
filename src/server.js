const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

const options = {
    key: fs.readFileSync(path.join(__dirname, '../config/ssl/private.key')),
    cert: fs.readFileSync(path.join(__dirname, '../config/ssl/certificate.crt'))
};

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/api/events', (req, res) => {
    console.log('Récupération des événements...');
    db.all("SELECT * FROM events", (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des événements:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`${rows.length} événements trouvés`);
        console.log('Événements:', rows);
        res.json(rows);
    });
});

app.post('/api/events/:id/join', (req, res) => {
    const eventId = req.params.id;
    console.log(`Tentative de rejoindre l'événement ${eventId}...`);
    
    db.run(
        "UPDATE events SET participants = participants + 1 WHERE id = ?",
        [eventId],
        function(err) {
            if (err) {
                console.error('Erreur lors de la mise à jour des participants:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                console.error(`Événement ${eventId} non trouvé`);
                res.status(404).json({ error: 'Événement non trouvé' });
                return;
            }
            console.log(`Participant ajouté à l'événement ${eventId}`);
            res.json({ success: true });
        }
    );
});

app.post('/api/events', async (req, res) => {
    const { name, date, description, organizer, difficulty, duration, type, address } = req.body;
    console.log('Création d\'un nouvel événement:', { name, date, address });
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            console.error('Adresse non trouvée:', address);
            throw new Error('Adresse non trouvée');
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        console.log('Coordonnées trouvées:', { lat, lng });

        db.run(
            "INSERT INTO events (name, date, description, organizer, difficulty, duration, type, address, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, date, description, organizer, difficulty, duration, type, address, lat, lng],
            function(err) {
                if (err) {
                    console.error('Erreur lors de l\'insertion de l\'événement:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                console.log('Événement créé avec succès, ID:', this.lastID);
                res.json({
                    id: this.lastID,
                    name, date, description, organizer, difficulty, duration, type, address, lat, lng
                });
            }
        );
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        res.status(400).json({ error: error.message });
    }
});

const server = https.createServer(options, app);
const PORT = 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    const networkInterfaces = require('os').networkInterfaces();
    const addresses = [];
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((networkInterface) => {
            if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                addresses.push(networkInterface.address);
            }
        });
    });

    console.log(`Serveur HTTPS démarré sur le port ${PORT}`);
    console.log('Accédez à l\'application via:');
    console.log(`- https://localhost:${PORT}`);
    addresses.forEach(ip => {
        console.log(`- https://${ip}:${PORT}`);
    });
}); 
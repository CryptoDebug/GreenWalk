let map;
let markers = [];
let currentInfoWindow = null;
let userMarker = null;
let impactChart = null;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 46.603354, lng: 1.888334 },
        zoom: 6,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            }
        ]
    });

    const zoomControlDiv = document.createElement('div');
    const zoomControl = new ZoomControl(zoomControlDiv, map);
    zoomControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(zoomControlDiv);

    centerMapOnUser();
    
    loadEvents();
    initializeImpactChart();
}

function centerMapOnUser() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('Position de l\'utilisateur:', userLocation);
                
                map.setCenter(userLocation);
                map.setZoom(15);
                
                if (userMarker) {
                    userMarker.setMap(null);
                }
                
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Vous êtes ici",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#28a745',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    }
                });
                
                const infoWindow = new google.maps.InfoWindow({
                    content: '<div class="popup-content"><h4>Vous êtes ici</h4></div>'
                });
                
                userMarker.addListener('click', () => {
                    infoWindow.open(map, userMarker);
                });
                
                hideLoading();
            },
            (error) => {
                hideLoading();
                console.error('Erreur de géolocalisation:', error);
                showError('Impossible d\'accéder à votre position. Veuillez vérifier les paramètres de géolocalisation de votre navigateur.');
                map.setCenter({ lat: 46.603354, lng: 1.888334 });
                map.setZoom(6);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.error('La géolocalisation n\'est pas supportée par votre navigateur');
        showError('La géolocalisation n\'est pas supportée par votre navigateur');
        map.setCenter({ lat: 46.603354, lng: 1.888334 });
        map.setZoom(6);
    }
}

class ZoomControl {
    constructor(controlDiv, map) {
        const controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Zoom';
        controlDiv.appendChild(controlUI);

        const controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '16px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';
        controlText.innerHTML = 'Zoom';
        controlUI.appendChild(controlText);

        controlUI.addEventListener('click', () => {
            map.setZoom(map.getZoom() + 1);
        });
    }
}

function initializeImpactChart() {
    const ctx = document.getElementById('impactChart').getContext('2d');
    impactChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Déchets collectés (kg)',
                data: [],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Kilogrammes'
                    }
                }
            }
        }
    });
}

function updateImpactChart(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredEvents = events.filter(event => new Date(event.date) <= today);
    
    filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const monthlyData = {};
    filteredEvents.forEach(event => {
        const date = new Date(event.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const waste = event.waste_collected > 0 ? event.waste_collected : event.participants * 1.5;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                totalWaste: 0,
                eventCount: 0
            };
        }
        monthlyData[monthKey].totalWaste += waste;
        monthlyData[monthKey].eventCount++;
    });
    
    const labels = Object.keys(monthlyData).map(monthKey => {
        const [year, month] = monthKey.split('-');
        return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    });
    
    const wasteData = Object.values(monthlyData).map(data => data.totalWaste);
    
    console.log('Labels du graphique:', labels);
    console.log('Données du graphique:', wasteData);
    
    impactChart.data.labels = labels;
    impactChart.data.datasets[0].data = wasteData;
    impactChart.update();
}

async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = events.filter(event => event.date >= today);
        
        addMarkers(upcomingEvents);
        displayEvents(upcomingEvents);
        updateCounters(events);
        updateImpactChart(events);
    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        showAlert('Erreur lors du chargement des événements', 'danger');
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';

    if (events.length === 0) {
        eventsList.innerHTML = '<div class="alert alert-info">Aucun événement à venir</div>';
        return;
    }

    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsList.appendChild(eventCard);
    });
}

function addMarkers(events) {
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    events.forEach(event => {
        const marker = new google.maps.Marker({
            position: { lat: event.latitude, lng: event.longitude },
            map: map,
            title: event.title,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="popup-content">
                    <h4>${event.title}</h4>
                    <p><i class="fas fa-calendar"></i> ${formatDate(event.date)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <p><i class="fas fa-users"></i> ${event.participants} participants</p>
                    <p><i class="fas fa-trash"></i> ${event.waste_collected > 0 ? event.waste_collected : event.participants * 1.5} kg ${event.waste_collected > 0 ? 'collectés' : 'prévisionnels'}</p>
                    <button class="btn btn-success btn-sm mt-2" onclick="joinEvent(${event.id})">
                        Rejoindre
                    </button>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'col-md-6';
    
    const cardContent = `
        <div class="event-card">
            <div class="card-body">
                <h5 class="card-title">${event.title}</h5>
                <p class="card-text">
                    <i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
                <p class="card-text">
                    <i class="fas fa-map-marker-alt"></i> ${event.location}
                </p>
                <p class="card-text">
                    <i class="fas fa-users"></i> ${event.participants || 0} participants
                </p>
                <p class="card-text">
                    <i class="fas fa-trash"></i> ${event.waste_collected || 0} kg de déchets collectés
                </p>
                <button class="btn btn-success" onclick="joinEvent(${event.id})">
                    <i class="fas fa-plus"></i> Rejoindre
                </button>
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

function showEventOnMap(lat, lng) {
    map.setCenter({ lat, lng });
    map.setZoom(15);
}

function joinEvent(eventId) {
    fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la participation à l\'événement');
        }
        return response.json();
    })
    .then(updatedEvent => {
        const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventCard) {
            const participantsElement = eventCard.querySelector('.participants-count');
            if (participantsElement) {
                participantsElement.textContent = `${updatedEvent.participants} participants`;
            }
        }
        
        loadEvents();
        showSuccess('Vous avez rejoint l\'événement avec succès !');
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Erreur lors de la participation à l\'événement');
    });
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    document.body.appendChild(spinner);
}

function hideLoading() {
    const spinner = document.querySelector('.spinner');
    if (spinner) {
        spinner.remove();
    }
}

function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

document.getElementById('create-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
        const formData = new FormData(e.target);
        const eventData = {
            name: formData.get('name'),
            date: formData.get('date'),
            description: formData.get('description'),
            organizer: formData.get('organizer'),
            difficulty: formData.get('difficulty'),
            duration: formData.get('duration'),
            type: formData.get('type'),
            address: formData.get('address')
        };

    showLoading();
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            showSuccess('Événement créé avec succès !');
            e.target.reset();
            loadEvents();
        } else {
            showError(data.error || 'Erreur lors de la création de l\'événement');
        }
    } catch (error) {
        hideLoading();
        showError('Erreur lors de la création de l\'événement');
        console.error('Error:', error);
    }
});

function updateCounters(events) {
    console.log('Mise à jour des compteurs avec les événements:', events);

    const totalParticipants = events.reduce((sum, event) => sum + (event.participants || 0), 0);
    const totalEvents = events.length;
    const totalWaste = events.reduce((sum, event) => sum + ((event.participants || 0) * 5), 0);

    console.log('Total participants:', totalParticipants);
    console.log('Total événements:', totalEvents);
    console.log('Total déchets:', totalWaste);

    document.getElementById('participantsCount').textContent = totalParticipants;
    document.getElementById('eventsCount').textContent = totalEvents;
    document.getElementById('wasteCount').textContent = totalWaste;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeImpactChart();
    initMap();
});

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    if (map) {
        updateMapTheme(savedTheme);
    }
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function updateMapTheme(theme) {
    if (map) {
        const styles = theme === 'dark' ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }]
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }]
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }]
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }]
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }]
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }]
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }]
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }]
            }
        ] : [];
        
        map.setOptions({ styles: styles });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        event.preventDefault();
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const sectionPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    updateMapTheme(newTheme);
}

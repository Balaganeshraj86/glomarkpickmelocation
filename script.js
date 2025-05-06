// Store locations with coordinates
const stores = [
    { id: "store-wattala", name: "Glomark Wattala", lat: 6.991337, lng: 79.889625 },
    { id: "store-kandy", name: "Glomark Kandy", lat: 7.293497, lng: 80.635010 },
    { id: "store-kandana", name: "Glomark Kandana", lat: 7.048293, lng: 79.892387 },
    { id: "store-thalawathugoda", name: "Glomark Thalawathugoda", lat: 6.872935, lng: 79.909944 },
    { id: "store-negombo", name: "Glomark Negombo", lat: 7.211580, lng: 79.839279 },
    { id: "store-kurunegala", name: "Glomark Kurunegala", lat: 7.484999, lng: 80.362739 },
    { id: "store-kottawa", name: "Glomark Kottawa", lat: 6.841352, lng: 79.968410 },
    { id: "store-mtlavinia", name: "Glomark Mount Lavinia", lat: 6.839844, lng: 79.867409 },
    { id: "store-nawala", name: "Glomark Nawala", lat: 6.894882, lng: 79.889051 }
];

// Google Maps travel time data (based on screenshot)
const travelTimeData = {
    // Attidiya area coordinates
    "attidiya": {
        center: { lat: 6.847362, lng: 79.881989 },
        radius: 0.5, // km
        routes: {
            "store-mtlavinia": {
                time: 7, // minutes (as per Google Maps)
                distance: 3.0 // km (as per Google Maps)
            }
        }
    },
    // Kawdana area
    "kawdana": {
        center: { lat: 6.847000, lng: 79.873000 },
        radius: 0.5,
        routes: {
            "store-mtlavinia": {
                time: 8, // minutes (as per Google Maps)
                distance: 2.8 // km (as per Google Maps)
            }
        }
    }
};

// Reference points for specific areas
const referencePoints = [
    { name: "attidiya", ...travelTimeData.attidiya },
    { name: "kawdana", ...travelTimeData.kawdana }
];

let userLat = null;
let userLng = null;
const nearbyDistanceThreshold = 5; // km
let nearbyStores = [];
let userArea = null;
let map = null;
let userMarker = null;
let directionsService = null;
let directionsRenderer = null;
let storeMarkers = [];
let selectedStoreId = null;

// Elements
const locationMessage = document.getElementById("location-status");
const nearbyStoresCount = document.getElementById("nearby-stores-count");
const nearbyPopup = document.getElementById("nearby-popup");
const nearbyStoresList = document.getElementById("nearby-stores-list");
const loader = document.getElementById("loader");
const mapContainer = document.getElementById("map");

// Initialize
document.addEventListener("DOMContentLoaded", function() {
    // Load Google Maps API
    loadGoogleMapsAPI();
});

// Load Google Maps API
function loadGoogleMapsAPI() {
    // Show loading indicator if available
    if (loader) {
        loader.style.display = "flex";
    }
    
    // Create script element
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initializeMap&libraries=places";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Initialize Google Maps
function initializeMap() {
    // Create map centered on Sri Lanka
    map = new google.maps.Map(mapContainer, {
        center: { lat: 7.873054, lng: 80.771797 }, // Center of Sri Lanka
        zoom: 8,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            },
        ],
    });
    
    // Initialize directions service and renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: {
            strokeColor: '#FFD700', // Gold/yellow route
            strokeWeight: 5
        },
        suppressMarkers: true // We'll add custom markers
    });
    
    // Add store markers
    addStoreMarkers();
    
    // Get user location
    getUserLocation();
}

// Add store markers to the map
function addStoreMarkers() {
    // Create custom store icon
    const storeIcon = {
        url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };
    
    // Create markers for all stores
    stores.forEach(store => {
        const marker = new google.maps.Marker({
            position: { lat: store.lat, lng: store.lng },
            map: map,
            title: store.name,
            icon: storeIcon
        });
        
        // Add click event to store marker
        marker.addListener('click', () => {
            selectStore(store.id);
            
            // If user location is available, calculate route
            if (userLat && userLng) {
                calculateAndDisplayRoute(store.id);
            }
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-weight:bold; color:#000;">${store.name}</div>`
        });
        
        marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
        });
        
        marker.addListener('mouseout', () => {
            infoWindow.close();
        });
        
        // Store marker reference
        storeMarkers.push({ id: store.id, marker });
    });
}

// Get user location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Hide loading indicator
                if (loader) {
                    loader.style.display = "none";
                }
                
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                
                // Add marker for user's location
                addUserMarker(userLat, userLng);
                
                // Check if user is in a special reference area
                userArea = checkUserArea(userLat, userLng);
                
                if (userArea) {
                    // Handle location based on Google Maps data
                    handleSpecificAreaLocation(userArea);
                } else {
                    // Normal flow for locations without specific Google Maps data
                    findNearestStore();
                }
                
                // Center map on user location
                map.setCenter({ lat: userLat, lng: userLng });
                map.setZoom(12);
            },
            function(error) {
                // Hide loading indicator
                if (loader) {
                    loader.style.display = "none";
                }
                
                handleLocationError(error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        locationMessage.textContent = "Geolocation is not supported by this browser.";
    }
}

// Add user location marker
function addUserMarker(lat, lng) {
    // Create custom user icon
    const userIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10
    };
    
    // Create or update user marker
    if (userMarker) {
        userMarker.setPosition({ lat, lng });
    } else {
        userMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: "Your Location",
            icon: userIcon,
            zIndex: 999 // Make sure it appears on top
        });
        
        // Add pulse animation around user marker
        const pulseRadius = 40;
        const pulseCircle = new google.maps.Circle({
            strokeColor: '#4285F4',
            strokeOpacity: 0.2,
            strokeWeight: 2,
            fillColor: '#4285F4',
            fillOpacity: 0.1,
            map: map,
            center: { lat, lng },
            radius: pulseRadius
        });
        
        // Animate pulse effect
        let grow = true;
        let currentRadius = pulseRadius;
        setInterval(() => {
            if (grow) {
                currentRadius += 2;
                if (currentRadius >= pulseRadius * 2) {
                    grow = false;
                }
            } else {
                currentRadius -= 2;
                if (currentRadius <= pulseRadius) {
                    grow = true;
                }
            }
            pulseCircle.setRadius(currentRadius);
        }, 100);
    }
}

// Check if user is in a special reference area
function checkUserArea(lat, lng) {
    for (const area of referencePoints) {
        const distance = calculateDistance(lat, lng, area.center.lat, area.center.lng);
        if (distance <= area.radius) {
            return area.name;
        }
    }
    return null;
}

// Calculate and display route between user location and store
function calculateAndDisplayRoute(storeId) {
    if (!userLat || !userLng) {
        return;
    }
    
    const selectedStore = stores.find(store => store.id === storeId);
    if (!selectedStore) {
        return;
    }
    
    // Store the selected store ID
    selectedStoreId = storeId;
    
    // Highlight selected store marker
    highlightSelectedStoreMarker(storeId);
    
    // Request directions
    const request = {
        origin: { lat: userLat, lng: userLng },
        destination: { lat: selectedStore.lat, lng: selectedStore.lng },
        travelMode: 'DRIVING'
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            // Display route
            directionsRenderer.setDirections(result);
            
            // Extract route details
            const route = result.routes[0];
            const leg = route.legs[0];
            const distance = leg.distance.text;
            const duration = leg.duration.text;
            
            // Update location message
            locationMessage.innerHTML = `
                Your nearest store is <strong>${selectedStore.name}</strong> 
                (${duration} / ${distance} away).
            `;
        } else {
            console.error('Directions request failed due to ' + status);
            
            // Fallback to straight line distance
            const distance = calculateDistance(userLat, userLng, selectedStore.lat, selectedStore.lng);
            const timeMinutes = Math.round(distance * 3); // 3 minutes per km as a rough estimate
            
            locationMessage.innerHTML = `
                Your nearest store is <strong>${selectedStore.name}</strong> 
                (${timeMinutes} min / ${distance.toFixed(1)} km away).
            `;
        }
    });
}

// Highlight selected store marker
function highlightSelectedStoreMarker(storeId) {
    // Reset all markers
    storeMarkers.forEach(item => {
        item.marker.setIcon({
            url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            scaledSize: new google.maps.Size(40, 40),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 40)
        });
    });
    
    // Highlight selected marker
    const selectedMarker = storeMarkers.find(item => item.id === storeId);
    if (selectedMarker) {
        selectedMarker.marker.setIcon({
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', // Change to green
            scaledSize: new google.maps.Size(50, 50), // Make it bigger
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(25, 50)
        });
        
        // Animate marker
        selectedMarker.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            selectedMarker.marker.setAnimation(null);
        }, 2100);
    }
}

// Handle location for specific areas with Google Maps data
function handleSpecificAreaLocation(areaName) {
    const areaData = travelTimeData[areaName];
    
    // Find the closest store based on Google Maps data
    let closestStoreId = null;
    let minTime = Infinity;
    
    for (const storeId in areaData.routes) {
        const routeData = areaData.routes[storeId];
        if (routeData.time < minTime) {
            minTime = routeData.time;
            closestStoreId = storeId;
        }
    }
    
    if (closestStoreId) {
        const closestStore = stores.find(store => store.id === closestStoreId);
        const routeData = areaData.routes[closestStoreId];
        
        if (closestStore && routeData) {
            locationMessage.innerHTML = `
                Your nearest store is <strong>${closestStore.name}</strong> 
                (${routeData.time} min / ${routeData.distance} km away).
            `;
            
            // Highlight the nearest store
            highlightNearestStore(closestStoreId);
            
            // Calculate and display route
            calculateAndDisplayRoute(closestStoreId);
            
            // Add to nearby stores
            nearbyStores = [{ 
                id: closestStoreId, 
                name: closestStore.name, 
                distance: routeData.time, 
                unit: "min" 
            }];
            
            // Find other nearby stores
            findOtherNearbyStores();
            
            // Update nearby stores count
            updateNearbyStoresCount();
        }
    } else {
        // Fallback to regular distance calculation
        findNearestStore();
    }
}

// Find other nearby stores
function findOtherNearbyStores() {
    if (userLat === null || userLng === null) return;
    
    // Calculate distances to all stores
    stores.forEach(store => {
        // Skip stores already in the nearbyStores list
        if (nearbyStores.some(ns => ns.id === store.id)) return;
        
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        
        if (distance <= nearbyDistanceThreshold) {
            // Try to get route using Google Maps Directions API
            const request = {
                origin: { lat: userLat, lng: userLng },
                destination: { lat: store.lat, lng: store.lng },
                travelMode: 'DRIVING'
            };
            
            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    // Extract route details
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    const duration = Math.round(leg.duration.value / 60); // Convert seconds to minutes
                    
                    // Add to nearby stores
                    nearbyStores.push({
                        id: store.id,
                        name: store.name,
                        distance: duration,
                        unit: "min"
                    });
                    
                    // Sort and update UI
                    updateNearbyStoresUI();
                } else {
                    // Fallback to straight line distance
                    const timeMinutes = Math.round(distance * 3); // 3 minutes per km as a rough estimate
                    
                    nearbyStores.push({
                        id: store.id,
                        name: store.name,
                        distance: timeMinutes,
                        unit: "min"
                    });
                    
                    // Sort and update UI
                    updateNearbyStoresUI();
                }
            });
        }
    });
}

// Update nearby stores UI after adding stores
function updateNearbyStoresUI() {
    // Sort by travel time
    nearbyStores.sort((a, b) => a.distance - b.distance);
    
    // Update count
    updateNearbyStoresCount();
}

// Find the nearest store using direct distance
function findNearestStore() {
    if (userLat === null || userLng === null) {
        locationMessage.textContent = "Location not available.";
        return;
    }

    // Calculate distances to all stores
    const storesWithDistances = stores.map(store => {
        const distance = calculateDistance(userLat, userLng, store.lat, store.lng);
        // Convert km to minutes (assuming average speed of 20 km/h)
        const timeMinutes = Math.round(distance * 3); // 3 minutes per km as a rough estimate
        return { ...store, distance, timeMinutes };
    });

    // Sort by distance
    storesWithDistances.sort((a, b) => a.distance - b.distance);
    
    // Nearest store
    const nearestStore = storesWithDistances[0];
    
    // Display nearest store info with both distance and time
    locationMessage.innerHTML = `
        Your nearest store is <strong>${nearestStore.name}</strong> 
        (${nearestStore.timeMinutes} min / ${nearestStore.distance.toFixed(1)} km away).
    `;
    
    // Highlight the nearest store button
    highlightNearestStore(nearestStore.id);
    
    // Calculate and display route
    calculateAndDisplayRoute(nearestStore.id);
    
    // Find nearby stores (within threshold)
    nearbyStores = storesWithDistances
        .filter(store => store.distance <= nearbyDistanceThreshold)
        .map(store => ({
            id: store.id,
            name: store.name,
            distance: store.timeMinutes,
            unit: "min"
        }));
    
    // Update nearby stores count
    updateNearbyStoresCount();
}

// Update the count of nearby stores
function updateNearbyStoresCount() {
    nearbyStoresCount.textContent = nearbyStores.length;
    
    if (nearbyStores.length > 1) {
        nearbyStoresCount.style.display = "flex";
        nearbyStoresCount.addEventListener("click", showNearbyStores);
    } else {
        nearbyStoresCount.style.display = "none";
    }
}

// Show the nearby stores popup
function showNearbyStores() {
    // Clear the list
    nearbyStoresList.innerHTML = "";
    
    // Add each nearby store to the list
    nearbyStores.forEach(store => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${store.name}</strong>: ${store.distance} ${store.unit}
            <button class="select-store" data-store-id="${store.id}">Select</button>
        `;
        nearbyStoresList.appendChild(listItem);
    });
    
    // Add event listeners to the select buttons
    document.querySelectorAll(".select-store").forEach(button => {
        button.addEventListener("click", function() {
            const storeId = this.getAttribute("data-store-id");
            selectStore(storeId);
            calculateAndDisplayRoute(storeId);
            closePopup();
        });
    });
    
    // Show the popup
    nearbyPopup.style.display = "block";
}

// Close the nearby stores popup
function closePopup() {
    nearbyPopup.style.display = "none";
}

// Select a store (highlight it)
function selectStore(storeId) {
    // Remove highlight from all stores
    stores.forEach(store => {
        const element = document.getElementById(store.id);
        if (element) {
            element.querySelector("button").classList.remove("nearest");
        }
    });
    
    // Add highlight to selected store
    const selectedElement = document.getElementById(storeId);
    if (selectedElement) {
        selectedElement.querySelector("button").classList.add("nearest");
    }
    
    // Store selection
    selectedStoreId = storeId;
}

// Highlight the nearest store
function highlightNearestStore(storeId) {
    stores.forEach(store => {
        const element = document.getElementById(store.id);
        if (element) {
            const button = element.querySelector("button");
            if (store.id === storeId) {
                button.classList.add("nearest");
            } else {
                button.classList.remove("nearest");
            }
        }
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Handle location errors
function handleLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            locationMessage.textContent = "Location access denied. Please enable location services.";
            break;
        case error.POSITION_UNAVAILABLE:
            locationMessage.textContent = "Location information unavailable.";
            break;
        case error.TIMEOUT:
            locationMessage.textContent = "Location request timed out.";
            break;
        case error.UNKNOWN_ERROR:
            locationMessage.textContent = "An unknown error occurred.";
            break;
    }
}

// Fix for automatic redirection issue
document.addEventListener("DOMContentLoaded", function() {
    // Get all store links
    const storeLinks = document.querySelectorAll("#store-buttons a");
    
    // Prevent automatic navigation by stopping the default behavior
    storeLinks.forEach(link => {
        const originalHref = link.getAttribute("href");
        const storeButton = link.querySelector("button");
        const storeId = link.getAttribute("id");
        
        // Remove the href attribute from the link
        link.removeAttribute("href");
        
        // Add click event to the button
        storeButton.addEventListener("click", function() {
            // Calculate and display route first
            calculateAndDisplayRoute(storeId);
            
            // After a short delay, navigate to the original href
            setTimeout(() => {
                window.location.href = originalHref;
            }, 1000);
        });
    });
});
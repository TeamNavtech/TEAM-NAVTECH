import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import { startEmergency, cancelEmergency } from "./sos.js";

import {
  getFirestore,
  collection,
  onSnapshot
} from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { MapProvider } from "./map.provider.js";

/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyCt31BARLXsFKuNcQmSDupaAwNH0MV5MRI",
  authDomain: "women-safety-prototype-ea8c1.firebaseapp.com",
  projectId: "women-safety-prototype-ea8c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== STATE ===== */
let currentUserPos = null;
let previewDestination = null;
let cachedCrimeZones = [];
let lastCrimeDraw = 0;
let safePlaces = [];
let mapInitialized = false;


window.addEventListener("DOMContentLoaded", () => {

function showView(id) {
  // Hide ALL views first
  document.querySelectorAll(".content-view").forEach(v => {
    v.classList.remove("active");
    v.style.display = "none"; 
  });

  // Show only the target view
  const targetView = document.getElementById(id);
  if (targetView) {
    targetView.classList.add("active");
    // Ensure correct display type
    targetView.style.display = (id === "safety-map-view") ? "flex" : "block";
  }

  // Handle Map Refresh
  if (id === "safety-map-view") {
    if (!mapInitialized) {
      MapProvider.init("map", [26.7606, 83.3732], 13);
      mapInitialized = true;
    }
    
    // Ensure simulate button is reset
    const sim = document.getElementById("simulateRoute");
    if (sim) {
      sim.disabled = true;
      sim.style.opacity = "0.5";
    }

    MapProvider.refresh();
  }
}

  /* ================= NAVIGATION ================= */
document.getElementById("btnHome")?.addEventListener("click", () => {
  showView("welcome-view");
});


document.getElementById("alternateRoute")
  ?.addEventListener("click", () => {
    // intentionally empty for now
  });

  /* ================= SOS ================= */
  document.querySelector(".sos-float")
    ?.addEventListener("click", () => showView("emergency-view"));

  document.querySelector(".emergency-call")
    ?.addEventListener("click", () => showView("emergency-view"));

  document.getElementById("confirmSOS")
    ?.addEventListener("click", startEmergency);

  document.getElementById("cancelSOS")
    ?.addEventListener("click", () => {
      cancelEmergency();
      showView("welcome-view");
    });

  /* ================= ACTION CARDS ================= */
  document.getElementById("btnSafety")
    ?.addEventListener("click", () => showView("safety-map-view"));

  document.getElementById("btnRoute")
    ?.addEventListener("click", () => showView("route-view"));

  /* ================= FIREBASE CRIME ZONES ================= */
  const crimeZonesRef = collection(db, "crimeZones");
  onSnapshot(crimeZonesRef, snap => {
    cachedCrimeZones = snap.docs.map(d => d.data());
    console.log("✅ Crime zones loaded:", cachedCrimeZones.length);
  });

  const safePlacesRef = collection(db, "safePlaces");

onSnapshot(safePlacesRef, snap => {
  safePlaces = snap.docs.map(d => d.data());
  console.log("✅ Safe places loaded:", safePlaces.length);
});

  /* ================= GPS TRACKING ================= */
  navigator.geolocation.watchPosition(
    pos => {
      currentUserPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      MapProvider.setUser(currentUserPos);
const nearbySafePlaces = getNearbySafePlaces(700);
MapProvider.drawSafePlaces(nearbySafePlaces);

      // draw immediately on first fix
if (lastCrimeDraw === 0) {
  drawNearbyCrimeZones();
  lastCrimeDraw = Date.now();
} else {
  const now = Date.now();
  if (now - lastCrimeDraw > 2000) {
    drawNearbyCrimeZones();
    lastCrimeDraw = now;
  }
}

    },
    err => console.error("GPS error:", err),
    { enableHighAccuracy: true }
  
  );


/* ================= MAP INTERACTION ================= */
  MapProvider.onClick(pos => {
    previewDestination = pos; // Stores the click
    MapProvider.previewDestination(pos); // Shows the yellow marker

    // This unlocks the Simulate button
    const sim = document.getElementById("simulateRoute");
    if (sim) {
      sim.disabled = false;
      sim.style.opacity = "1";
      sim.style.cursor = "pointer";
    }

    // Keeps UI clean until simulation starts
    document.getElementById("alternateRoute").style.display = "none";
    document.getElementById("route-panel").style.display = "none";
  });
  /* ================= SIMULATION ================= */
  document.getElementById("simulateRoute")
    ?.addEventListener("click", () => {
      if (!currentUserPos || !previewDestination) return;

      MapProvider.drawRoute([currentUserPos, previewDestination]);
      MapProvider.confirmDestination(previewDestination);

      document.getElementById("alternateRoute").style.display = "inline-flex";
      document.getElementById("route-panel").style.display = "block";

      const sim = document.getElementById("simulateRoute");
      sim.disabled = true;
      sim.style.opacity = "0.5";
    });

});

/* ================= CRIME ZONE FILTER ================= */
function drawNearbyCrimeZones() {
  if (!currentUserPos) return;

  const nearby = cachedCrimeZones.filter(z =>
    distanceInMeters(currentUserPos, {
      lat: z.lat,
      lng: z.lng
    }) <= 3000
  );

  MapProvider.drawCrimeZones(nearby);
}

function getNearbySafePlaces(radius = 700) {
  if (!currentUserPos) return [];

  return safePlaces.filter(p =>
    distanceInMeters(currentUserPos, {
      lat: p.lat,
      lng: p.lng
    }) <= radius
  );
}

/* ================= DISTANCE (HAVERSINE) ================= */
function distanceInMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}
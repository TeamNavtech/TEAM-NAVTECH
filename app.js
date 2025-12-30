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

window.addEventListener("DOMContentLoaded", () => {

  /* ================= VIEW SWITCHING ================= */
  function showView(id) {
  document.querySelectorAll(".content-view").forEach(v => {
    v.classList.remove("active");
  });

  const target = document.getElementById(id);
  if (target) target.classList.add("active");

  if (id === "safety-map-view") {
    const sim = document.getElementById("simulateRoute");

    if (sim) {
      sim.disabled = true;          // 🔒 disable until map click
      sim.style.display = "inline-flex";
    }
    document.getElementById("alternateRoute").style.display = "none";
    document.getElementById("route-panel").style.display = "none";

    setTimeout(() => MapProvider.invalidate(), 300);
  }
}

  document.getElementById("confirmLocation")
  ?.addEventListener("click", () => {
    if (!previewDestination) return;
    MapProvider.confirmDestination(previewDestination);
  });

document.getElementById("simulateRoute")
  ?.addEventListener("click", () => {
    if (!currentUserPos || !previewDestination) return;

    setTimeout(() => {
      MapProvider.drawRoute([
        currentUserPos,
        previewDestination
      ]);

      MapProvider.confirmDestination(previewDestination);
      document.getElementById("alternateRoute").style.display = "inline-flex";
      document.getElementById("route-panel").style.display = "block";

    }, 500);
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

  /* ================= MAP INIT (ONCE) ================= */
  MapProvider.init("map", [26.7606, 83.3732], 13);

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

  /* ================= MAP CLICK ================= */
  MapProvider.onClick(pos => {
  previewDestination = pos;
  MapProvider.previewDestination(pos);

  // 🔓 enable simulate button
  const sim = document.getElementById("simulateRoute");
  if (sim) sim.disabled = false;
  
document.getElementById("alternateRoute").style.display = "none";
document.getElementById("route-panel").style.display = "none";

});



});

/* ================= CRIME ZONE FILTER ================= */
function drawNearbyCrimeZones() {
  if (!currentUserPos) return;

  const nearby = cachedCrimeZones.filter(z =>
    distanceInMeters(currentUserPos, {
      lat: z.lat,
      lng: z.lng
    }) <= 5000
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
const sosBtn = document.getElementById("sosBtn");
const emergencyView = document.getElementById("emergency-view");

if (sosBtn) {
  sosBtn.addEventListener("click", () => {
    // sab screens hide
    document.querySelectorAll(".content-view").forEach(view => {
      view.classList.remove("active");
    });

    // emergency screen show
    emergencyView.classList.add("active");
  });
}

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

window.addEventListener("DOMContentLoaded", () => {

  /* ================= VIEW SWITCHING ================= */
  function showView(id) {
    document.querySelectorAll(".content-view").forEach(v => {
      v.classList.remove("active");
    });

    const target = document.getElementById(id);
    if (target) target.classList.add("active");

    if (id === "safety-map-view") {
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

    MapProvider.drawRoute([
      currentUserPos,
      previewDestination
    ]);
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

  /* ================= GPS TRACKING ================= */
  navigator.geolocation.watchPosition(
    pos => {
      currentUserPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      MapProvider.setUser(currentUserPos);

      const now = Date.now();
      if (now - lastCrimeDraw > 2000) {
        drawNearbyCrimeZones();
        lastCrimeDraw = now;
      }
    },
    err => console.error("GPS error:", err),
    { enableHighAccuracy: true }
  );

  /* ================= MAP CLICK ================= */
  MapProvider.onClick(pos => {
    previewDestination = pos;
    MapProvider.previewDestination(pos);
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

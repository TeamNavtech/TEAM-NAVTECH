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

function showView(id) {
  document.querySelectorAll(".content-view").forEach(v => {
    v.classList.remove("active");
    v.style.display = "none";   // 🔥 HARD HIDE
  });

  const target = document.getElementById(id);
  if (target) {
    target.classList.add("active");
    target.style.display = "block"; // 🔥 HARD SHOW
  }

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
    if (id === "safety-map-view") {
      MapProvider.invalidate();
    }
  }, 300);
}


  
  const sosFloat = document.querySelector(".sos-float");
  const emergencyCard = document.querySelector(".emergency-call");
  const mapSOS = document.getElementById("sos");

sosFloat?.addEventListener("click", () => {
  showView("emergency-view");
});

emergencyCard?.addEventListener("click", () => {
  showView("emergency-view");
});

mapSOS?.addEventListener("click", () => {
  showView("emergency-view");
});

  
  /* 1️⃣ INIT MAP (ONCE) */
  MapProvider.init("map", [26.7606, 83.3732], 13);
 

  document.getElementById("confirmSOS")
  ?.addEventListener("click", startEmergency);

document.getElementById("cancelSOS")
  ?.addEventListener("click", () => {
    cancelEmergency();
    showView("welcome-view");
  });

  /* 3️⃣ ACTION BUTTONS */
  document.getElementById("btnSafety")?.onclick =
    () => showView("safety-map-view");

  document.getElementById("btnRoute")?.onclick =
    () => showView("route-view");

  /* 4️⃣ SIMULATE BUTTON */
  const simulate = document.getElementById("simulate");
  if (!simulate) return;

  /* 5️⃣ FIREBASE CRIME ZONES */
  const crimeZonesRef = collection(db, "crimeZones");
  onSnapshot(crimeZonesRef, snap => {
    cachedCrimeZones = snap.docs.map(d => d.data());
    console.log("✅ crime zones loaded:", cachedCrimeZones.length);
  });

  /* 6️⃣ GPS TRACKING */
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

  /* 7️⃣ MAP CLICK */
  MapProvider.onClick(pos => {
    previewDestination = pos;
    MapProvider.previewDestination(pos);
  });

  /* 8️⃣ SIMULATE ROUTE */
  simulate.onclick = () => {
    if (!previewDestination || !currentUserPos) return;

    fetch(
      `https://router.project-osrm.org/route/v1/walking/` +
      `${currentUserPos.lng},${currentUserPos.lat};` +
      `${previewDestination.lng},${previewDestination.lat}` +
      `?overview=full&geometries=geojson`
    )
      .then(r => r.json())
      .then(d => {
        if (!d.routes?.length) return;

        const points = d.routes[0].geometry.coordinates
          .map(c => [c[1], c[0]]);

        MapProvider.drawRoute(points);
        MapProvider.confirmDestination(previewDestination);
      });
  };

});

/* ===== FILTER ===== */
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

/* ===== DISTANCE ===== */
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

const statusBox = document.getElementById("statusBox");
let userPos = null;
let destPos = null;

// INIT MAP
MapProvider.init("map", [22.5937, 78.9629], 5);

// =====================
// CRIME ZONES FUNCTION
// =====================
function generateCrimeZones(center, count = 4) {
  const zones = [];
  const levels = [
    { level: "High", color: "#ff4d6d", radius: 500 },
    { level: "Medium", color: "#ffd166", radius: 700 },
    { level: "Low", color: "#4dd599", radius: 900 }
  ];

  for (let i = 0; i < count; i++) {
    const l = levels[Math.floor(Math.random() * levels.length)];
    zones.push({
      lat: center.lat + (Math.random() - 0.5) * 0.02,
      lng: center.lng + (Math.random() - 0.5) * 0.02,
      level: l.level,
      color: l.color,
      radius: l.radius
    });
  }

  return zones;
}

// =====================
// GPS (THIS WAS NOT RUNNING BEFORE)
// =====================
navigator.geolocation.watchPosition(
  p => {
    userPos = {
      lat: p.coords.latitude,
      lng: p.coords.longitude
    };

    MapProvider.setUserLocation(userPos);

    const crimeZones = generateCrimeZones(userPos);
    MapProvider.drawDangerZones(crimeZones);
  },
  err => {
    console.error(err);
    statusBox.innerHTML = "❌ GPS permission denied";
  },
  { enableHighAccuracy: true }
);

// =====================
// MAP CLICK
// =====================
MapProvider.onClick(pos => {
  destPos = pos;
  MapProvider.setDestination(pos);

  document.getElementById("destination").value =
    `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;

  statusBox.innerHTML = "📍 Destination selected";
});

// =====================
// SIMULATE ROUTE
// =====================
simulate.onclick = () => {
  if (!userPos || !destPos) return;

  fetch(
    `https://router.project-osrm.org/route/v1/walking/` +
    `${userPos.lng},${userPos.lat};${destPos.lng},${destPos.lat}` +
    `?overview=full&geometries=geojson`
  )
    .then(r => r.json())
    .then(d => {
      const pts = d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      MapProvider.drawRoute(pts);
      statusBox.innerHTML = "🧠 Route simulated";
    });
};

// =====================
// SHARE
// =====================
share.onclick = () => {
  if (!userPos) return;
  statusBox.innerHTML =
    `📡 Live location shared<br>${userPos.lat}, ${userPos.lng}`;
};


// SOS
sos.onclick = () => {
  if (!userPos) return;
  statusBox.innerHTML =
    `🚨 SOS ACTIVATED<br>${userPos.lat}, ${userPos.lng}`;
  document.body.style.animation = "sosFlash 1s infinite";
  setTimeout(() => document.body.style.animation = "", 8000);
};
// AREA RISK SIMULATION
const riskLevels = ["Low", "Medium", "High"];

document.getElementById("checkRisk").onclick = () => {
  const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  const riskText = document.getElementById("riskStatus");

  riskText.innerText = `Area Risk: ${risk}`;

  if (risk === "High") {
    riskText.style.color = "#ff4d6d";
    alert("⚠️ High Risk Area detected. Safer routes recommended.");
  } else {
    riskText.style.color = "#80ed99";
  }
};

// SAFER ROUTE BUTTON
document.getElementById("safeRoute").onclick = () => {
  alert("✅ Showing safer alternative routes & operated safe spots.");
};

// SOS AUTO-ESCALATION TIMER
document.getElementById("sos").onclick = () => {
  document.getElementById("timerStatus").innerText =
    "Emergency Timer: Waiting for response (5 minutes)";

  setTimeout(() => {
    alert("🚔 Alert sent to nearest police station / patrol vehicle.");
    document.getElementById("timerStatus").innerText =
      "Emergency Timer: Police Alert Triggered";
  }, 300000);
};


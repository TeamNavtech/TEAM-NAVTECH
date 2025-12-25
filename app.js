const statusBox = document.getElementById("statusBox");
let userPos = null;
let destPos = null;

// INIT
MapProvider.init("map", [22.5937, 78.9629], 5);

// LIVE GPS
navigator.geolocation.watchPosition(
  p => {
    userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
    MapProvider.setUserLocation(userPos);
  },
  () => statusBox.innerHTML = "❌ GPS permission denied",
  { enableHighAccuracy:true }
);

// MAP CLICK
MapProvider.onClick(pos => {
  destPos = pos;
  MapProvider.setDestination(pos);

  document.getElementById("destination").value =
    `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;

  statusBox.innerHTML = "📍 Destination selected";
});

// SIMULATE ROUTE (FREE OSRM)
simulate.onclick = () => {
  if (!userPos || !destPos) return;

  fetch(`https://router.project-osrm.org/route/v1/walking/` +
        `${userPos.lng},${userPos.lat};${destPos.lng},${destPos.lat}` +
        `?overview=full&geometries=geojson`)
    .then(r => r.json())
    .then(d => {
      const pts = d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      MapProvider.drawRoute(pts);
      statusBox.innerHTML = "🧠 Route simulated";
    });
};

// SHARE
share.onclick = () => {
  if (!userPos) return;
  statusBox.innerHTML = `📡 Live location shared<br>${userPos.lat}, ${userPos.lng}`;
};

// SOS
sos.onclick = () => {
  if (!userPos) return;
  statusBox.innerHTML = `🚨 SOS ACTIVATED<br>${userPos.lat}, ${userPos.lng}`;
  document.body.style.animation = "sosFlash 1s infinite";
  setTimeout(()=>document.body.style.animation="",8000);
};


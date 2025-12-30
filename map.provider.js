export const MapProvider = (() => {
  let map;
  let userMarker = null;
  let previewMarker = null;
  let finalMarker = null;
  let dangerLayers = [];
  let routeLayer = null; // ✅ MISSING VARIABLE (CRITICAL FIX)
  let hasCenteredOnUser = false;
  let routeControl = null;
  let safeMarkers = [];

  // ===== ICONS =====
  const blueIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const yellowIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const safePlaceIcons = {
  police: redIcon,
  hospital: blueIcon,
  mall: yellowIcon,
  pharmacy: blueIcon,
  fuel: yellowIcon,
  default: blueIcon
};

  function init(id, center, zoom) {
  if (map) return;

  map = L.map(id).setView(center, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  // 🔥 ADD THIS (CRITICAL)
  setTimeout(() => {
    map.invalidateSize();
  }, 500);
}


  function onClick(cb) {
    if (!map) return;

    map.on("click", e =>
      cb({ lat: e.latlng.lat, lng: e.latlng.lng })
    );
  }

  function setUser(pos) {
    if (!map || !pos) return;

    if (!userMarker) {
      userMarker = L.marker([pos.lat, pos.lng], { icon: blueIcon }).addTo(map);
    } else {
      userMarker.setLatLng([pos.lat, pos.lng]);
    }

    if (!hasCenteredOnUser) {
      map.setView([pos.lat, pos.lng], 14);
      hasCenteredOnUser = true;
    }
  }

  function previewDestination(pos) {
    if (!map || !pos) return;

    if (!previewMarker) {
      previewMarker = L.marker([pos.lat, pos.lng], { icon: yellowIcon }).addTo(map);
    } else {
      previewMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  function confirmDestination(pos) {
  if (!map || !pos) return;

  if (!finalMarker) {
    finalMarker = L.marker([pos.lat, pos.lng], { icon: redIcon }).addTo(map);
  } else {
    finalMarker.setLatLng([pos.lat, pos.lng]);
  }
}

  
 function invalidate() {
  if (map) {
    map.invalidateSize();
  }
}

function drawCrimeZones(zones = []) {
  if (!map) return;

  dangerLayers.forEach(layer => map.removeLayer(layer));
  dangerLayers = [];

  zones.forEach(z => {
    let radius = 200;
    let color = "#00c853"; // 🟢 SAFE

    if (z.level === "low") {
      radius = 250;
      color = "#ffeb3b";
    } else if (z.level === "medium") {
      radius = 350;
      color = "#ff9800";
    } else if (z.level === "high") {
      radius = 500;
      color = "#f44336";
    }

    dangerLayers.push(
      L.circle([z.lat, z.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 1
      }).addTo(map)
    );
  });
}

function drawSafePlaces(places = []) {
  if (!map) return;

  // remove old safe markers
  safeMarkers.forEach(m => map.removeLayer(m));
  safeMarkers = [];

  places.forEach(p => {
    if (!p.lat || !p.lng) return;

    const icon = safePlaceIcons[p.type] || safePlaceIcons.default;

    const marker = L.marker([p.lat, p.lng], { icon })
      .bindPopup(
        `<b>${p.name || "Safe Place"}</b><br>
         ${p.type || ""}<br>
         24×7`
      )
      .addTo(map);

    safeMarkers.push(marker);
  });
}

function drawRoute(points = []) {
  if (!map || points.length < 2 || !L.Routing) return;

  // remove previous route
  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }

  const panel = document.getElementById("route-panel");
  if (!panel) return;

  panel.innerHTML = "";
  panel.style.display = "block";

  // 🔥 CREATE A CUSTOM ITINERARY (THIS IS THE KEY)
  const itinerary = L.Routing.itinerary({
    container: panel,
    show: true
  });

  routeControl = L.Routing.control({
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1"
    }),

    waypoints: [
      L.latLng(points[0].lat, points[0].lng),
      L.latLng(points[1].lat, points[1].lng)
    ],

    addWaypoints: false,
    draggableWaypoints: false,
    routeWhileDragging: false,
    showAlternatives: false,
    createMarker: () => null,

    // 🔥 USE THE CUSTOM ITINERARY
    itinerary: itinerary,

    lineOptions: {
      styles: [{ color: "#35d07f", weight: 4 }]
    }
  });

  routeControl.addTo(map);
}

  return {
    init,
    onClick,
    setUser,
    previewDestination,
    confirmDestination,
    drawCrimeZones,
    drawSafePlaces,
    drawRoute,
    invalidate
  };
})();
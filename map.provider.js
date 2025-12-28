export const MapProvider = (() => {
  let map;
  let userMarker = null;
  let previewMarker = null;
  let finalMarker = null;
  let dangerLayers = [];
  let routeLayer = null; // ✅ MISSING VARIABLE (CRITICAL FIX)
  let hasCenteredOnUser = false;

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

    if (previewMarker) {
      map.removeLayer(previewMarker);
      previewMarker = null;
    }

    function invalidate() {
  if (map) {
    map.invalidateSize();
  }
}

    if (!finalMarker) {
      finalMarker = L.marker([pos.lat, pos.lng], { icon: redIcon }).addTo(map);
    } else {
      finalMarker.setLatLng([pos.lat, pos.lng]);
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


  function drawRoute(points = []) {
    if (!map || points.length < 2) return;

    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }

    routeLayer = L.polyline(points, {
      color: "#35d07f",
      weight: 4
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
  }

  return {
    init,
    onClick,
    setUser,
    previewDestination,
    confirmDestination,
    drawCrimeZones,
    drawRoute,
    invalidate
  };
})();

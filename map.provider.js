// map.provider.js
const MapProvider = (() => {
  let map, userMarker, destMarker, routeLayer;
  let dangerLayers = [];

function drawDangerZones(zones) {
  
  dangerLayers.forEach(z => map.removeLayer(z));
  dangerLayers = [];

  zones.forEach(z => {
    const circle = L.circle([z.lat, z.lng], {
      radius: z.radius,
      color: z.color,
      fillColor: z.color,
      fillOpacity: 0.3
    }).addTo(map);

    circle.bindPopup(`⚠ ${z.level} risk zone`);
    dangerLayers.push(circle);
  });
}


// Inside map.provider.js
function init(containerId, center, zoom) {
  map = L.map(containerId, {
    minZoom: 3,
    worldCopyJump: false // Prevents jumping between different "worlds"
  }).setView(center, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true, // THIS STOPS THE REPEATING MAP
    bounds: [[-90, -180], [90, 180]] 
  }).addTo(map);
}
  ]);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    bounds: [
      [-85, -180],
      [85, 180]
    ]
  }).addTo(map);
}

  }

  function onClick(cb) {
    map.on("click", e =>
      cb({ lat: e.latlng.lat, lng: e.latlng.lng })
    );
  }

  function setUserLocation(pos) {
    if (!userMarker) {
      userMarker = L.marker([pos.lat, pos.lng])
        .addTo(map)
        .bindPopup("You are here");
    } else {
      userMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  function setDestination(pos) {
    if (destMarker) map.removeLayer(destMarker);
    destMarker = L.marker([pos.lat, pos.lng])
      .addTo(map)
      .bindPopup("Destination")
      .openPopup();
  }

  function drawRoute(points) {
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(points, {
      color:"#35d07f",
      weight:4
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding:[30,30] });
  }

  return {
  init,
  onClick,
  setUserLocation,
  setDestination,
  drawRoute,
  drawDangerZones  
};
})();

/* The map of places — a real one, with roads.

   Leaflet is vendored in /vendor/leaflet rather than pulled from a CDN, so the
   version is pinned and the page doesn't depend on someone else's script host.
   The map tiles are the one thing still fetched from elsewhere, since drawing
   the road network is exactly what a tile server is for.

   ── Editing the places ───────────────────────────────────────────────
   Order in this list is the order the pins are numbered. Coordinates are kept
   to two decimals on purpose: that's roughly a kilometre of slack, enough to
   land on the right neighbourhood without publishing anyone's doorstep on
   a page anyone with the link can read.

   To find a coordinate: open a map, right-click a spot, copy the lat/lon,
   then round it to two decimals.

   `home: true` marks the two ends the distance is measured between.
   ────────────────────────────────────────────────────────────────────── */
(function () {
  var PLACES = [
    { name: 'Our First date', note: 'Where it started', lat: 40.037487, lon: -75.508602 },
    { name: 'Zoe\'s place', note: 'West Chester', lat: 39.96, lon: -75.61, home: true },
    { name: 'Henry\'s place', note: 'Philadelphia', lat: 40.009, lon: -75.190, home: true },
  ];

  var container = document.querySelector('[data-map]');
  var legend = document.querySelector('[data-map-legend]');
  var distanceEl = document.querySelector('[data-map-distance]');
  var captionEl = document.querySelector('[data-map-caption]');
  if (!container || PLACES.length < 2) return;

  /* Leaflet is a plain script tag, so if it failed to load there's no map to
     build — the legend and the distance below still stand on their own. */
  if (typeof L === 'undefined') {
    container.hidden = true;
    return;
  }

  /* ---------- Distance ----------
     Haversine, in miles. Straight line, not driving distance — there's no
     routing engine here, and the page says "as the crow flies" for that
     reason. */
  function milesBetween(a, b) {
    var R = 3958.8;
    var toRad = function (d) { return (d * Math.PI) / 180; };
    var dLat = toRad(b.lat - a.lat);
    var dLon = toRad(b.lon - a.lon);
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /* ---------- Map ---------- */
  var map = L.map(container, {
    /* Off by default so scrolling down the page doesn't get swallowed by the
       map when the cursor happens to cross it. Turned on once it's clicked,
       which is a deliberate act, and off again when the pointer leaves. */
    scrollWheelZoom: false,
    zoomControl: true,
    /* Off here and added by hand below — Leaflet adds one by default, so
       leaving this on would put two credit bars on top of each other. */
    attributionControl: false,
  });

  /* Leaflet's default credit line carries a flag emoji. Keeping the credit,
     dropping the flag — this page isn't the place for it. */
  L.control.attribution({ prefix: 'Leaflet' }).addTo(map);

  map.on('click', function () { map.scrollWheelZoom.enable(); });
  map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

  /* Standard OpenStreetMap tiles. The pale "light" basemaps look tidier in the
     abstract but draw almost no road detail at this zoom, which reads as an
     empty grey rectangle; these carry parks, water and a real road hierarchy,
     and the warm filter in home.css settles the whole thing into the cream. */
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  var latlngs = PLACES.map(function (p) { return [p.lat, p.lon]; });

  PLACES.forEach(function (place, i) {
    var icon = L.divIcon({
      className: 'map-pin-icon',
      html: '<span>' + (i + 1) + '</span>',
      iconSize: [26, 26],
      /* Centre the circle on the coordinate rather than hanging it below. */
      iconAnchor: [13, 13],
    });

    L.marker([place.lat, place.lon], { icon: icon, title: place.name, alt: place.name })
      .addTo(map)
      .bindPopup('<strong>' + place.name + '</strong>' + (place.note ? '<br>' + place.note : ''));
  });

  /* Frame all the pins, with enough padding that none sits under the zoom
     control or the attribution. */
  map.fitBounds(L.latLngBounds(latlngs), { padding: [38, 38] });

  /* ---------- Legend & distance ----------
     The numbered pins mean nothing on their own, and a Leaflet map is a pile
     of divs to a screen reader, so the list underneath carries the actual
     content either way. */
  if (legend) {
    legend.textContent = '';
    PLACES.forEach(function (place, i) {
      var li = document.createElement('li');

      var num = document.createElement('span');
      num.className = 'map-legend-num';
      num.textContent = String(i + 1);

      var name = document.createElement('strong');
      name.textContent = place.name;

      li.appendChild(num);
      li.appendChild(name);

      if (place.note) {
        var note = document.createElement('span');
        note.className = 'map-legend-note';
        note.textContent = place.note;
        li.appendChild(note);
      }
      legend.appendChild(li);
    });
  }

  var homes = PLACES.filter(function (p) { return p.home; });

  if (distanceEl && homes.length === 2) {
    var miles = milesBetween(homes[0], homes[1]);
    distanceEl.textContent = 'About ' + Math.round(miles) + ' miles apart';
  }

  /* The line along the bottom of the card. Built from the two ends rather than
     written out, so it follows the places if they change. */
  if (captionEl && homes.length === 2) {
    captionEl.textContent =
      (homes[0].note || homes[0].name) + ' & ' + (homes[1].note || homes[1].name);
  }
})();

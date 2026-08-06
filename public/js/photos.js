/* The album that appears once the game is finished.

   Starts on a random photo, so it isn't the same one every time, and the
   arrows step through the rest, wrapping at either end.

   ── Editing the album ────────────────────────────────────────────────
   Add, remove or reorder entries below. Files live in public/images/.
   Write a real `alt` for each one — it's what someone using a screen
   reader gets instead of the photo, and what shows if the file 404s.
   ───────────────────────────────────────────────────────────────────── */
(function () {
  var PHOTOS = [
    { src: '/images/DSC00791.JPG', alt: 'Fourth of July, Swing.' },
    { src: '/images/DSC00810.JPG', alt: 'Fourth of July, Us at the Club.' },
    { src: '/images/IMG_1409.JPG', alt: 'Us at the Phillies game.' },
    { src: '/images/IMG_7328.jpeg', alt: 'Us at Bube\'s.' },
    { src: '/images/IMG_8049.jpeg', alt: 'Us at the Spring Soiree.' },
  ];

  var section = document.querySelector('[data-photos]');
  var frame = document.querySelector('[data-photo-frame]');
  var prevBtn = document.querySelector('[data-photo-prev]');
  var nextBtn = document.querySelector('[data-photo-next]');
  var countEl = document.querySelector('[data-photo-count]');
  if (!section || !frame || !PHOTOS.length) return;

  var slides = [];
  var at = 0;

  /* Every photo gets its own <img>, stacked in the frame and cross-faded,
     rather than one <img> whose src is swapped. Swapping means the new file
     is still decoding when the old one disappears, which shows as a blank
     frame on the first pass through. These are lazy, so nothing is fetched
     until the album is actually on screen. */
  function build() {
    PHOTOS.forEach(function (photo, i) {
      var img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      if (i !== 0) img.setAttribute('aria-hidden', 'true');
      frame.appendChild(img);
      slides.push(img);
    });
  }

  function show(i) {
    /* Wraps in both directions; the modulo alone goes negative going back. */
    at = ((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length;

    slides.forEach(function (img, n) {
      var current = n === at;
      img.classList.toggle('is-current', current);
      if (current) img.removeAttribute('aria-hidden');
      else img.setAttribute('aria-hidden', 'true');
    });

    if (countEl) countEl.textContent = at + 1 + ' of ' + PHOTOS.length;
  }

  function step(by) {
    show(at + by);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

  /* Arrow keys, but only while the album is up — the game owns the keyboard
     until then, and this shouldn't fight it. */
  document.addEventListener('keydown', function (e) {
    if (section.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft') { step(-1); }
    else if (e.key === 'ArrowRight') { step(1); }
    else return;
    e.preventDefault();
  });

  /* Swipe, for the phone this is most likely to be read on. Tracked on the
     section rather than the frame so a swipe that drifts off the photo still
     counts, and ignored unless it's clearly horizontal so it doesn't hijack
     scrolling down the page. */
  var startX = 0;
  var startY = 0;
  var tracking = false;

  section.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  section.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('anniversary:finished', function () {
    if (!slides.length) build();
    /* A different photo each time the game is finished. */
    show(Math.floor(Math.random() * PHOTOS.length));
    section.hidden = false;
  });

  document.addEventListener('anniversary:playing', function () {
    section.hidden = true;
  });
})();

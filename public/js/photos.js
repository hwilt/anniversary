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

  var cards = [];
  var at = 0;

  /* Every photo gets its own polaroid mount, stacked in the frame. Rather
     than swap one <img>'s src (which shows a blank frame while the new file
     is still decoding), each card stays in the DOM and show() just re-ranks
     them. These are lazy, so nothing is fetched until the album is on
     screen. */
  function build() {
    PHOTOS.forEach(function (photo) {
      var card = document.createElement('div');
      card.className = 'polaroid';

      var mount = document.createElement('div');
      mount.className = 'polaroid-photo';

      var img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;

      mount.appendChild(img);
      card.appendChild(mount);

      /* The front card is the only one with pointer-events on (see
         home.css), so this only ever fires for it. */
      card.addEventListener('click', function () { step(1); });

      frame.appendChild(card);
      cards.push(card);
    });
  }

  /* Fans the next couple of cards out behind the current one so the stack
     hints there's more to see; anything further back is fully hidden. */
  function show(i) {
    /* Wraps in both directions; the modulo alone goes negative going back. */
    at = ((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length;

    cards.forEach(function (card, n) {
      var rel = ((n - at) % PHOTOS.length + PHOTOS.length) % PHOTOS.length;
      var current = rel === 0;

      card.classList.toggle('is-front', current);
      if (current) card.removeAttribute('aria-hidden');
      else card.setAttribute('aria-hidden', 'true');

      if (rel === 0) {
        card.style.transform = 'none';
        card.style.opacity = '1';
        card.style.zIndex = 30;
      } else if (rel === 1) {
        card.style.transform = 'translate(10px, 10px) rotate(6deg)';
        card.style.opacity = '.92';
        card.style.zIndex = 20;
      } else if (rel === 2) {
        card.style.transform = 'translate(18px, 18px) rotate(-6deg)';
        card.style.opacity = '.78';
        card.style.zIndex = 10;
      } else {
        card.style.transform = 'translate(18px, 18px) rotate(-6deg)';
        card.style.opacity = '0';
        card.style.zIndex = 0;
      }
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
    if (!cards.length) build();
    /* A different photo each time the game is finished. */
    show(Math.floor(Math.random() * PHOTOS.length));
    section.hidden = false;
  });

  document.addEventListener('anniversary:playing', function () {
    section.hidden = true;
  });
})();

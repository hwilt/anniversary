/* Fills in how long it's been, and how long until the next anniversary.

   The start date lives in the markup as data-since="YYYY-MM-DD" rather than
   here, so the page is edited in one place. Everything is rendered from the
   viewer's local clock — this is a date, not a timestamp, so there's no
   timezone to be correct about beyond "what day is it where you are". */
(function () {
  var section = document.querySelector('[data-since]');
  if (!section) return;

  var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(section.dataset.since.trim());
  if (!parts) return;

  var since = new Date(+parts[1], parts[2] - 1, +parts[3]);
  /* Rejects both a malformed date and one that rolled over (2025-02-30). */
  if (isNaN(since) || since.getDate() !== +parts[3]) return;

  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (today < since) return;

  /* Whole days between two local midnights. Going through Date.UTC keeps a
     DST boundary from turning a day into 23 or 25 hours and rounding wrong. */
  function dayNumber(d) {
    return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  var days = dayNumber(today) - dayNumber(since);

  /* Full years only: the anniversary hasn't landed yet this year if we're
     still short of the month/day. */
  var years = today.getFullYear() - since.getFullYear();
  var hadAnniversary =
    today.getMonth() > since.getMonth() ||
    (today.getMonth() === since.getMonth() && today.getDate() >= since.getDate());
  if (!hadAnniversary) years--;

  /* This year's anniversary, unless it's already gone by — in which case next
     year's. Checked against today rather than reusing hadAnniversary above, so
     that the day itself counts as upcoming (0 days away) and not as passed.
     A Feb 29 start date lands on Mar 1 in common years, which is how most
     calendars handle it too. */
  var next = new Date(today.getFullYear(), since.getMonth(), since.getDate());
  if (dayNumber(next) < dayNumber(today)) {
    next = new Date(today.getFullYear() + 1, since.getMonth(), since.getDate());
  }
  var until = dayNumber(next) - dayNumber(today);

  function write(name, value) {
    var el = section.querySelector('[data-count="' + name + '"]');
    if (el) el.textContent = value.toLocaleString();
  }

  write('days', days);
  write('years', years);

  /* Under a year in, a "0 years" tile only announces the zero, so the whole
     tile sits out until there's a year to show. It comes back on its own at
     the first anniversary. home.css has the [hidden] rule this needs — an
     author `display` would otherwise win over the browser's default. */
  var yearsTile = section.querySelector('[data-count="years"]');
  if (yearsTile && yearsTile.parentNode) {
    yearsTile.parentNode.hidden = years === 0;
  }

  var nextUp = section.querySelector('[data-next-up]');
  if (!nextUp) return;

  nextUp.textContent =
    until === 0
      ? 'happy anniversary'
      : until === 1
        ? 'one day until the next one'
        : until.toLocaleString() + ' days until the next one';
})();

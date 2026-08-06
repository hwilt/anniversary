/* A small word game, in the shape of Wordle.

   ── Editing the puzzles ──────────────────────────────────────────────
   Answers are base64 so that opening the page source doesn't hand them
   over on sight. That is a spoiler guard, not a secret — anyone who wants
   the answer can still find it in about ten seconds. Don't put anything in
   here you'd mind being read.

   To add or change one, encode the word in a browser console:

       btoa('MAINE')        // -> 'TUFJTkU='

   Any length works; the grid sizes itself to the answer. The hint is shown
   as soon as that word comes up, so write it as a clue rather than a reveal.
   ─────────────────────────────────────────────────────────────────────── */
(function () {
  var PUZZLES = [
    { answer: 'VEhSRUU=', hint: 'It has been this many months.' },
    { answer: 'SEVBUlQ=', hint: 'You have my ...' },
    { answer: 'U1BBUks=', hint: 'The first night, and most nights since.' },
    { answer: 'TFVDS1k=', hint: 'Which is mostly what I am.' },
    { answer: 'Wk9F', hint: 'I one I want to spend my time with.'}
  ];

  var MAX_GUESSES = 6;
  var STORE_KEY = 'anniversary.wordle.solved';

  var board = document.querySelector('[data-board]');
  var keyboard = document.querySelector('[data-keyboard]');
  var statusEl = document.querySelector('[data-status]');
  var hintEl = document.querySelector('[data-hint]');
  var noteEl = document.querySelector('[data-note]');
  var nextBtn = document.querySelector('[data-next]');
  var resetBtn = document.querySelector('[data-reset]');
  if (!board || !keyboard) return;

  var KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  /* localStorage throws outright in some privacy modes, so every access is
     guarded and the game just runs without memory if it's unavailable. */
  function readSolved() {
    try {
      return Math.min(parseInt(localStorage.getItem(STORE_KEY), 10) || 0, PUZZLES.length);
    } catch (e) {
      return 0;
    }
  }

  function writeSolved(n) {
    try {
      localStorage.setItem(STORE_KEY, String(n));
    } catch (e) {
      /* Nothing to do — progress just won't survive a reload. */
    }
  }

  var index = readSolved();
  var answer = '';
  var hint = '';
  var row = 0;
  var current = '';
  var over = false;
  var keyState = {};

  /* ---------- Scoring ----------
     Two passes, because one doesn't handle repeated letters. Exact matches are
     taken first and removed from the pool of letters still available; only
     then can a leftover letter be claimed as present. Without that, guessing
     SPEED against ERASE marks both E's yellow when the answer holds only one
     unmatched E. */
  function score(guess, target) {
    var result = [];
    var pool = {};
    var i;

    for (i = 0; i < target.length; i++) {
      if (guess[i] === target[i]) {
        result[i] = 'correct';
      } else {
        result[i] = null;
        pool[target[i]] = (pool[target[i]] || 0) + 1;
      }
    }

    for (i = 0; i < target.length; i++) {
      if (result[i]) continue;
      if (pool[guess[i]] > 0) {
        result[i] = 'present';
        pool[guess[i]]--;
      } else {
        result[i] = 'absent';
      }
    }

    return result;
  }

  /* ---------- Rendering ---------- */
  function buildBoard() {
    board.textContent = '';
    board.style.setProperty('--cols', answer.length);

    for (var r = 0; r < MAX_GUESSES; r++) {
      var tr = document.createElement('div');
      tr.className = 'row';
      tr.setAttribute('data-row', r);
      for (var c = 0; c < answer.length; c++) {
        var tile = document.createElement('div');
        tile.className = 'tile';
        tr.appendChild(tile);
      }
      board.appendChild(tr);
    }
  }

  function buildKeyboard() {
    keyboard.textContent = '';

    KEY_ROWS.forEach(function (letters, i) {
      var kr = document.createElement('div');
      /* The middle row is a letter short, so it gets half-key stubs on each
         side to keep every row the same 10 units wide. */
      kr.className = 'key-row' + (i === 1 ? ' indent' : '');

      if (i === 2) kr.appendChild(makeKey('ENTER', 'enter', 'wide'));

      letters.split('').forEach(function (ch) {
        kr.appendChild(makeKey(ch, ch));
      });

      if (i === 2) kr.appendChild(makeKey('DEL', 'backspace', 'wide'));

      keyboard.appendChild(kr);
    });
  }

  function makeKey(label, key, extra) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'key' + (extra ? ' ' + extra : '');
    b.textContent = label;
    b.setAttribute('data-key', key);
    return b;
  }

  function paintCurrentRow() {
    var tiles = board.querySelectorAll('[data-row="' + row + '"] .tile');
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].textContent = current[i] || '';
      tiles[i].classList.toggle('filled', !!current[i]);
    }
  }

  function paintResult(marks) {
    var tiles = board.querySelectorAll('[data-row="' + row + '"] .tile');
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].classList.remove('filled');
      tiles[i].classList.add(marks[i]);
      /* Staggered so the row resolves left to right rather than all at once.
         base.css drops all transitions under prefers-reduced-motion. */
      tiles[i].style.transitionDelay = i * 90 + 'ms';

      /* Colour alone doesn't carry the result, so each tile says its own
         state. Without this the board is unreadable to a screen reader, and
         ambiguous to anyone who can't separate the green from the clay. */
      var letter = current[i];
      tiles[i].setAttribute(
        'aria-label',
        marks[i] === 'correct'
          ? letter + ', correct'
          : marks[i] === 'present'
            ? letter + ', wrong place'
            : letter + ', not in the word'
      );
    }
  }

  /* A letter's key never goes backwards: once it's shown correct, a later
     guess putting it in the wrong place shouldn't demote it to present. */
  var RANK = { absent: 0, present: 1, correct: 2 };

  function paintKeys(guess, marks) {
    for (var i = 0; i < guess.length; i++) {
      var ch = guess[i];
      if (!keyState[ch] || RANK[marks[i]] > RANK[keyState[ch]]) {
        keyState[ch] = marks[i];
      }
    }

    var keys = keyboard.querySelectorAll('[data-key]');
    for (var k = 0; k < keys.length; k++) {
      var state = keyState[keys[k].getAttribute('data-key')];
      keys[k].classList.remove('correct', 'present', 'absent');
      if (state) keys[k].classList.add(state);
    }
  }

  function say(text) {
    if (!statusEl) return;
    /* Cleared first so repeating the same message is still a text change,
       which is what a screen reader announces on. */
    statusEl.textContent = '';
    statusEl.textContent = text;
  }

  function shakeRow() {
    var tr = board.querySelector('[data-row="' + row + '"]');
    if (!tr) return;
    tr.classList.remove('bad');
    /* Reading offsetWidth restarts the animation; without it the class goes
       back on in the same frame and nothing replays. */
    void tr.offsetWidth;
    tr.classList.add('bad');
  }

  /* ---------- Game flow ---------- */
  function loadPuzzle() {
    if (index >= PUZZLES.length) return finish();

    answer = atob(PUZZLES[index].answer).toUpperCase();
    hint = PUZZLES[index].hint;
    row = 0;
    current = '';
    over = false;
    keyState = {};

    buildBoard();
    buildKeyboard();

    /* The clue goes up with the board, not after — it's what you play against. */
    if (hintEl) {
      hintEl.textContent = 'Hint: ' + hint;
      hintEl.hidden = false;
    }
    if (noteEl) {
      noteEl.hidden = true;
      noteEl.textContent = '';
    }
    if (nextBtn) nextBtn.hidden = true;
    say('Word ' + (index + 1) + ' of ' + PUZZLES.length + '. ');

    /* Puts the album away again when Play again starts a fresh round. */
    document.dispatchEvent(new CustomEvent('anniversary:playing'));
  }

  function submit() {
    if (over) return;

    if (current.length !== answer.length) {
      shakeRow();
      say('Needs ' + answer.length + ' letters.');
      return;
    }

    var marks = score(current, answer);
    paintResult(marks);
    paintKeys(current, marks);

    var won = current === answer;
    row++;

    if (won || row >= MAX_GUESSES) {
      over = true;
      reveal(won);
      return;
    }

    current = '';
    say(row + ' of ' + MAX_GUESSES + ' used.');
  }

  function reveal(won) {
    if (won) {
      index++;
      writeSolved(index);
    }

    /* Winning speaks for itself — the board is already all green. Only a loss
       needs the answer spelled out. */
    if (noteEl && !won) {
      noteEl.textContent = 'It was ' + answer + '. Close enough.';
      noteEl.hidden = false;
    }

    say(won ? 'Solved.' : 'Out of guesses. It was ' + answer + '.');

    if (index >= PUZZLES.length && won) return finish();
    if (nextBtn) {
      nextBtn.textContent = won ? 'Next word →' : 'Try again →';
      nextBtn.hidden = false;
    }
  }

  function finish() {
    /* Nothing left to play, and the keydown listener is still live. Without
       this, Enter here submits an empty guess against an empty answer, which
       compares equal and counts as another win. */
    over = true;
    board.textContent = '';
    keyboard.textContent = '';
    if (nextBtn) nextBtn.hidden = true;
    if (hintEl) hintEl.hidden = true;
    if (noteEl) {
      noteEl.textContent = 'Happy anniversary, Zoe.';
      noteEl.hidden = false;
    }
    say('');
    if (resetBtn) resetBtn.hidden = false;

    /* photos.js takes it from here. Announced as an event rather than called
       directly so this file doesn't need to know the album exists. */
    document.dispatchEvent(new CustomEvent('anniversary:finished'));
  }

  /* ---------- Input ---------- */
  function type(ch) {
    if (over || current.length >= answer.length) return;
    current += ch;
    paintCurrentRow();
  }

  function backspace() {
    if (over || !current.length) return;
    current = current.slice(0, -1);
    paintCurrentRow();
  }

  keyboard.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-key]');
    if (!btn) return;
    var key = btn.getAttribute('data-key');
    if (key === 'enter') submit();
    else if (key === 'backspace') backspace();
    else type(key);
  });

  document.addEventListener('keydown', function (e) {
    /* Leave modified keys alone so refresh and the like still work. */
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Enter') {
      /* Enter on a focused button is that button's business, not a guess. */
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      submit();
    } else if (e.key === 'Backspace') {
      backspace();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      type(e.key.toUpperCase());
    }
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      /* A loss doesn't advance index, so this replays the same word. */
      loadPuzzle();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      index = 0;
      writeSolved(0);
      resetBtn.hidden = true;
      loadPuzzle();
    });
  }

  loadPuzzle();
})();

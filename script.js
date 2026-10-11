/* The Lagom License — a lagom amount of JavaScript. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ── Toast ─────────────────────────────── */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  function copyText(text, msg) {
    var done = function () { toast(msg || 'Copied. Not too loudly.'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ── Theme: Midsommar / Midvinter ─────────────────────────────── */
  var themeBtn = $('#themeToggle'), themeLabel = $('#themeLabel');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : darkQuery.matches; }
  function syncTheme() {
    var dark = isDark();
    root.classList.toggle('is-dark', dark);
    themeLabel.textContent = dark ? 'Midvinter' : 'Midsommar';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to Midsommar (light)' : 'Switch to Midvinter (dark)');
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store('lagom-theme', next);
    syncTheme();
    toast(next === 'dark' ? 'Midvinter. The sun sets at 14:48.' : 'Midsommar. The sun does not set at all.');
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncTheme);
  syncTheme();

  /* ── Nav border on scroll ─────────────────────────────── */
  var nav = $('.nav');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Reveal on scroll ─────────────────────────────── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    // gentle stagger among siblings
    reveals.forEach(function (el) {
      var sibs = $$(':scope > .reveal', el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 0.07 + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── The Lagom-o-meter ─────────────────────────────── */
  var levelRoot = $('#levelRoot'), level = $('#level'), body = $('#levelBody');
  var word = $('#levelWord'), quip = $('#levelQuip'), confetti = $('#levelConfetti');
  var ZONES = [
    [8,   'All rights reserved.', 'Lawyers have been notified. Of what, nobody knows.'],
    [25,  'Copyleft.',            'Share everything, like it’s kindergarten.'],
    [42,  'Permissive.',          'Keep the notice around like a receipt you’ll never need.'],
    [57,  'Lagom.',               'Not too much. Not too little. Just right.'],
    [75,  'Do whatever.',         'Admirable spirit. Lacks a certain Scandinavian restraint.'],
    [92,  'Unlicensed.',          'Pretends law doesn’t exist. Law has opinions about that.'],
    [100, 'Anarchy.',             'Someone has brought the big bag of candy. On a Tuesday.']
  ];
  var userTouched = false, lastZone = null;

  function renderLevel(v) {
    v = +v;
    levelRoot.style.setProperty('--v', v);
    var z = ZONES[0];
    for (var i = 0; i < ZONES.length; i++) { if (v <= ZONES[i][0]) { z = ZONES[i]; break; } }
    var lagom = z[0] === 57;
    levelRoot.dataset.state = lagom ? 'lagom' : 'off';
    if (lastZone !== z) {
      word.textContent = z[1];
      quip.textContent = z[2];
      lastZone = z;
    }
    level.setAttribute('aria-valuetext', z[1].replace('.', ''));
  }

  level.addEventListener('input', function () {
    userTouched = true;
    confetti.classList.remove('show');
    renderLevel(level.value);
  });
  level.addEventListener('change', function () {
    var v = +level.value;
    if (v !== 50 && Math.abs(v - 50) <= 5) {
      // a gentle nudge toward balance
      animateTo(v, 50, 380);
      return;
    }
    if (v === 50) landed();
  });
  function landed() {
    if (!userTouched) return;
    confetti.classList.add('show');
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  }
  function animateTo(from, to, ms, done) {
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      level.value = Math.round(from + (to - from) * e);
      renderLevel(level.value);
      if (p < 1) requestAnimationFrame(step); else { (done || landed)(); }
    })(t0);
  }

  // Opening act: the bubble searches for balance, then settles.
  if (!reduceMotion) {
    var start = null, DUR = 2600;
    level.value = 92; renderLevel(92);
    setTimeout(function () {
      (function swing(t) {
        if (userTouched) return;
        if (start === null) start = t;
        var s = (t - start) / 1000;
        var v = 50 + 42 * Math.exp(-1.9 * s) * Math.cos(2 * Math.PI * 0.85 * s);
        level.value = Math.round(v);
        renderLevel(level.value);
        if (t - start < DUR) requestAnimationFrame(swing);
        else { level.value = 50; renderLevel(50); }
      })(performance.now());
    }, 900);
  } else {
    renderLevel(50);
  }

  /* ── Pronunciation ─────────────────────────────── */
  $('#sayIt').addEventListener('click', function () {
    if (!('speechSynthesis' in window)) { toast('Your browser cannot say it. LAH-gom. Not LAY-gum.'); return; }
    var u = new SpeechSynthesisUtterance('lagom');
    u.lang = 'sv-SE'; u.rate = 0.85;
    var voices = speechSynthesis.getVoices();
    var sv = voices.filter(function (v) { return /^sv/i.test(v.lang); })[0];
    if (sv) u.voice = sv;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    if (!sv) toast('No Swedish voice found. Imagine it calmer.');
  });

  /* ── Cinnamon buns: the second, never the third ─────────────────────────────── */
  var BUN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#C98A4B" stroke="#7A4A22" stroke-width="1.2"/><path d="M12 12 a1 1 0 0 1 2 0 a2 2 0 0 1 -4 0 a3 3 0 0 1 6 0 a4 4 0 0 1 -8 0 a5 5 0 0 1 10 0" fill="none" stroke="#7A4A22" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="7" r=".7" fill="#FBF3EA"/><circle cx="15" cy="6.5" r=".7" fill="#FBF3EA"/><circle cx="17" cy="15" r=".7" fill="#FBF3EA"/><circle cx="7" cy="16" r=".7" fill="#FBF3EA"/></svg>';
  var bun = $('#bun'), bunBtn = $('#bunBtn'), bunPlate = $('#bunPlate'), bunMsg = $('#bunMsg');
  var buns = 0;
  bunBtn.addEventListener('click', function () {
    if (buns === 3) {
      buns = 0; bunPlate.innerHTML = '';
      bunMsg.textContent = 'Plate cleared. Dishes done, without being asked.';
      bunBtn.textContent = 'Have a bun';
      return;
    }
    if (buns === 2) {
      buns = 3;
      bun.classList.remove('is-refused'); void bun.offsetWidth; bun.classList.add('is-refused');
      bunMsg.textContent = 'Never the third.';
      bunBtn.textContent = 'Clear the plate';
      return;
    }
    buns++;
    bunPlate.insertAdjacentHTML('beforeend', BUN_SVG);
    bunMsg.textContent = buns === 1 ? 'Fika has begun.' : 'Perfect. That is lagom.';
    bunBtn.textContent = buns === 1 ? 'Another?' : 'One more?';
  });

  /* ── Nice-to-haves checklist ─────────────────────────────── */
  var niceBoxes = $$('#niceList input'), niceProgress = $('#niceProgress');
  var savedNice = (store('lagom-nice') || '').split(',');
  niceBoxes.forEach(function (b) { b.checked = savedNice.indexOf(b.value) > -1; });
  function renderNice(announce) {
    var n = niceBoxes.filter(function (b) { return b.checked; }).length;
    var msgs = ['0 of 6. No pressure.', '1 of 6. A start.', '2 of 6. Steady.', '3 of 6. Halfway. Lagom, even.', '4 of 6. Steady on.', '5 of 6. Careful now.', 'All 6. Don’t overdo it.'];
    niceProgress.textContent = msgs[n];
    niceProgress.classList.toggle('done', n === 6);
    store('lagom-nice', niceBoxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }).join(','));
    if (announce && n === 6) toast('Everything done. Go have a fika.');
  }
  niceBoxes.forEach(function (b) {
    b.addEventListener('change', function () {
      if (b.value === 'water' && b.checked) toast('Hydrated. The Author is proud. Quietly.');
      renderNice(true);
    });
  });
  renderNice(false);

  /* ── Queue ticket ─────────────────────────────── */
  var queueNow = $('#queueNow'), ticketEl = $('#ticket'), ticketNum = $('#ticketNum'), ticketNote = $('#ticketNote');
  var serving = 30 + Math.floor(Math.random() * 60), myTicket = null, queueTimer = null;
  var pad = function (n) { return ('00' + (n % 1000)).slice(-3); };
  queueNow.textContent = pad(serving);
  $('#queueTake').addEventListener('click', function () {
    if (myTicket !== null && serving < myTicket) { toast('You already have a ticket. Two would not be lagom.'); return; }
    myTicket = serving + 3 + Math.floor(Math.random() * 5);
    ticketNum.textContent = pad(myTicket);
    ticketNote.textContent = 'Estimated wait: lagom.';
    ticketEl.hidden = false;
    ticketEl.style.animation = 'none'; void ticketEl.offsetWidth; ticketEl.style.animation = '';
    clearInterval(queueTimer);
    queueTimer = setInterval(function () {
      serving++;
      queueNow.textContent = pad(serving);
      if (serving >= myTicket) {
        clearInterval(queueTimer);
        ticketNote.textContent = 'Your turn. Nobody made eye contact.';
        toast('Nu betjänas ' + pad(myTicket) + '. That’s you.');
      } else {
        ticketNote.textContent = (myTicket - serving) + ' ahead of you. Stand at a lagom distance.';
      }
    }, 2400);
  });
  $('#cutQueue').addEventListener('click', function () {
    var g = $('#queueGuilt');
    g.hidden = false;
    this.textContent = 'You thought about it.';
    this.disabled = true;
  });

  /* ── Leftover screw ─────────────────────────────── */
  var screwLines = [
    'It goes nowhere.',
    'It has always gone nowhere.',
    'Put it in the kitchen drawer. With the others.',
    'The stool is fine. Sit on the stool.'
  ], screwI = 0;
  $('#screw').addEventListener('click', function () {
    this.classList.remove('spin'); void this.offsetWidth; this.classList.add('spin');
    $('#screwMsg').textContent = screwLines[screwI % screwLines.length];
    screwI++;
  });

  /* ── July calendar & support status ─────────────────────────────── */
  var now = new Date();
  (function buildJuly() {
    var cal = $('#julyCal');
    var y = now.getFullYear();
    var first = (new Date(y, 6, 1).getDay() + 6) % 7; // Monday-first
    var html = '<div class="m"><span>JULI ' + y + '</span><span>STÄNGT</span></div>';
    ['M', 'T', 'O', 'T', 'F', 'L', 'S'].forEach(function (d) { html += '<span class="dn">' + d + '</span>'; });
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= 31; d++) html += '<span class="d">' + d + '</span>';
    cal.innerHTML = html;
  })();
  (function julyStatus() {
    var el = $('#julyStatus'), m = now.getMonth();
    if (m === 6) {
      el.classList.add('is-off');
      el.textContent = 'Support: closed. The Author is at the summer house. It is red.';
    } else if (m === 7) {
      el.textContent = 'Support: open, technically. The Author is tanned and confused.';
    } else {
      var months = (6 - m + 12) % 12;
      el.textContent = 'Support: open. ' + months + ' month' + (months === 1 ? '' : 's') + ' until July. Plan accordingly.';
    }
  })();

  /* ── Lördagsgodis ─────────────────────────────── */
  (function candy() {
    var el = $('#candyStatus'), day = now.getDay();
    var en = now.toLocaleDateString('en-GB', { weekday: 'long' });
    var sv = now.toLocaleDateString('sv-SE', { weekday: 'long' });
    if (day === 6) {
      el.textContent = 'Today is Saturday (lördag). Breaking changes permitted. Small bag.';
    } else {
      var n = (6 - day + 7) % 7;
      el.classList.add('is-off');
      el.textContent = 'Today is ' + en + ' (' + sv + '). Breaking changes in ' + n + ' day' + (n === 1 ? '' : 's') + '. Patience.';
    }
  })();

  /* ── Fika dialog ─────────────────────────────── */
  var fika = $('#fika'), fikaTimer = $('#fikaTimer'), fikaLine = $('#fikaLine'), fikaInt, fikaStart;
  var fikaLines = [
    'Breathe in. The code will still be there.',
    'The bugs are also on fika. Mostly.',
    'Nobody is pushing to main right now.',
    'This is the second bun. Enjoy it.',
    'The standup can wait. It is standing.',
    'Balance is being restored. Slowly. Correctly.'
  ];
  $('#fikaOpen').addEventListener('click', function () {
    if (typeof fika.showModal !== 'function') { toast('Fika taken. Return when balanced.'); return; }
    fika.showModal();
    fikaStart = Date.now();
    var li = 0;
    fikaLine.textContent = fikaLines[0];
    fikaTimer.textContent = '0:00';
    clearInterval(fikaInt);
    fikaInt = setInterval(function () {
      var s = Math.floor((Date.now() - fikaStart) / 1000);
      fikaTimer.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      if (s > 0 && s % 6 === 0) {
        li = (li + 1) % fikaLines.length;
        fikaLine.style.opacity = 0;
        setTimeout(function () { fikaLine.textContent = fikaLines[li]; fikaLine.style.opacity = 1; }, 400);
      }
    }, 1000);
  });
  fika.addEventListener('close', function () {
    clearInterval(fikaInt);
    var s = Math.floor((Date.now() - fikaStart) / 1000);
    toast(s < 5 ? 'That was barely a fika. But fine.' : s > 900 ? 'Welcome back. That was a long fika. Respect.' : 'Welcome back. Balance restored.');
  });
  fika.addEventListener('click', function (e) { if (e.target === fika) fika.close(); });

  /* ── Steps: copy buttons ─────────────────────────────── */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { copyText($(b.dataset.copy).textContent.trim()); });
  });
  $$('[data-copy-text]').forEach(function (b) {
    b.addEventListener('click', function () { copyText(b.dataset.copyText, 'Badge copied. Wear it modestly.'); });
  });

  /* ── The license document ─────────────────────────────── */
  var licenseEl = $('#licenseText'), doc = $('#doc'), expandBtn = $('#docExpand');
  var pName = $('#pName'), pYear = $('#pYear');
  var original = null;
  var COPY_RE = /^Copyright \(c\) .*$/m;
  pYear.value = String(now.getFullYear());
  pName.value = store('lagom-name') || '';

  function personalized() {
    if (!original) return '';
    var name = pName.value.trim();
    if (!name) return original;
    var year = pYear.value.trim() || String(now.getFullYear());
    return original.replace(COPY_RE, 'Copyright (c) ' + year + ' ' + name);
  }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function renderDoc() {
    if (!original) return;
    var text = personalized();
    // Headings are short paragraphs (1–2 lines) written entirely in capitals.
    var html = esc(text).split(/\n{2,}/).map(function (para) {
      var lines = para.split('\n');
      var isHead = lines.length <= 2 && lines.every(function (l) {
        return /^[A-ZÄÖÅ]/.test(l) && l === l.toUpperCase() && /[A-ZÄÖÅ]{3}/.test(l);
      });
      if (isHead) return '<span class="h">' + para + '</span>';
      return para.replace(/^Copyright \(c\).*$/m, '<mark>$&</mark>');
    }).join('\n\n');
    licenseEl.innerHTML = html;
  }
  function loadLicense() {
    var sources = ['LICENSE', 'https://raw.githubusercontent.com/klppl/lagom-license/main/LICENSE'];
    (function attempt(i) {
      if (i >= sources.length) {
        licenseEl.innerHTML = 'The license could not be fetched. This is unfortunate, but expected.\n\nRead it on <a href="https://github.com/klppl/lagom-license/blob/main/LICENSE">GitHub</a> instead.';
        return;
      }
      fetch(sources[i], { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) {
          if (!/LAGOM LICENSE/.test(t)) throw new Error('not the license');
          original = t.replace(/\r\n/g, '\n');
          renderDoc();
        })
        .catch(function () { attempt(i + 1); });
    })(0);
  }
  loadLicense();

  var nameTimer;
  [pName, pYear].forEach(function (inp) {
    inp.addEventListener('input', function () {
      renderDoc();
      clearTimeout(nameTimer);
      nameTimer = setTimeout(function () { store('lagom-name', pName.value.trim() || null); }, 300);
    });
  });
  pName.addEventListener('change', function () {
    if (pName.value.trim() && original) toast('Your name is on it now. One line. Not 40pt.');
  });

  expandBtn.addEventListener('click', function () {
    var collapsed = doc.dataset.collapsed === 'true';
    doc.dataset.collapsed = collapsed ? 'false' : 'true';
    expandBtn.setAttribute('aria-expanded', String(collapsed));
    expandBtn.textContent = collapsed ? 'That’s enough now' : 'Read all of it';
    if (!collapsed) doc.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  $('#docCopy').addEventListener('click', function () {
    if (!original) return toast('Still loading. Calmly.');
    copyText(personalized(), 'License copied. Paste it somewhere sensible.');
  });
  $('#docDownload').addEventListener('click', function () {
    if (!original) return toast('Still loading. Calmly.');
    var blob = new Blob([personalized()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'LICENSE';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Downloaded. Flat-packed. No assembly required.');
  });
})();

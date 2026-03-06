// ── Language Switcher v3 ──
// Triple persistence: URL param > localStorage > cookie
// Works on GitHub Pages AND local file://
(function() {
  var KEY = 'sakae_lang';

  // ── Read saved language (3 sources) ──
  function getLang() {
    // 1. URL parameter (highest priority)
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('lang');
    if (fromUrl) return fromUrl;

    // 2. localStorage
    try {
      var ls = localStorage.getItem(KEY);
      if (ls) return ls;
    } catch(e) {}

    // 3. Cookie
    try {
      var match = document.cookie.match(new RegExp('(?:^|;)\\s*' + KEY + '=([^;]*)'));
      if (match) return match[1];
    } catch(e) {}

    return null;
  }

  // ── Save language (all 3 stores) ──
  function saveLang(code) {
    try { localStorage.setItem(KEY, code); } catch(e) {}
    try { document.cookie = KEY + '=' + code + ';path=/;max-age=31536000;SameSite=Lax'; } catch(e) {}
  }

  // ── Update all links on the page to carry ?lang= ──
  function updateLinks(lang) {
    if (lang === TRANSLATIONS._meta.default) {
      // Default language: remove ?lang= from links
      var links = document.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (href && href.indexOf('lang=') !== -1) {
          links[i].setAttribute('href', href.replace(/[?&]lang=[^&]*/g, '').replace(/\?$/, ''));
        }
      }
    } else {
      // Non-default: add ?lang= to internal links
      var links = document.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (!href) continue;
        // Skip external links, mailto, tel, #anchors
        if (href.indexOf('http') === 0 || href.indexOf('mailto') === 0 || href.indexOf('tel:') === 0 || href === '#') continue;
        // Remove existing lang param
        href = href.replace(/[?&]lang=[^&]*/g, '').replace(/\?$/, '');
        // Add new lang param
        var sep = href.indexOf('?') !== -1 ? '&' : '?';
        links[i].setAttribute('href', href + sep + 'lang=' + lang);
      }
    }
  }

  // ── Apply translations ──
  function applyTranslations(lang) {
    var dict = TRANSLATIONS[lang];
    if (!dict) return;

    // data-i18n → innerHTML
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        els[i].innerHTML = dict[key];
      }
    }

    // data-i18n-ph → placeholder
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var i = 0; i < phs.length; i++) {
      var key = phs[i].getAttribute('data-i18n-ph');
      if (dict[key] !== undefined) {
        phs[i].placeholder = dict[key];
      }
    }

    // Alert message for form
    window._i18nAlert = dict['contact.alert'] || '送信機能は準備中です';

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update all links to carry language
    updateLinks(lang);
  }

  // ── Build dropdown ──
  function buildDropdown(currentLang) {
    // Find nav in any page structure
    var nav = null;
    var header = document.getElementById('siteHeader');
    if (header) {
      nav = header.querySelector('.header-nav');
    }
    if (!nav) {
      nav = document.querySelector('.header-nav');
    }
    if (!nav) return;

    // Don't add twice
    if (nav.querySelector('.lang-switch')) return;

    var langs = TRANSLATIONS._meta.languages;
    var currentLabel = '';
    for (var i = 0; i < langs.length; i++) {
      if (langs[i].code === currentLang) { currentLabel = langs[i].label; break; }
    }
    if (!currentLabel) currentLabel = langs[0].label;

    var wrap = document.createElement('div');
    wrap.className = 'lang-switch';

    var btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.type = 'button';
    btn.textContent = currentLabel;

    var dd = document.createElement('div');
    dd.className = 'lang-dropdown';

    for (var i = 0; i < langs.length; i++) {
      (function(l) {
        var opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'lang-option' + (l.code === currentLang ? ' active' : '');
        opt.textContent = l.label;
        opt.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          saveLang(l.code);
          applyTranslations(l.code);
          btn.textContent = l.label;
          var allOpts = dd.querySelectorAll('.lang-option');
          for (var j = 0; j < allOpts.length; j++) allOpts[j].classList.remove('active');
          opt.classList.add('active');
          dd.classList.remove('open');
          // Notify page-specific rebuild (e.g. service tabs)
          if (typeof window.onLanguageChange === 'function') {
            window.onLanguageChange(l.code);
          }
        });
        dd.appendChild(opt);
      })(langs[i]);
    }

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dd.classList.toggle('open');
    });

    document.addEventListener('click', function() {
      dd.classList.remove('open');
    });

    wrap.appendChild(btn);
    wrap.appendChild(dd);

    // Insert before the last nav link (Contact)
    var cta = nav.querySelector('.nav-cta') || nav.querySelector('.contact-link');
    if (cta) {
      nav.insertBefore(wrap, cta);
    } else {
      nav.appendChild(wrap);
    }
  }

  // ── Init ──
  function init() {
    if (typeof TRANSLATIONS === 'undefined') return;

    var saved = getLang();
    var lang = saved || TRANSLATIONS._meta.default;

    // Always save (ensures all stores are synced)
    saveLang(lang);

    // Build UI
    buildDropdown(lang);

    // Apply if not default (default is already in HTML)
    if (lang !== TRANSLATIONS._meta.default) {
      applyTranslations(lang);
      if (typeof window.onLanguageChange === 'function') {
        window.onLanguageChange(lang);
      }
    }
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

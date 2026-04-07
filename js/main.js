/* ============================================================
   MAIN JAVASCRIPT — foodindustry.tj
   ============================================================ */
'use strict';

(function () {

/* ── LANGUAGE SYSTEM ─────────────────────────────────────────
   Language stored in URL query param ?lang=XX
   Persists across page navigations automatically
   ─────────────────────────────────────────────────────────── */
let currentLang = 'ru'; // Default: Russian (primary audience)

function getLangFromURL() {
  try {
    const p = new URLSearchParams(window.location.search);
    const l = p.get('lang');
    return ['en', 'ru', 'tj'].includes(l) ? l : null;
  } catch (e) { return null; }
}

function setLang(lang) {
  if (!['en', 'ru', 'tj'].includes(lang)) return;
  currentLang = lang;

  // Update HTML lang attribute
  document.documentElement.lang = lang === 'tj' ? 'tg' : lang;

  // Apply all translations
  applyTranslations();

  // Update all lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update URL without reload
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString());
  } catch (e) {}

  // Update all internal links to include lang param
  updateInternalLinks(lang);
}

function applyTranslations() {
  const strings = T[currentLang];
  if (!strings) return;

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (strings[key] !== undefined) el.textContent = strings[key];
  });

  // HTML content (safe — only our own strings)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (strings[key] !== undefined) el.innerHTML = strings[key];
  });

  // Placeholder attributes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (strings[key] !== undefined) el.setAttribute('placeholder', strings[key]);
  });

  // Title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (strings[key] !== undefined) el.setAttribute('title', strings[key]);
  });
}

function updateInternalLinks(lang) {
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('#')) return;
    try {
      const base = window.location.origin + window.location.pathname.split('/').slice(0,-1).join('/') + '/';
      const url = new URL(href, base);
      // Only update same-origin links
      if (url.origin === window.location.origin) {
        url.searchParams.set('lang', lang);
        a.setAttribute('href', url.pathname + '?' + url.searchParams.toString() + url.hash);
      }
    } catch (e) {}
  });
}

// Language button click handlers
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      setLang(this.dataset.lang);
    });
  });
}

/* ── NAVIGATION ──────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Active link detection
  const page = document.documentElement.dataset.page || '';
  document.querySelectorAll('.nav-link, .nav-mobile ul a').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });

  // Mobile menu toggle
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('nav-mobile');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
}

/* ── SCROLL ANIMATIONS ───────────────────────────────────────── */
function initFadeIn() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade').forEach(el => obs.observe(el));
}

/* ── COUNTER ANIMATION ───────────────────────────────────────── */
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      obs.unobserve(el);
      const key = el.dataset.i18n;
      const val = (T[currentLang] || T.en)[key] || '';
      // Extract leading number
      const match = val.replace(/\s/g, '').match(/^(\d+[\.,]?\d*)/);
      if (!match) return;
      const raw = parseFloat(match[1].replace(',', '.'));
      if (isNaN(raw)) return;
      const suffix = val.replace(/^[\d\s.,]+/, '');
      const dur = 1600;
      const start = performance.now();
      const isFloat = String(raw).includes('.');
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const cur = ease * raw;
        el.textContent = (isFloat ? cur.toFixed(1) : Math.floor(cur).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num[data-i18n]').forEach(el => obs.observe(el));
}

/* ── SCHEDULE TABS ───────────────────────────────────────────── */
function initScheduleTabs() {
  const tabs = document.querySelectorAll('.sched-tab');
  const days = document.querySelectorAll('.sched-day');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      days.forEach(d => d.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('active');
    });
  });
}

/* ── FAQ ACCORDION ───────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      // Close others
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });
    });
  });
}

/* ── FORM VALIDATION ─────────────────────────────────────────── */
function validateForm(formEl) {
  let valid = true;
  const strings = T[currentLang] || T.en;

  formEl.querySelectorAll('[required]').forEach(field => {
    const group = field.closest('.fg');
    const err = group ? group.querySelector('.fe') : null;
    field.classList.remove('error');
    if (group) group.classList.remove('error');
    if (!field.value.trim()) {
      valid = false;
      if (group) group.classList.add('error');
      if (err) err.textContent = strings['f.err.req'] || 'Required';
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      valid = false;
      if (group) group.classList.add('error');
      if (err) err.textContent = strings['f.err.email'] || 'Invalid email';
    }
  });
  return valid;
}

function initForms() {
  // Registration form
  const regForm = document.getElementById('reg-form');
  if (regForm) {
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(this)) return;
      showFormSuccess(this, 'f.success');
    });
  }

  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(this)) return;
      showFormSuccess(this, 'cf.success');
    });
  }
}

function showFormSuccess(formEl, msgKey) {
  const strings = T[currentLang] || T.en;
  formEl.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
  let success = formEl.querySelector('.form-success');
  if (!success) {
    success = document.createElement('div');
    success.className = 'form-success';
    formEl.appendChild(success);
  }
  success.textContent = strings[msgKey] || '✓ Thank you!';
  success.style.display = 'block';
  success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── SMOOTH SCROLL (anchor links) ───────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 90;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}

/* ── BACK TO TOP ─────────────────────────────────────────────── */
function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Determine language
  const urlLang = getLangFromURL();
  currentLang = urlLang || 'ru';

  initLangSwitcher();
  initNav();
  initFadeIn();
  initCounters();
  initScheduleTabs();
  initFAQ();
  initForms();
  initSmoothScroll();
  initBackTop();

  // Apply initial language (after DOM ready)
  setLang(currentLang);
});

})();

/* ── FILE UPLOAD HANDLER ─────────────────────────────────────
   Handles: file selection, drag-drop, preview, validation,
   remove action. Called on DOMContentLoaded.
   ─────────────────────────────────────────────────────────── */
(function () {

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getStr(key) {
    const strings = (typeof T !== 'undefined' && T[window._lang || 'ru']) || {};
    return strings[key] || '';
  }

  function showUploadError(area, input, msg) {
    const group = area.closest('.fg');
    if (group) {
      group.classList.add('error');
      const fe = group.querySelector('.fe');
      if (fe) fe.textContent = msg;
    }
    area.classList.add('error-state');
    input.value = '';
  }

  function clearUploadError(area) {
    const group = area.closest('.fg');
    if (group) group.classList.remove('error');
    area.classList.remove('error-state');
  }

  function handleFile(area, input, file) {
    if (!file) return;
    clearUploadError(area);

    const maxMB  = parseFloat(input.dataset.maxMb) || 5;
    const accept = (input.dataset.accept || 'image').toLowerCase(); // 'image' | 'doc'

    // Type validation
    const isImage = file.type.startsWith('image/jpeg') || file.type.startsWith('image/png') || file.type === 'image/jpg';
    const isPdf   = file.type === 'application/pdf';

    if (accept === 'image' && !isImage) {
      showUploadError(area, input, getStr('f.err.file.type.img') || 'Only JPG and PNG accepted');
      return;
    }
    if (accept === 'doc' && !isImage && !isPdf) {
      showUploadError(area, input, getStr('f.err.file.type.doc') || 'Only JPG, PNG and PDF accepted');
      return;
    }

    // Size validation
    if (file.size > maxMB * 1024 * 1024) {
      const errKey = maxMB <= 5 ? 'f.err.file.size5' : 'f.err.file.size10';
      showUploadError(area, input, getStr(errKey) || `Max ${maxMB} MB`);
      return;
    }

    // Mark area
    area.classList.add('has-file');

    // Animate progress bar
    const bar = area.querySelector('.upload-progress-bar');
    const prog = area.querySelector('.upload-progress');
    if (prog && bar) {
      prog.style.display = 'block';
      let w = 0;
      const iv = setInterval(() => {
        w = Math.min(w + 12, 100);
        bar.style.width = w + '%';
        if (w >= 100) { clearInterval(iv); setTimeout(() => { prog.style.display = 'none'; }, 300); }
      }, 30);
    }

    // Build preview
    const preview = area.querySelector('.upload-preview');
    if (!preview) return;
    preview.innerHTML = '';

    function buildPreview(imgSrc, isPdfFile) {
      const okText  = getStr('f.file.ok')     || 'File uploaded';
      const remText = getStr('f.file.remove') || 'Remove';

      preview.innerHTML = isPdfFile
        ? `<div class="preview-pdf-icon">📄</div>`
        : `<div class="preview-img-wrap"><img class="preview-img" src="${imgSrc}" alt="Preview"/></div>`;

      preview.innerHTML += `
        <div class="preview-meta">
          <div class="preview-name">${file.name}</div>
          <div class="preview-size">${formatBytes(file.size)}</div>
          <div class="preview-ok">${okText}</div>
        </div>
        <button type="button" class="preview-remove" aria-label="${remText}">${remText}</button>`;

      preview.classList.add('visible');

      // Remove button
      const removeBtn = preview.querySelector('.preview-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          input.value = '';
          preview.innerHTML = '';
          preview.classList.remove('visible');
          area.classList.remove('has-file', 'error-state');
          clearUploadError(area);
          // Re-translate remove button text after lang switch
        });
      }
    }

    if (isPdf) {
      buildPreview(null, true);
    } else {
      const reader = new FileReader();
      reader.onload = e => buildPreview(e.target.result, false);
      reader.readAsDataURL(file);
    }
  }

  function initFileUploads() {
    document.querySelectorAll('.upload-area').forEach(area => {
      const input   = area.querySelector('.upload-input');
      if (!input) return;

      // Click → input (label handles it naturally, but ensure)
      area.addEventListener('click', e => {
        if (e.target.classList.contains('preview-remove')) return;
        if (!area.classList.contains('has-file')) input.click();
      });

      // File selected via input
      input.addEventListener('change', function () {
        if (this.files && this.files[0]) handleFile(area, this, this.files[0]);
      });

      // Drag over
      area.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!area.classList.contains('has-file')) area.classList.add('drag-over');
      });
      area.addEventListener('dragleave', e => {
        e.stopPropagation();
        area.classList.remove('drag-over');
      });

      // Drop
      area.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.remove('drag-over');
        if (area.classList.contains('has-file')) return;
        const file = e.dataTransfer && e.dataTransfer.files[0];
        if (file) {
          try {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
          } catch (_) {}
          handleFile(area, input, file);
        }
      });
    });
  }

  // Validate upload fields in form submit
  function validateUploads(formEl) {
    let valid = true;
    formEl.querySelectorAll('.upload-area[data-required="true"]').forEach(area => {
      const input = area.querySelector('.upload-input');
      if (!input) return;
      if (!input.files || !input.files[0]) {
        showUploadError(area, input, getStr('f.err.file.req') || 'Please upload this file');
        valid = false;
      }
    });
    return valid;
  }

  // Extend existing form validation
  const origValidate = window._validateForm;
  window._validateUploads = validateUploads;

  document.addEventListener('DOMContentLoaded', () => {
    initFileUploads();

    // Patch reg-form submit to also validate uploads
    const regForm = document.getElementById('reg-form');
    if (regForm) {
      const listeners = regForm._uploadPatched;
      if (!listeners) {
        regForm._uploadPatched = true;
        regForm.addEventListener('submit', function (e) {
          const uploadsOk = validateUploads(this);
          if (!uploadsOk) e.stopImmediatePropagation();
        }, true); // capture = true, fires before main.js handler
      }
    }
  });

})();

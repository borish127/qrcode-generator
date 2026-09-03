/**
 * QR Code Generator — Material Design 3 Expressive Studio
 * ========================================================
 * Architecture & Design matching PyFDA-Web standards.
 * 100% Client-side, privacy-focused, zero backend dependencies.
 *
 * Uses qr-code-styling for high-quality SVG and Canvas rendering.
 */

'use strict';

/* ==============================================================
   0. DOM Elements Cache
   ============================================================== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  // Input
  qrText: $('#qr-text'),

  // Background
  bgColor: $('#bg-color'),
  bgColorHex: $('#bg-color-hex'),
  bgSolidGroup: $('#bg-solid-group'),
  bgGradCtrl: $('#bg-gradient-controls'),
  bgGradC1: $('#bg-grad-color1'),
  bgGradC2: $('#bg-grad-color2'),
  bgGradHex1: $('#bg-grad-hex1'),
  bgGradHex2: $('#bg-grad-hex2'),
  bgGradAngle: $('#bg-grad-angle'),
  bgGradAngleV: $('#bg-grad-angle-val'),

  // Dots
  dotShape: $('#dot-shape'),
  dotColor: $('#dot-color'),
  dotColorHex: $('#dot-color-hex'),
  dotSingleGrp: $('#dot-single-color-group'),
  dotGradCtrl: $('#dot-gradient-controls'),
  dotGradC1: $('#dot-grad-color1'),
  dotGradC2: $('#dot-grad-color2'),
  dotGradHex1: $('#dot-grad-hex1'),
  dotGradHex2: $('#dot-grad-hex2'),
  dotGradAngle: $('#dot-grad-angle'),
  dotGradAngleV: $('#dot-grad-angle-val'),

  // Corner Squares (Frames)
  csqShape: $('#corner-sq-shape'),
  csqColor: $('#csq-color'),
  csqColorHex: $('#csq-color-hex'),
  csqSingleGrp: $('#csq-single-color-group'),
  csqGradCtrl: $('#csq-gradient-controls'),
  csqGradC1: $('#csq-grad-color1'),
  csqGradC2: $('#csq-grad-color2'),
  csqGradHex1: $('#csq-grad-hex1'),
  csqGradHex2: $('#csq-grad-hex2'),
  csqGradAngle: $('#csq-grad-angle'),
  csqGradAngleV: $('#csq-grad-angle-val'),

  // Corner Dots (Eye centers)
  cdShape: $('#corner-dot-shape'),
  cdColor: $('#cd-color'),
  cdColorHex: $('#cd-color-hex'),
  cdSingleGrp: $('#cd-single-color-group'),
  cdGradCtrl: $('#cd-gradient-controls'),
  cdGradC1: $('#cd-grad-color1'),
  cdGradC2: $('#cd-grad-color2'),
  cdGradHex1: $('#cd-grad-hex1'),
  cdGradHex2: $('#cd-grad-hex2'),
  cdGradAngle: $('#cd-grad-angle'),
  cdGradAngleV: $('#cd-grad-angle-val'),

  // Logo
  logoInput: $('#logo-input'),
  logoUpload: $('#logo-upload-area'),
  logoPrevCont: $('#logo-preview-container'),
  logoPrevImg: $('#logo-preview-img'),
  logoFilename: $('#logo-filename'),
  removeLogoBtn: $('#remove-logo-btn'),
  logoOptions: $('#logo-options'),
  logoSize: $('#logo-size'),
  logoSizeVal: $('#logo-size-val'),
  logoMarginGrp: $('#logo-margin-group'),
  logoMargin: $('#logo-margin'),
  logoMarginVal: $('#logo-margin-val'),
  logoModeToggle: $('#logo-mode-toggle'),
  logoBehind: $('#logo-behind'),

  // Preview
  qrPreview: $('#qr-preview'),

  // Export
  downloadPng: $('#download-png'),
  downloadJpeg: $('#download-jpeg'),
  downloadSvg: $('#download-svg'),
  exportResLabel: $('#export-res-label'),

  // Templates / Gallery
  saveDesignBtn: $('#save-design-btn'),
  galleryEl: $('#session-gallery'),
  galleryNote: $('#gallery-limit-note'),
  exportJsonBtn: $('#export-json-btn'),
  importJsonBtn: $('#import-json-btn'),
  importJsonInp: $('#import-json-input'),

  // Top Bar & Actions
  btnTheme: $('#btn-theme'),
  themeIconSun: $('.theme-icon-sun'),
  themeIconMoon: $('.theme-icon-moon'),
  metaThemeColor: $('#meta-theme-color'),

  // About Modal
  btnAbout: $('#btn-about'),
  aboutModalBackdrop: $('#about-modal-backdrop'),
  aboutModal: $('#about-modal'),
  btnCloseAbout: $('#btn-close-about'),

  // Toast Container
  toastContainer: $('#toast-container'),
};

/* ==============================================================
   1. TOAST NOTIFICATION SYSTEM (PyFDA-Web Style)
   ============================================================== */

function showToast(message, type = 'info', duration = 3000) {
  if (!dom.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* ==============================================================
   2. STATE MANAGER
   ============================================================== */

const StateManager = (() => {
  const GALLERY_KEY = 'qr-session-gallery-v2';
  const THEME_KEY = 'qr-theme-v2';
  const MAX_DESIGNS = 25;

  let logoDataUrl = null;

  /* ─── Radio Helpers ─── */
  function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function setRadio(name, value) {
    const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (el) el.checked = true;
  }

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /* ─── Theme Management ─── */
  function detectSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initTheme() {
    let savedTheme;
    try {
      savedTheme = localStorage.getItem(THEME_KEY);
    } catch {
      savedTheme = null;
    }
    const theme = savedTheme || detectSystemTheme();
    applyTheme(theme === 'dark', false);

    // Listen for OS theme change if not manually locked
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches, false);
        }
      });
    } catch { /* old browser */ }
  }

  function applyTheme(isDark, persist = true) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);

    if (dom.themeIconSun && dom.themeIconMoon) {
      dom.themeIconSun.classList.toggle('hidden', !isDark);
      dom.themeIconMoon.classList.toggle('hidden', isDark);
    }

    if (dom.metaThemeColor) {
      dom.metaThemeColor.setAttribute('content', isDark ? '#121318' : '#3a5ba9');
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch { /* storage disabled */ }
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextDark = current !== 'dark';
    applyTheme(nextDark, true);
    showToast(`Switched to ${nextDark ? 'Dark' : 'Light'} theme`);
  }

  /* ─── QR Options Builder ─── */
  function buildQrOptions() {
    return {
      width: 1024,
      height: 1024,
      type: 'canvas',
      data: dom.qrText.value.trim() || 'https://borish127.github.io/qrcode-generator/',
      margin: 14,
      qrOptions: {
        errorCorrectionLevel: 'H' // High error correction for logo resilience
      },
      dotsOptions: buildPartOptions('dot'),
      cornersSquareOptions: buildPartOptions('csq'),
      cornersDotOptions: buildPartOptions('cd'),
      backgroundOptions: buildBgOptions(),
      image: logoDataUrl || undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: parseInt(dom.logoMargin.value, 10),
        imageSize: parseFloat(dom.logoSize.value) / 100,
        hideBackgroundDots: dom.logoBehind.checked,
      },
    };
  }

  function buildBgOptions() {
    const mode = getRadio('bg-mode');
    if (mode === 'transparent') {
      return { color: 'transparent', gradient: undefined };
    }
    if (mode === 'gradient') {
      return {
        color: undefined,
        gradient: {
          type: 'linear',
          rotation: degToRad(parseInt(dom.bgGradAngle.value, 10) || 135),
          colorStops: [
            { offset: 0, color: dom.bgGradC1.value },
            { offset: 1, color: dom.bgGradC2.value },
          ],
        },
      };
    }
    return { color: dom.bgColor.value, gradient: undefined };
  }

  function buildPartOptions(prefix) {
    const shapeMap = { dot: dom.dotShape, csq: dom.csqShape, cd: dom.cdShape };
    const radioName = { dot: 'dot-color-mode', csq: 'csq-color-mode', cd: 'cd-color-mode' }[prefix];
    const mode = getRadio(radioName);
    const opts = { type: shapeMap[prefix].value };

    if (mode === 'gradient') {
      const c1 = { dot: dom.dotGradC1, csq: dom.csqGradC1, cd: dom.cdGradC1 }[prefix];
      const c2 = { dot: dom.dotGradC2, csq: dom.csqGradC2, cd: dom.cdGradC2 }[prefix];
      const angle = { dot: dom.dotGradAngle, csq: dom.csqGradAngle, cd: dom.cdGradAngle }[prefix];

      opts.color = undefined;
      opts.gradient = {
        type: 'linear',
        rotation: degToRad(parseInt(angle.value, 10) || 135),
        colorStops: [
          { offset: 0, color: c1.value },
          { offset: 1, color: c2.value },
        ],
      };
    } else {
      const c = { dot: dom.dotColor, csq: dom.csqColor, cd: dom.cdColor }[prefix];
      opts.color = c.value;
      opts.gradient = undefined;
    }

    return opts;
  }

  /* ─── State Serialization ─── */
  function gatherState() {
    return {
      version: 3,
      timestamp: Date.now(),
      text: dom.qrText.value,

      bgMode: getRadio('bg-mode'),
      bgColor: dom.bgColor.value,
      bgGradC1: dom.bgGradC1.value,
      bgGradC2: dom.bgGradC2.value,
      bgGradAngle: dom.bgGradAngle.value,

      dotShape: dom.dotShape.value,
      dotColorMode: getRadio('dot-color-mode'),
      dotColor: dom.dotColor.value,
      dotGradC1: dom.dotGradC1.value,
      dotGradC2: dom.dotGradC2.value,
      dotGradAngle: dom.dotGradAngle.value,

      csqShape: dom.csqShape.value,
      csqColorMode: getRadio('csq-color-mode'),
      csqColor: dom.csqColor.value,
      csqGradC1: dom.csqGradC1.value,
      csqGradC2: dom.csqGradC2.value,
      csqGradAngle: dom.csqGradAngle.value,

      cdShape: dom.cdShape.value,
      cdColorMode: getRadio('cd-color-mode'),
      cdColor: dom.cdColor.value,
      cdGradC1: dom.cdGradC1.value,
      cdGradC2: dom.cdGradC2.value,
      cdGradAngle: dom.cdGradAngle.value,

      logoDataUrl: logoDataUrl,
      logoSize: dom.logoSize.value,
      logoMargin: dom.logoMargin.value,
      logoBehind: dom.logoBehind.checked,
    };
  }

  function applyState(s) {
    if (!s) return;

    dom.qrText.value = s.text || '';

    // Background
    setRadio('bg-mode', s.bgMode || 'solid');
    dom.bgColor.value = s.bgColor || '#ffffff';
    dom.bgColorHex.textContent = dom.bgColor.value;
    dom.bgGradC1.value = s.bgGradC1 || '#d8e2ff';
    dom.bgGradHex1.textContent = dom.bgGradC1.value;
    dom.bgGradC2.value = s.bgGradC2 || '#ffffff';
    dom.bgGradHex2.textContent = dom.bgGradC2.value;
    dom.bgGradAngle.value = s.bgGradAngle || '135';
    dom.bgGradAngleV.textContent = `${dom.bgGradAngle.value}°`;
    UIRenderer.syncBgUI(s.bgMode || 'solid');

    // Dots
    dom.dotShape.value = s.dotShape || 'rounded';
    setRadio('dot-color-mode', s.dotColorMode || 'solid');
    dom.dotColor.value = s.dotColor || '#001a41';
    dom.dotColorHex.textContent = dom.dotColor.value;
    dom.dotGradC1.value = s.dotGradC1 || '#1f4490';
    dom.dotGradHex1.textContent = dom.dotGradC1.value;
    dom.dotGradC2.value = s.dotGradC2 || '#3a5ba9';
    dom.dotGradHex2.textContent = dom.dotGradC2.value;
    dom.dotGradAngle.value = s.dotGradAngle || '135';
    dom.dotGradAngleV.textContent = `${dom.dotGradAngle.value}°`;
    UIRenderer.syncColorModeUI('dot-color-mode', dom.dotSingleGrp, dom.dotGradCtrl);

    // Corner Squares
    dom.csqShape.value = s.csqShape || 'square';
    setRadio('csq-color-mode', s.csqColorMode || 'solid');
    dom.csqColor.value = s.csqColor || '#001a41';
    dom.csqColorHex.textContent = dom.csqColor.value;
    dom.csqGradC1.value = s.csqGradC1 || '#001a41';
    dom.csqGradHex1.textContent = dom.csqGradC1.value;
    dom.csqGradC2.value = s.csqGradC2 || '#3a5ba9';
    dom.csqGradHex2.textContent = dom.csqGradC2.value;
    dom.csqGradAngle.value = s.csqGradAngle || '135';
    dom.csqGradAngleV.textContent = `${dom.csqGradAngle.value}°`;
    UIRenderer.syncColorModeUI('csq-color-mode', dom.csqSingleGrp, dom.csqGradCtrl);

    // Corner Dots
    dom.cdShape.value = s.cdShape || 'dot';
    setRadio('cd-color-mode', s.cdColorMode || 'solid');
    dom.cdColor.value = s.cdColor || '#001a41';
    dom.cdColorHex.textContent = dom.cdColor.value;
    dom.cdGradC1.value = s.cdGradC1 || '#001a41';
    dom.cdGradHex1.textContent = dom.cdGradC1.value;
    dom.cdGradC2.value = s.cdGradC2 || '#3a5ba9';
    dom.cdGradHex2.textContent = dom.cdGradC2.value;
    dom.cdGradAngle.value = s.cdGradAngle || '135';
    dom.cdGradAngleV.textContent = `${dom.cdGradAngle.value}°`;
    UIRenderer.syncColorModeUI('cd-color-mode', dom.cdSingleGrp, dom.cdGradCtrl);

    // Logo
    logoDataUrl = s.logoDataUrl || null;
    dom.logoSize.value = s.logoSize || '30';
    dom.logoSizeVal.textContent = `${dom.logoSize.value}%`;
    dom.logoMargin.value = s.logoMargin || '5';
    dom.logoMarginVal.textContent = `${dom.logoMargin.value}px`;
    dom.logoBehind.checked = s.logoBehind !== undefined ? s.logoBehind : true;

    if (logoDataUrl) {
      dom.logoPrevImg.src = logoDataUrl;
      dom.logoFilename.textContent = 'Custom Logo';
    }
    UIRenderer.syncLogoUI(!!logoDataUrl);

    EventHandlers.scheduleUpdate();
  }

  /* ─── Logo Management ─── */
  function setLogo(dataUrl, filename) {
    logoDataUrl = dataUrl;
    dom.logoPrevImg.src = dataUrl;
    dom.logoFilename.textContent = filename;
    UIRenderer.syncLogoUI(true);
    EventHandlers.scheduleUpdate();
    showToast('Center logo loaded');
  }

  function clearLogo() {
    logoDataUrl = null;
    dom.logoInput.value = '';
    dom.logoPrevImg.src = '';
    dom.logoFilename.textContent = '';
    UIRenderer.syncLogoUI(false);
    EventHandlers.scheduleUpdate();
    showToast('Center logo removed');
  }

  /* ─── Gallery Persistence ─── */
  function loadGallery() {
    try {
      return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveGallery(gallery) {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    } catch {
      showToast('Storage full — please remove an old design', 'error');
    }
  }

  function addDesign(thumbnail) {
    const gallery = loadGallery();
    if (gallery.length >= MAX_DESIGNS) {
      showToast(`Storage limit reached (${MAX_DESIGNS} designs max)`, 'error');
      return false;
    }
    gallery.unshift({ state: gatherState(), thumbnail, ts: Date.now() });
    saveGallery(gallery);
    return true;
  }

  function removeDesign(index) {
    const gallery = loadGallery();
    gallery.splice(index, 1);
    saveGallery(gallery);
  }

  function getDesignState(index) {
    const gallery = loadGallery();
    return gallery[index] ? gallery[index].state : null;
  }

  function getExportScale() {
    return parseInt(getRadio('export-res') || '4', 10);
  }

  return {
    initTheme, applyTheme, toggleTheme,
    buildQrOptions, gatherState, applyState,
    setLogo, clearLogo,
    loadGallery, addDesign, removeDesign, getDesignState,
    getExportScale, getRadio, setRadio,
    MAX_DESIGNS
  };
})();

/* ==============================================================
   3. UI RENDERER
   ============================================================== */

const UIRenderer = (() => {

  function syncBgUI(mode) {
    dom.bgSolidGroup.classList.toggle('hidden', mode !== 'solid');
    dom.bgGradCtrl.classList.toggle('hidden', mode !== 'gradient');
  }

  function syncColorModeUI(radioName, solidGroup, gradCtrl) {
    const mode = StateManager.getRadio(radioName);
    solidGroup.classList.toggle('hidden', mode !== 'solid');
    gradCtrl.classList.toggle('hidden', mode !== 'gradient');
  }

  function syncLogoUI(hasLogo) {
    dom.logoPrevCont.classList.toggle('hidden', !hasLogo);
    dom.logoUpload.classList.toggle('hidden', hasLogo);
    dom.logoOptions.classList.toggle('hidden', !hasLogo);
  }

  function renderGallery() {
    const gallery = StateManager.loadGallery();
    dom.galleryEl.innerHTML = '';

    if (gallery.length === 0) {
      dom.galleryEl.innerHTML = '<div class="gallery-empty">No saved designs yet</div>';
      dom.galleryNote.textContent = `0 / ${StateManager.MAX_DESIGNS} saved`;
      return;
    }

    gallery.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.title = `Saved Design ${i + 1} — Click to restore`;

      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = `Preset ${i + 1}`;
      card.appendChild(img);

      const del = document.createElement('button');
      del.className = 'gallery-card__delete';
      del.innerHTML = '&times;';
      del.title = 'Delete preset';
      del.setAttribute('aria-label', `Delete preset ${i + 1}`);

      del.addEventListener('click', (e) => {
        e.stopPropagation();
        StateManager.removeDesign(i);
        renderGallery();
        showToast('Design deleted');
      });
      card.appendChild(del);

      card.addEventListener('click', () => {
        const state = StateManager.getDesignState(i);
        if (state) {
          StateManager.applyState(state);
          showToast(`Restored design ${i + 1}`, 'success');
        }
      });

      dom.galleryEl.appendChild(card);
    });

    dom.galleryNote.textContent = `${gallery.length} / ${StateManager.MAX_DESIGNS} saved`;
  }

  return { syncBgUI, syncColorModeUI, syncLogoUI, renderGallery };
})();

/* ==============================================================
   4. EVENT HANDLERS
   ============================================================== */

const EventHandlers = (() => {
  let updateTimer = null;
  let qrCode = null;

  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      if (qrCode) {
        qrCode.update(StateManager.buildQrOptions());
      }
    }, 90);
  }

  /* ─── Helpers ─── */
  function wireColor(input, hexSpan) {
    input.addEventListener('input', () => {
      hexSpan.textContent = input.value;
      scheduleUpdate();
    });
  }

  function wireRange(input, valSpan, unit = '') {
    input.addEventListener('input', () => {
      valSpan.textContent = `${input.value}${unit}`;
      scheduleUpdate();
    });
  }

  function wireColorModeToggle(radioName, solidGroup, gradCtrl) {
    $$(`input[name="${radioName}"]`).forEach(r => {
      r.addEventListener('change', () => {
        UIRenderer.syncColorModeUI(radioName, solidGroup, gradCtrl);
        scheduleUpdate();
      });
    });
  }

  /* ─── Logo File Handling ─── */
  function processLogoFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      StateManager.setLogo(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }

  /* ─── Download Action ─── */
  function downloadQr(ext) {
    const scale = StateManager.getExportScale();
    const base = 512;
    const size = base * scale;
    const opts = StateManager.buildQrOptions();
    opts.width = size;
    opts.height = size;
    if (ext === 'svg') opts.type = 'svg';

    try {
      const exportInstance = new QRCodeStyling(opts);
      exportInstance.download({ name: 'qrcode', extension: ext })
        .then(() => {
          showToast(`Exported ${ext.toUpperCase()} (${scale}x — ${size}px)`, 'success');
        })
        .catch(() => {
          showToast('Export failed — please try again', 'error');
        });
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    }
  }

  /* ─── Gallery & Presets ─── */
  function saveDesign() {
    const canvas = dom.qrPreview.querySelector('canvas');
    if (!canvas) {
      showToast('QR canvas not ready yet', 'error');
      return;
    }

    try {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 140;
      thumbCanvas.height = 140;
      const ctx = thumbCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 140, 140);
      const thumbnail = thumbCanvas.toDataURL('image/png', 0.85);

      if (StateManager.addDesign(thumbnail)) {
        UIRenderer.renderGallery();
        showToast('Design saved to presets', 'success');
      }
    } catch {
      showToast('Could not save design thumbnail', 'error');
    }
  }

  /* ─── JSON Export / Import ─── */
  function exportJson() {
    try {
      const state = StateManager.gatherState();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-preset-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Configuration exported as JSON', 'success');
    } catch {
      showToast('Failed to export configuration', 'error');
    }
  }

  function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const state = JSON.parse(ev.target.result);
        StateManager.applyState(state);
        showToast('Configuration imported successfully', 'success');
      } catch {
        showToast('Invalid JSON preset file', 'error');
      }
    };
    reader.readAsText(file);
    dom.importJsonInp.value = '';
  }

  /* ─── Modal Handling ─── */
  function openAboutModal() {
    dom.aboutModalBackdrop.classList.add('open');
  }

  function closeAboutModal() {
    dom.aboutModalBackdrop.classList.remove('open');
  }

  /* ─── Wire Events ─── */
  function wireAll() {
    // Theme toggle
    dom.btnTheme.addEventListener('click', StateManager.toggleTheme);

    // About Modal
    dom.btnAbout.addEventListener('click', openAboutModal);
    dom.btnCloseAbout.addEventListener('click', closeAboutModal);
    dom.aboutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.aboutModalBackdrop) closeAboutModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.aboutModalBackdrop.classList.contains('open')) {
        closeAboutModal();
      }
    });

    // QR Payload text
    dom.qrText.addEventListener('input', scheduleUpdate);

    // Background mode
    $$('input[name="bg-mode"]').forEach(r => {
      r.addEventListener('change', () => {
        UIRenderer.syncBgUI(StateManager.getRadio('bg-mode'));
        scheduleUpdate();
      });
    });

    wireColor(dom.bgColor, dom.bgColorHex);
    wireColor(dom.bgGradC1, dom.bgGradHex1);
    wireColor(dom.bgGradC2, dom.bgGradHex2);
    wireRange(dom.bgGradAngle, dom.bgGradAngleV, '°');

    // Dots
    dom.dotShape.addEventListener('change', scheduleUpdate);
    wireColorModeToggle('dot-color-mode', dom.dotSingleGrp, dom.dotGradCtrl);
    wireColor(dom.dotColor, dom.dotColorHex);
    wireColor(dom.dotGradC1, dom.dotGradHex1);
    wireColor(dom.dotGradC2, dom.dotGradHex2);
    wireRange(dom.dotGradAngle, dom.dotGradAngleV, '°');

    // Corner Squares (Frames)
    dom.csqShape.addEventListener('change', scheduleUpdate);
    wireColorModeToggle('csq-color-mode', dom.csqSingleGrp, dom.csqGradCtrl);
    wireColor(dom.csqColor, dom.csqColorHex);
    wireColor(dom.csqGradC1, dom.csqGradHex1);
    wireColor(dom.csqGradC2, dom.csqGradHex2);
    wireRange(dom.csqGradAngle, dom.csqGradAngleV, '°');

    // Corner Dots (Eye centers)
    dom.cdShape.addEventListener('change', scheduleUpdate);
    wireColorModeToggle('cd-color-mode', dom.cdSingleGrp, dom.cdGradCtrl);
    wireColor(dom.cdColor, dom.cdColorHex);
    wireColor(dom.cdGradC1, dom.cdGradHex1);
    wireColor(dom.cdGradC2, dom.cdGradHex2);
    wireRange(dom.cdGradAngle, dom.cdGradAngleV, '°');

    // Center Logo upload
    dom.logoUpload.addEventListener('click', () => dom.logoInput.click());
    dom.logoInput.addEventListener('change', (e) => processLogoFile(e.target.files[0]));
    dom.removeLogoBtn.addEventListener('click', StateManager.clearLogo);

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dom.logoUpload.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.logoUpload.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dom.logoUpload.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.logoUpload.classList.remove('dragover');
      });
    });
    dom.logoUpload.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        processLogoFile(dt.files[0]);
      }
    });

    wireRange(dom.logoSize, dom.logoSizeVal, '%');
    wireRange(dom.logoMargin, dom.logoMarginVal, 'px');
    dom.logoBehind.addEventListener('change', scheduleUpdate);

    // Resolution change label
    $$('input[name="export-res"]').forEach(r => {
      r.addEventListener('change', () => {
        const scale = StateManager.getExportScale();
        const size = 512 * scale;
        dom.exportResLabel.textContent = `${scale}x (${size}px)`;
      });
    });

    // Downloads
    dom.downloadPng.addEventListener('click', () => downloadQr('png'));
    dom.downloadJpeg.addEventListener('click', () => downloadQr('jpeg'));
    dom.downloadSvg.addEventListener('click', () => downloadQr('svg'));

    // Presets & JSON
    dom.saveDesignBtn.addEventListener('click', saveDesign);
    dom.exportJsonBtn.addEventListener('click', exportJson);
    dom.importJsonBtn.addEventListener('click', () => dom.importJsonInp.click());
    dom.importJsonInp.addEventListener('change', importJson);
  }

  /* ─── Init ─── */
  function init() {
    StateManager.initTheme();

    // Instantiate qr-code-styling
    qrCode = new QRCodeStyling(StateManager.buildQrOptions());
    qrCode.append(dom.qrPreview);

    wireAll();
    UIRenderer.renderGallery();
  }

  return { init, scheduleUpdate };
})();

/* ==============================================================
   5. BOOTSTRAP
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
  EventHandlers.init();
});

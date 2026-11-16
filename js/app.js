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
  // Input & Quality
  qrText: $('#qr-text'),
  qrEclLabel: $('#qr-ecl-label'),

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

  // Top Bar & Theme
  btnTheme: $('#btn-theme'),
  schemeMeta: $('meta[name="color-scheme"]'),
  metaThemeColor: $('#meta-theme-color'),

  // About Modal
  btnAbout: $('#btn-about'),
  aboutModal: $('#about-modal'),

  // Toast Container & Announcer
  toastContainer: $('#toast-container'),
  toastAnnouncer: $('#toast-announcer'),
};

/* ==============================================================
   0b. INTEREST HINT & TOP-LAYER HELPERS
   ============================================================== */

/**
 * Wire accessible ARIA relationships for [interestfor] hint popovers upfront,
 * before any polyfill runs.
 */
function wireInterestHints(root = document) {
  const ownedTriggers = new WeakSet();

  const normalize = (str) => (str || '').replace(/\s+/g, ' ').trim();

  const getAccessibleName = (el) => {
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ');
      if (normalize(text)) return normalize(text);
    }
    if (el.hasAttribute('aria-label')) {
      return normalize(el.getAttribute('aria-label'));
    }
    const text = el.innerText || el.textContent || '';
    if (normalize(text)) return normalize(text);
    const imgWithAlt = el.querySelector('img[alt]');
    if (imgWithAlt && normalize(imgWithAlt.alt)) return normalize(imgWithAlt.alt);
    return normalize(el.getAttribute('title'));
  };

  root.querySelectorAll('[interestfor]').forEach((trigger) => {
    const targetId = trigger.getAttribute('interestfor');
    if (!targetId) return;
    const hint = document.getElementById(targetId);
    if (!hint || hint.getAttribute('popover') !== 'hint') return;

    const hintText = normalize(hint.innerText || hint.textContent);
    const triggerName = getAccessibleName(trigger);

    if (hintText && triggerName && hintText === triggerName) {
      return;
    }

    if (!hint.hasAttribute('role')) {
      hint.setAttribute('role', 'tooltip');
    }

    if (!triggerName) {
      if (!trigger.hasAttribute('aria-labelledby')) {
        trigger.setAttribute('aria-labelledby', targetId);
      }
      return;
    }

    const activationTarget = trigger.getAttribute('popovertarget') || trigger.getAttribute('commandfor');
    if (activationTarget === targetId) {
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', String(hint.matches(':popover-open')));
        ownedTriggers.add(trigger);
      }
    } else if (!trigger.hasAttribute('aria-describedby')) {
      trigger.setAttribute('aria-describedby', targetId);
    }
  });

  if (!wireInterestHints._toggleWired) {
    wireInterestHints._toggleWired = true;
    document.addEventListener(
      'toggle',
      (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || target.getAttribute('popover') !== 'hint' || !target.id) {
          return;
        }
        const expanded = String(event.newState === 'open');
        document.querySelectorAll(`[interestfor="${CSS.escape(target.id)}"]`).forEach((trigger) => {
          if (ownedTriggers.has(trigger)) {
            trigger.setAttribute('aria-expanded', expanded);
          }
        });
      },
      true
    );
  }
}

// Run immediately while deferred DOM is parsed, before module polyfills load
wireInterestHints();

// Fallback for browsers where popover="hint" degrades to manual on toggletips
(() => {
  const probe = document.createElement('div');
  probe.setAttribute('popover', 'hint');
  if ('popover' in probe && probe.popover !== 'hint') {
    document.addEventListener(
      'beforetoggle',
      ({ target, newState }) => {
        if (!(target instanceof HTMLElement) || !target.id) return;
        const toggletip =
          target.getAttribute('popover') === 'hint' &&
          document.querySelector(`[popovertarget="${CSS.escape(target.id)}"]`);
        if (newState === 'open' && toggletip) {
          target.setAttribute('popover', 'auto');
        }
      },
      true
    );
  }
})();

let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
}

async function closeTopLayer(dialog) {
  if (!dialog || !dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute('data-closing', '');
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    if (!dialog.hasAttribute('data-closing')) return;
    dialog.removeAttribute('data-closing');
  }
  dialog.close();
}

/* ==============================================================
   1. TOAST NOTIFICATION SYSTEM
   ============================================================== */

function createStatusIcon(type) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  if (type === 'success') {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const path = document.createElementNS(svgNS, 'polyline');
    path.setAttribute('points', '9 12 11 14 15 10');
    svg.append(circle, path);
  } else if (type === 'error') {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const l1 = document.createElementNS(svgNS, 'line');
    l1.setAttribute('x1', '12');
    l1.setAttribute('y1', '8');
    l1.setAttribute('x2', '12');
    l1.setAttribute('y2', '12');
    const l2 = document.createElementNS(svgNS, 'line');
    l2.setAttribute('x1', '12');
    l2.setAttribute('y1', '16');
    l2.setAttribute('x2', '12.01');
    l2.setAttribute('y2', '16');
    svg.append(circle, l1, l2);
  } else {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    const l1 = document.createElementNS(svgNS, 'line');
    l1.setAttribute('x1', '12');
    l1.setAttribute('y1', '16');
    l1.setAttribute('x2', '12');
    l1.setAttribute('y2', '12');
    const l2 = document.createElementNS(svgNS, 'line');
    l2.setAttribute('x1', '12');
    l2.setAttribute('y1', '8');
    l2.setAttribute('x2', '12.01');
    l2.setAttribute('y2', '8');
    svg.append(circle, l1, l2);
  }

  return svg;
}

function createCloseIcon() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const l1 = document.createElementNS(svgNS, 'line');
  l1.setAttribute('x1', '18');
  l1.setAttribute('y1', '6');
  l1.setAttribute('x2', '6');
  l1.setAttribute('y2', '18');
  const l2 = document.createElementNS(svgNS, 'line');
  l2.setAttribute('x1', '6');
  l2.setAttribute('y1', '6');
  l2.setAttribute('x2', '18');
  l2.setAttribute('y2', '18');
  svg.append(l1, l2);
  return svg;
}

function announceNotification(message) {
  if (typeof document.ariaNotify === 'function') {
    document.ariaNotify(message);
    return;
  }
  if (dom.toastAnnouncer) {
    dom.toastAnnouncer.textContent = '';
    requestAnimationFrame(() => {
      dom.toastAnnouncer.textContent = message;
    });
  }
}

function showToast(message, type = 'info', duration = 3500) {
  if (!dom.toastContainer) return;
  // Do not surface background toasts while a modal dialog makes outside DOM inert
  if (dom.aboutModal && dom.aboutModal.open) return;

  const returnFocusTarget =
    document.activeElement instanceof HTMLElement && !dom.toastContainer.contains(document.activeElement)
      ? document.activeElement
      : null;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconWrap = document.createElement('span');
  iconWrap.className = 'toast__icon';
  iconWrap.appendChild(createStatusIcon(type));

  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast__message';
  msgSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.appendChild(createCloseIcon());

  toast.append(iconWrap, msgSpan, closeBtn);
  dom.toastContainer.appendChild(toast);

  if (typeof dom.toastContainer.showPopover === 'function') {
    try {
      if (!dom.toastContainer.matches(':popover-open') && !dom.toastContainer.classList.contains(':popover-open')) {
        dom.toastContainer.showPopover();
      }
    } catch {
      /* ignore if polyfill not ready */
    }
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  announceNotification(message);

  let timerId = null;
  let paused = false;

  const dismiss = (manual = false) => {
    clearTimeout(timerId);
    const hadFocus = toast.contains(document.activeElement);
    const nextToast = toast.nextElementSibling || toast.previousElementSibling;

    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (dom.toastContainer.children.length === 0 && typeof dom.toastContainer.hidePopover === 'function') {
        try {
          dom.toastContainer.hidePopover();
        } catch {
          /* ignore */
        }
      }
      if (manual && hadFocus) {
        const nextBtn = nextToast?.querySelector('.toast__close');
        if (nextBtn instanceof HTMLElement) {
          nextBtn.focus();
        } else if (returnFocusTarget && returnFocusTarget.isConnected) {
          returnFocusTarget.focus();
        }
      }
    }, 220);
  };

  const startTimer = () => {
    clearTimeout(timerId);
    if (!paused) {
      timerId = setTimeout(() => dismiss(false), duration);
    }
  };

  toast.addEventListener('focusin', () => {
    paused = true;
    clearTimeout(timerId);
  });
  toast.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!toast.contains(document.activeElement)) {
        paused = false;
        startTimer();
      }
    });
  });
  toast.addEventListener('mouseenter', () => {
    paused = true;
    clearTimeout(timerId);
  });
  toast.addEventListener('mouseleave', () => {
    paused = false;
    startTimer();
  });

  closeBtn.addEventListener('click', () => dismiss(true));
  startTimer();
}

/* ==============================================================
   2. STATE MANAGER
   ============================================================== */

const StateManager = (() => {
  const GALLERY_KEY = 'qr-session-gallery-v2';
  const THEME_KEY = 'qr-theme-v2';
  const MAX_DESIGNS = 25;
  const ECL_LABELS = {
    L: 'Low (7%)',
    M: 'Medium (15%)',
    Q: 'Quartile (25%)',
    H: 'High (30%)',
  };

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

  /* ─── Theme Management (Two-State Toggle with System Default) ─── */
  function detectSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getRenderedTheme() {
    const content = dom.schemeMeta?.getAttribute('content');
    if (content === 'dark' || content === 'light') return content;
    return detectSystemTheme();
  }

  function syncThemeMetaColor() {
    if (!dom.metaThemeColor) return;
    const isDark = getRenderedTheme() === 'dark';
    dom.metaThemeColor.setAttribute('content', isDark ? '#121318' : '#3a5ba9');
  }

  function applyStoredScheme(storedScheme) {
    const content = storedScheme === 'light' || storedScheme === 'dark' ? storedScheme : 'light dark';
    if (dom.schemeMeta) {
      dom.schemeMeta.setAttribute('content', content);
    }
    syncThemeMetaColor();
  }

  function initTheme() {
    let savedTheme;
    try {
      savedTheme = localStorage.getItem(THEME_KEY);
    } catch {
      savedTheme = null;
    }
    applyStoredScheme(savedTheme);

    // Update browser chrome theme-color when OS preference changes (never remove stored override)
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        syncThemeMetaColor();
      });
    } catch {
      /* older browsers */
    }

    // Sync theme override across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === THEME_KEY) {
        applyStoredScheme(e.newValue);
      }
    });
  }

  function toggleTheme() {
    const current = getRenderedTheme();
    const target = current === 'dark' ? 'light' : 'dark';
    const system = detectSystemTheme();

    if (target !== system) {
      try {
        localStorage.setItem(THEME_KEY, target);
      } catch {
        /* storage disabled */
      }
      applyStoredScheme(target);
    } else {
      try {
        localStorage.removeItem(THEME_KEY);
      } catch {
        /* storage disabled */
      }
      applyStoredScheme(null);
    }

    showToast(`Switched to ${target === 'dark' ? 'Dark' : 'Light'} theme`);
  }

  /* ─── QR Options Builder ─── */
  function getErrorCorrectionLevel() {
    const val = getRadio('qr-ecl');
    return Object.hasOwn(ECL_LABELS, val) ? val : 'H';
  }

  function syncEclLabel(level) {
    if (dom.qrEclLabel) {
      dom.qrEclLabel.textContent = ECL_LABELS[level] || ECL_LABELS.H;
    }
  }

  function buildQrOptions() {
    return {
      width: 1024,
      height: 1024,
      type: 'canvas',
      data: dom.qrText.value.trim() || 'https://borish127.github.io/qrcode-generator/',
      margin: 14,
      qrOptions: {
        errorCorrectionLevel: getErrorCorrectionLevel(),
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
      errorCorrectionLevel: getErrorCorrectionLevel(),

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

  function sanitizeHexColor(val, fallback) {
    return typeof val === 'string' && /^#[0-9a-f]{6}$/i.test(val) ? val : fallback;
  }

  function sanitizeLogoUrl(val) {
    return typeof val === 'string' && val.startsWith('data:image/') ? val : null;
  }

  function applyState(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return;

    dom.qrText.value = typeof s.text === 'string' ? s.text : '';
    const ecl = Object.hasOwn(ECL_LABELS, s.errorCorrectionLevel) ? s.errorCorrectionLevel : 'H';
    setRadio('qr-ecl', ecl);
    syncEclLabel(ecl);

    // Background
    setRadio('bg-mode', s.bgMode || 'solid');
    dom.bgColor.value = sanitizeHexColor(s.bgColor, '#ffffff');
    dom.bgColorHex.textContent = dom.bgColor.value;
    dom.bgGradC1.value = sanitizeHexColor(s.bgGradC1, '#d8e2ff');
    dom.bgGradHex1.textContent = dom.bgGradC1.value;
    dom.bgGradC2.value = sanitizeHexColor(s.bgGradC2, '#ffffff');
    dom.bgGradHex2.textContent = dom.bgGradC2.value;
    dom.bgGradAngle.value = s.bgGradAngle || '135';
    dom.bgGradAngleV.textContent = `${dom.bgGradAngle.value}°`;
    UIRenderer.syncSlider(dom.bgGradAngle, '°');
    UIRenderer.syncBgUI(s.bgMode || 'solid');

    // Dots
    dom.dotShape.value = s.dotShape || 'rounded';
    setRadio('dot-color-mode', s.dotColorMode || 'solid');
    dom.dotColor.value = sanitizeHexColor(s.dotColor, '#001a41');
    dom.dotColorHex.textContent = dom.dotColor.value;
    dom.dotGradC1.value = sanitizeHexColor(s.dotGradC1, '#1f4490');
    dom.dotGradHex1.textContent = dom.dotGradC1.value;
    dom.dotGradC2.value = sanitizeHexColor(s.dotGradC2, '#3a5ba9');
    dom.dotGradHex2.textContent = dom.dotGradC2.value;
    dom.dotGradAngle.value = s.dotGradAngle || '135';
    dom.dotGradAngleV.textContent = `${dom.dotGradAngle.value}°`;
    UIRenderer.syncSlider(dom.dotGradAngle, '°');
    UIRenderer.syncColorModeUI('dot-color-mode', dom.dotSingleGrp, dom.dotGradCtrl);

    // Corner Squares
    dom.csqShape.value = s.csqShape || 'square';
    setRadio('csq-color-mode', s.csqColorMode || 'solid');
    dom.csqColor.value = sanitizeHexColor(s.csqColor, '#001a41');
    dom.csqColorHex.textContent = dom.csqColor.value;
    dom.csqGradC1.value = sanitizeHexColor(s.csqGradC1, '#001a41');
    dom.csqGradHex1.textContent = dom.csqGradC1.value;
    dom.csqGradC2.value = sanitizeHexColor(s.csqGradC2, '#3a5ba9');
    dom.csqGradHex2.textContent = dom.csqGradC2.value;
    dom.csqGradAngle.value = s.csqGradAngle || '135';
    dom.csqGradAngleV.textContent = `${dom.csqGradAngle.value}°`;
    UIRenderer.syncSlider(dom.csqGradAngle, '°');
    UIRenderer.syncColorModeUI('csq-color-mode', dom.csqSingleGrp, dom.csqGradCtrl);

    // Corner Dots
    dom.cdShape.value = s.cdShape || 'dot';
    setRadio('cd-color-mode', s.cdColorMode || 'solid');
    dom.cdColor.value = sanitizeHexColor(s.cdColor, '#001a41');
    dom.cdColorHex.textContent = dom.cdColor.value;
    dom.cdGradC1.value = sanitizeHexColor(s.cdGradC1, '#001a41');
    dom.cdGradHex1.textContent = dom.cdGradC1.value;
    dom.cdGradC2.value = sanitizeHexColor(s.cdGradC2, '#3a5ba9');
    dom.cdGradHex2.textContent = dom.cdGradC2.value;
    dom.cdGradAngle.value = s.cdGradAngle || '135';
    dom.cdGradAngleV.textContent = `${dom.cdGradAngle.value}°`;
    UIRenderer.syncSlider(dom.cdGradAngle, '°');
    UIRenderer.syncColorModeUI('cd-color-mode', dom.cdSingleGrp, dom.cdGradCtrl);

    // Logo
    logoDataUrl = sanitizeLogoUrl(s.logoDataUrl);
    dom.logoSize.value = s.logoSize || '30';
    dom.logoSizeVal.textContent = `${dom.logoSize.value}%`;
    UIRenderer.syncSlider(dom.logoSize, '%');
    dom.logoMargin.value = s.logoMargin || '5';
    dom.logoMarginVal.textContent = `${dom.logoMargin.value}px`;
    UIRenderer.syncSlider(dom.logoMargin, 'px');
    dom.logoBehind.checked = s.logoBehind !== undefined ? Boolean(s.logoBehind) : true;

    if (logoDataUrl) {
      dom.logoPrevImg.src = logoDataUrl;
      dom.logoFilename.textContent = 'Custom Logo';
    } else {
      dom.logoPrevImg.src = '';
      dom.logoFilename.textContent = '';
    }
    UIRenderer.syncLogoUI(Boolean(logoDataUrl));

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
    const restoreFocus = dom.logoPrevCont.contains(document.activeElement);
    logoDataUrl = null;
    dom.logoInput.value = '';
    dom.logoPrevImg.src = '';
    dom.logoFilename.textContent = '';
    UIRenderer.syncLogoUI(false);
    if (restoreFocus && dom.logoUpload) {
      dom.logoUpload.focus();
    }
    EventHandlers.scheduleUpdate();
    showToast('Center logo removed');
  }

  /* ─── Gallery Persistence ─── */
  function loadGallery() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GALLERY_KEY));
      return Array.isArray(parsed) ? parsed : [];
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
    initTheme,
    toggleTheme,
    buildQrOptions,
    gatherState,
    applyState,
    setLogo,
    clearLogo,
    loadGallery,
    addDesign,
    removeDesign,
    getDesignState,
    getExportScale,
    getErrorCorrectionLevel,
    syncEclLabel,
    getRadio,
    setRadio,
    MAX_DESIGNS,
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

  function syncSlider(input, unit = '') {
    if (!input) return;
    input.style.setProperty('--attr-min', input.min || '0');
    input.style.setProperty('--attr-max', input.max || '100');
    input.style.setProperty('--control-value', input.value);
    input.setAttribute('aria-valuetext', `${input.value}${unit}`);
  }

  function renderGallery(focusIndex = null) {
    const gallery = StateManager.loadGallery();

    if (gallery.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';
      empty.textContent = 'No saved designs yet';
      dom.galleryEl.replaceChildren(empty);
      dom.galleryNote.textContent = `0 / ${StateManager.MAX_DESIGNS} saved`;
      if (focusIndex !== null && dom.saveDesignBtn) {
        dom.saveDesignBtn.focus();
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    const restoreButtons = [];

    gallery.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';

      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'gallery-card__restore';
      restoreBtn.setAttribute('aria-label', `Restore saved design ${i + 1}`);
      restoreBtn.addEventListener('click', () => {
        const state = StateManager.getDesignState(i);
        if (state) {
          StateManager.applyState(state);
          showToast(`Restored design ${i + 1}`, 'success');
        }
      });

      const img = document.createElement('img');
      img.src = typeof item.thumbnail === 'string' && item.thumbnail.startsWith('data:image/') ? item.thumbnail : '';
      img.alt = '';
      restoreBtn.appendChild(img);
      card.appendChild(restoreBtn);
      restoreButtons.push(restoreBtn);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'gallery-card__delete';
      delBtn.textContent = '×';
      delBtn.setAttribute('aria-label', `Delete saved design ${i + 1}`);

      delBtn.addEventListener('click', () => {
        const wasFocused = document.activeElement === delBtn;
        StateManager.removeDesign(i);
        renderGallery(wasFocused ? i : null);
        showToast('Design deleted');
      });
      card.appendChild(delBtn);

      fragment.appendChild(card);
    });

    dom.galleryEl.replaceChildren(fragment);
    dom.galleryNote.textContent = `${gallery.length} / ${StateManager.MAX_DESIGNS} saved`;

    if (focusIndex !== null && restoreButtons.length > 0) {
      const target = restoreButtons[Math.min(focusIndex, restoreButtons.length - 1)];
      target?.focus();
    }
  }

  return { syncBgUI, syncColorModeUI, syncLogoUI, syncSlider, renderGallery };
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
    UIRenderer.syncSlider(input, unit);
    input.addEventListener('input', () => {
      valSpan.textContent = `${input.value}${unit}`;
      UIRenderer.syncSlider(input, unit);
      scheduleUpdate();
    });
  }

  function wireColorModeToggle(radioName, solidGroup, gradCtrl) {
    $$(`input[name="${radioName}"]`).forEach((r) => {
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
    if (typeof QRCodeStyling !== 'function') {
      showToast('QR rendering library failed to load', 'error');
      return;
    }
    const scale = StateManager.getExportScale();
    const base = 512;
    const size = base * scale;
    const opts = StateManager.buildQrOptions();
    opts.width = size;
    opts.height = size;
    if (ext === 'svg') opts.type = 'svg';

    try {
      const exportInstance = new QRCodeStyling(opts);
      exportInstance
        .download({ name: 'qrcode', extension: ext })
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
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        if (!state || typeof state !== 'object' || Array.isArray(state)) {
          throw new Error('Invalid preset shape');
        }
        StateManager.applyState(state);
        showToast('Configuration imported successfully', 'success');
      } catch {
        showToast('Invalid JSON preset file', 'error');
      }
    };
    reader.readAsText(file);
    dom.importJsonInp.value = '';
  }

  /* ─── Native <dialog> Handling (Fallbacks & Smooth Top-Layer Exit) ─── */
  function wireAboutDialog() {
    const dialog = dom.aboutModal;
    if (!dialog) return;

    // Fallback when invokers-polyfill could not be loaded (e.g. offline)
    if (!('commandForElement' in HTMLButtonElement.prototype) && dom.btnAbout) {
      dom.btnAbout.addEventListener('click', () => {
        if (window.__invokerPolyfillFailed && !dialog.open) {
          dialog.showModal();
        }
      });
    }

    // Light-dismiss fallback for browsers without native closedby="any"
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e)) {
          closeTopLayer(dialog);
        }
      });
    }

    // Route close requests & form method="dialog" through closeTopLayer when exit animation needs JS help
    dialog.addEventListener('cancel', (event) => {
      if (!supportsTopLayerExit()) {
        event.preventDefault();
        closeTopLayer(dialog);
      }
    });

    dialog.addEventListener('submit', (event) => {
      if (event.target instanceof HTMLFormElement && event.target.method === 'dialog' && !supportsTopLayerExit()) {
        event.preventDefault();
        closeTopLayer(dialog);
      }
    });
  }

  /* ─── Wire Events ─── */
  function wireAll() {
    // Theme toggle
    dom.btnTheme.addEventListener('click', StateManager.toggleTheme);

    // About Modal
    wireAboutDialog();

    // QR Payload text & Quality (Error Correction Level)
    dom.qrText.addEventListener('input', scheduleUpdate);
    $$('input[name="qr-ecl"]').forEach((r) => {
      r.addEventListener('change', () => {
        StateManager.syncEclLabel(StateManager.getErrorCorrectionLevel());
        scheduleUpdate();
      });
    });

    // Background mode
    $$('input[name="bg-mode"]').forEach((r) => {
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
    ['dragenter', 'dragover'].forEach((eventName) => {
      dom.logoUpload.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.logoUpload.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
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
    $$('input[name="export-res"]').forEach((r) => {
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

    if (typeof QRCodeStyling === 'function') {
      qrCode = new QRCodeStyling(StateManager.buildQrOptions());
      qrCode.append(dom.qrPreview);
    } else {
      showToast('QR rendering library unavailable offline', 'error');
    }

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

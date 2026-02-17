/**
 * QR Code Generator — Advanced Version
 * =====================================
 * Modular architecture: StateManager → UIRenderer → EventHandlers
 *
 * Uses qr-code-styling (MIT) for QR generation.
 * 100 % client-side, no backend.
 */

/* ==============================================================
   0. DOM References
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

    // Corner Squares
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

    // Corner Dots
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
    removeLogBtn: $('#remove-logo-btn'),
    logoOptions: $('#logo-options'),
    logoSize: $('#logo-size'),
    logoSizeVal: $('#logo-size-val'),
    logoMarginGrp: $('#logo-margin-group'),
    logoMargin: $('#logo-margin'),
    logoMarginVal: $('#logo-margin-val'),
    logoModeToggle: $('#logo-mode-toggle'),
    logoBehind: $('#logo-behind'),
    logoModeLabel: $('#logo-mode-label'),

    // Preview
    qrPreview: $('#qr-preview'),

    // Export
    downloadPng: $('#download-png'),
    downloadJpeg: $('#download-jpeg'),
    downloadSvg: $('#download-svg'),
    resToggleBtn: $('#resolution-toggle-btn'),
    resPicker: $('#resolution-picker'),

    // Templates / Gallery
    saveDesignBtn: $('#save-design-btn'),
    galleryEl: $('#session-gallery'),
    galleryNote: $('#gallery-limit-note'),
    exportJsonBtn: $('#export-json-btn'),
    importJsonBtn: $('#import-json-btn'),
    importJsonInp: $('#import-json-input'),

    // Theme
    themeSwitch: $('#theme-switch'),

    // Toast
    toast: $('#toast'),
};

/* ==============================================================
   1. STATE MANAGER
   Handles: theme, QR options, serialisation, gallery storage
   ============================================================== */

const StateManager = (() => {
    const GALLERY_KEY = 'qr-session-gallery';
    const THEME_KEY = 'qr-theme';
    const MAX_DESIGNS = 25;

    let logoDataUrl = null;

    /* ─── Helpers ─── */

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

    /* ─── Theme ─── */

    function detectSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function initTheme() {
        let theme;
        try {
            const saved = localStorage.getItem(THEME_KEY);
            theme = saved || detectSystemTheme();
        } catch {
            theme = detectSystemTheme();
        }
        applyTheme(theme === 'dark');

        // Listen for OS-level changes (only when no manual override)
        try {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                const saved = localStorage.getItem(THEME_KEY);
                if (!saved) {
                    applyTheme(e.matches);
                }
            });
        } catch { /* old browser */ }
    }

    function applyTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        dom.themeSwitch.checked = dark;
        // Sync mobile status-bar color
        const metaTC = document.getElementById('meta-theme-color');
        if (metaTC) metaTC.setAttribute('content', dark ? '#0f1513' : '#e8f0ee');
        try {
            localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
        } catch { /* ignore */ }
    }

    /* ─── QR Options Builders ─── */

    function buildQrOptions() {
        return {
            width: 1024,
            height: 1024,
            type: 'canvas',
            data: dom.qrText.value || 'https://example.com',
            margin: 12,
            qrOptions: { errorCorrectionLevel: 'H' },
            dotsOptions: buildPartOptions('dot'),
            cornersSquareOptions: buildPartOptions('csq'),
            cornersDotOptions: buildPartOptions('cd'),
            backgroundOptions: buildBgOptions(),
            image: logoDataUrl || undefined,
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: parseInt(dom.logoMargin.value, 10),
                imageSize: parseFloat(dom.logoSize.value) / 100,
                hideBackgroundDots: !dom.logoBehind.checked,
            },
        };
    }

    function buildBgOptions() {
        const mode = getRadio('bg-mode');
        if (mode === 'transparent') return { color: 'transparent', gradient: undefined };
        if (mode === 'gradient') {
            return {
                color: undefined,
                gradient: {
                    type: 'linear',
                    rotation: degToRad(parseInt(dom.bgGradAngle.value, 10)),
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
        const shapeSel = { dot: dom.dotShape, csq: dom.csqShape, cd: dom.cdShape }[prefix];
        const radioName = { dot: 'dot-color-mode', csq: 'csq-color-mode', cd: 'cd-color-mode' }[prefix];
        const colorMode = getRadio(radioName);
        const opts = { type: shapeSel.value };

        if (colorMode === 'gradient') {
            const c1 = { dot: dom.dotGradC1, csq: dom.csqGradC1, cd: dom.cdGradC1 }[prefix];
            const c2 = { dot: dom.dotGradC2, csq: dom.csqGradC2, cd: dom.cdGradC2 }[prefix];
            const angle = { dot: dom.dotGradAngle, csq: dom.csqGradAngle, cd: dom.cdGradAngle }[prefix];

            opts.color = undefined;
            opts.gradient = {
                type: 'linear',
                rotation: degToRad(parseInt(angle.value, 10)),
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

    /* ─── State Gather / Apply ─── */

    function gatherState() {
        return {
            version: 2,
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
        if (!s || (s.version !== 1 && s.version !== 2)) {
            UIRenderer.showToast('Invalid or unsupported template format');
            return;
        }

        dom.qrText.value = s.text || '';

        // Background
        setRadio('bg-mode', s.bgMode || 'solid');
        dom.bgColor.value = s.bgColor || '#ffffff';
        dom.bgColorHex.textContent = dom.bgColor.value;
        dom.bgGradC1.value = s.bgGradC1 || '#80cbc4';
        dom.bgGradHex1.textContent = dom.bgGradC1.value;
        dom.bgGradC2.value = s.bgGradC2 || '#81d4fa';
        dom.bgGradHex2.textContent = dom.bgGradC2.value;
        dom.bgGradAngle.value = s.bgGradAngle || '135';
        dom.bgGradAngleV.textContent = dom.bgGradAngle.value;
        UIRenderer.syncBgUI(s.bgMode || 'solid');

        // Dots
        dom.dotShape.value = s.dotShape || 'rounded';
        setRadio('dot-color-mode', s.dotColorMode || 'solid');
        dom.dotColor.value = s.dotColor || '#000000';
        dom.dotColorHex.textContent = dom.dotColor.value;
        dom.dotGradC1.value = s.dotGradC1 || '#004d47';
        dom.dotGradHex1.textContent = dom.dotGradC1.value;
        dom.dotGradC2.value = s.dotGradC2 || '#0277bd';
        dom.dotGradHex2.textContent = dom.dotGradC2.value;
        dom.dotGradAngle.value = s.dotGradAngle || '135';
        dom.dotGradAngleV.textContent = dom.dotGradAngle.value;
        UIRenderer.syncColorModeUI('dot-color-mode', dom.dotSingleGrp, dom.dotGradCtrl);

        // Corner Squares
        dom.csqShape.value = s.csqShape || 'square';
        setRadio('csq-color-mode', s.csqColorMode || 'solid');
        dom.csqColor.value = s.csqColor || '#000000';
        dom.csqColorHex.textContent = dom.csqColor.value;
        dom.csqGradC1.value = s.csqGradC1 || '#004d47';
        dom.csqGradHex1.textContent = dom.csqGradC1.value;
        dom.csqGradC2.value = s.csqGradC2 || '#0277bd';
        dom.csqGradHex2.textContent = dom.csqGradC2.value;
        dom.csqGradAngle.value = s.csqGradAngle || '135';
        dom.csqGradAngleV.textContent = dom.csqGradAngle.value;
        UIRenderer.syncColorModeUI('csq-color-mode', dom.csqSingleGrp, dom.csqGradCtrl);

        // Corner Dots
        dom.cdShape.value = s.cdShape || 'dot';
        setRadio('cd-color-mode', s.cdColorMode || 'solid');
        dom.cdColor.value = s.cdColor || '#000000';
        dom.cdColorHex.textContent = dom.cdColor.value;
        dom.cdGradC1.value = s.cdGradC1 || '#004d47';
        dom.cdGradHex1.textContent = dom.cdGradC1.value;
        dom.cdGradC2.value = s.cdGradC2 || '#0277bd';
        dom.cdGradHex2.textContent = dom.cdGradC2.value;
        dom.cdGradAngle.value = s.cdGradAngle || '135';
        dom.cdGradAngleV.textContent = dom.cdGradAngle.value;
        UIRenderer.syncColorModeUI('cd-color-mode', dom.cdSingleGrp, dom.cdGradCtrl);

        // Logo
        logoDataUrl = s.logoDataUrl || null;
        dom.logoSize.value = s.logoSize || '30';
        dom.logoSizeVal.textContent = dom.logoSize.value;
        dom.logoMargin.value = s.logoMargin || '5';
        dom.logoMarginVal.textContent = dom.logoMargin.value;
        dom.logoBehind.checked = !!s.logoBehind;
        dom.logoModeLabel.textContent = s.logoBehind
            ? 'Placement: Behind (transparent dots)'
            : 'Placement: Front (overlay)';
        UIRenderer.syncLogoUI(!!logoDataUrl);

        EventHandlers.scheduleUpdate();
    }

    /* ─── Logo ─── */

    function setLogo(dataUrl, filename) {
        logoDataUrl = dataUrl;
        dom.logoPrevImg.src = dataUrl;
        dom.logoFilename.textContent = filename;
        UIRenderer.syncLogoUI(true);
        EventHandlers.scheduleUpdate();
    }

    function clearLogo() {
        logoDataUrl = null;
        dom.logoInput.value = '';
        UIRenderer.syncLogoUI(false);
        EventHandlers.scheduleUpdate();
    }

    function getLogo() { return logoDataUrl; }

    /* ─── Gallery (Session Storage) ─── */

    function loadGallery() {
        try {
            return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
        } catch { return []; }
    }

    function saveGallery(gallery) {
        try {
            localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
        } catch {
            UIRenderer.showToast('Storage full — remove some designs');
        }
    }

    function addDesign(thumbnail) {
        const gallery = loadGallery();
        if (gallery.length >= MAX_DESIGNS) {
            UIRenderer.showToast(`Limit reached (${MAX_DESIGNS}). Delete a design first.`);
            return false;
        }
        gallery.push({ state: gatherState(), thumbnail, ts: Date.now() });
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

    /* ─── Export Resolution ─── */

    function getExportScale() {
        return parseInt(getRadio('export-res') || '4', 10);
    }

    return {
        initTheme, applyTheme, detectSystemTheme,
        buildQrOptions, gatherState, applyState,
        setLogo, clearLogo, getLogo,
        loadGallery, addDesign, removeDesign, getDesignState,
        getExportScale, getRadio, setRadio,
        MAX_DESIGNS,
    };
})();


/* ==============================================================
   2. UI RENDERER
   Handles: UI sync, gallery rendering, toasts
   ============================================================== */

const UIRenderer = (() => {

    /* ─── Toast ─── */

    let toastTimer = null;

    function showToast(msg) {
        clearTimeout(toastTimer);
        dom.toast.textContent = msg;
        dom.toast.classList.add('show');
        toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2600);
    }

    /* ─── UI Sync ─── */

    function syncBgUI(mode) {
        dom.bgSolidGroup.classList.toggle('hidden', mode !== 'solid');
        dom.bgGradCtrl.classList.toggle('visible', mode === 'gradient');
    }

    function syncColorModeUI(radioName, solidGroup, gradCtrl) {
        const mode = StateManager.getRadio(radioName);
        solidGroup.classList.toggle('hidden', mode !== 'solid');
        gradCtrl.classList.toggle('visible', mode === 'gradient');
    }

    function syncLogoUI(hasLogo) {
        dom.logoPrevCont.classList.toggle('hidden', !hasLogo);
        dom.logoUpload.classList.toggle('hidden', hasLogo);
        dom.logoOptions.classList.toggle('hidden', !hasLogo);
        dom.logoMarginGrp.classList.toggle('hidden', !hasLogo);
        dom.logoModeToggle.classList.toggle('hidden', !hasLogo);
    }

    /* ─── Gallery Rendering ─── */

    function renderGallery() {
        const gallery = StateManager.loadGallery();
        dom.galleryEl.innerHTML = '';

        if (gallery.length === 0) {
            dom.galleryEl.innerHTML = '<div class="gallery-empty">No saved designs yet</div>';
            dom.galleryNote.textContent = '';
            return;
        }

        gallery.forEach((item, i) => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.title = `Design ${i + 1} — click to restore`;

            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = `Design ${i + 1}`;
            card.appendChild(img);

            const del = document.createElement('button');
            del.className = 'gallery-delete';
            del.textContent = '✕';
            del.title = 'Delete';
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
                    showToast(`Design ${i + 1} restored`);
                }
            });

            dom.galleryEl.appendChild(card);
        });

        dom.galleryNote.textContent = `${gallery.length} / ${StateManager.MAX_DESIGNS} saved`;
    }

    return { showToast, syncBgUI, syncColorModeUI, syncLogoUI, renderGallery };
})();


/* ==============================================================
   3. EVENT HANDLERS
   Handles: wiring DOM events, updates, downloads, imports
   ============================================================== */

const EventHandlers = (() => {

    let updateTimer = null;
    let qrCode = null;

    function scheduleUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            qrCode.update(StateManager.buildQrOptions());
        }, 120);
    }

    /* ─── Helpers ─── */

    function wireColor(input, hexSpan) {
        input.addEventListener('input', () => {
            hexSpan.textContent = input.value;
            scheduleUpdate();
        });
    }

    function wireRange(input, valSpan) {
        input.addEventListener('input', () => {
            valSpan.textContent = input.value;
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

    /* ─── Logo ─── */

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            StateManager.setLogo(ev.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }

    /* ─── Download ─── */

    function downloadQr(ext) {
        const scale = StateManager.getExportScale();
        const base = 512;
        const size = base * scale;
        const opts = StateManager.buildQrOptions();
        opts.width = size;
        opts.height = size;
        if (ext === 'svg') opts.type = 'svg';

        const exportQr = new QRCodeStyling(opts);
        exportQr.download({ name: 'qrcode', extension: ext })
            .then(() => UIRenderer.showToast(`Downloaded ${ext.toUpperCase()} (${scale}x — ${size}px)`))
            .catch(() => UIRenderer.showToast('Download failed — try again'));
    }

    /* ─── Gallery Save ─── */

    function saveDesign() {
        // Generate thumbnail from current QR canvas
        const canvas = dom.qrPreview.querySelector('canvas');
        if (!canvas) {
            UIRenderer.showToast('QR not ready yet — wait a moment');
            return;
        }
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 120;
        thumbCanvas.height = 120;
        const ctx = thumbCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 120, 120);
        const thumbnail = thumbCanvas.toDataURL('image/png', 0.7);

        if (StateManager.addDesign(thumbnail)) {
            UIRenderer.renderGallery();
            UIRenderer.showToast('Design saved to gallery');
        }
    }

    /* ─── JSON Export / Import ─── */

    function exportJson() {
        const json = JSON.stringify(StateManager.gatherState(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qr-design.json';
        a.click();
        URL.revokeObjectURL(url);
        UIRenderer.showToast('Design exported as JSON');
    }

    function importJson(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const state = JSON.parse(ev.target.result);
                StateManager.applyState(state);
                UIRenderer.showToast('Design imported successfully');
            } catch {
                UIRenderer.showToast('Invalid JSON file');
            }
        };
        reader.readAsText(file);
        dom.importJsonInp.value = '';
    }

    /* ─── Wire Everything ─── */

    function wireAll() {
        // Theme
        dom.themeSwitch.addEventListener('change', () => {
            StateManager.applyTheme(dom.themeSwitch.checked);
        });

        // Text
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
        wireRange(dom.bgGradAngle, dom.bgGradAngleV);

        // Dots
        dom.dotShape.addEventListener('change', scheduleUpdate);
        wireColorModeToggle('dot-color-mode', dom.dotSingleGrp, dom.dotGradCtrl);
        wireColor(dom.dotColor, dom.dotColorHex);
        wireColor(dom.dotGradC1, dom.dotGradHex1);
        wireColor(dom.dotGradC2, dom.dotGradHex2);
        wireRange(dom.dotGradAngle, dom.dotGradAngleV);

        // Corner Squares
        dom.csqShape.addEventListener('change', scheduleUpdate);
        wireColorModeToggle('csq-color-mode', dom.csqSingleGrp, dom.csqGradCtrl);
        wireColor(dom.csqColor, dom.csqColorHex);
        wireColor(dom.csqGradC1, dom.csqGradHex1);
        wireColor(dom.csqGradC2, dom.csqGradHex2);
        wireRange(dom.csqGradAngle, dom.csqGradAngleV);

        // Corner Dots
        dom.cdShape.addEventListener('change', scheduleUpdate);
        wireColorModeToggle('cd-color-mode', dom.cdSingleGrp, dom.cdGradCtrl);
        wireColor(dom.cdColor, dom.cdColorHex);
        wireColor(dom.cdGradC1, dom.cdGradHex1);
        wireColor(dom.cdGradC2, dom.cdGradHex2);
        wireRange(dom.cdGradAngle, dom.cdGradAngleV);

        // Logo
        dom.logoInput.addEventListener('change', handleLogoUpload);
        dom.removeLogBtn.addEventListener('click', () => StateManager.clearLogo());
        wireRange(dom.logoSize, dom.logoSizeVal);
        wireRange(dom.logoMargin, dom.logoMarginVal);
        dom.logoBehind.addEventListener('change', () => {
            dom.logoModeLabel.textContent = dom.logoBehind.checked
                ? 'Placement: Behind (transparent dots)'
                : 'Placement: Front (overlay)';
            scheduleUpdate();
        });

        // Export
        dom.downloadPng.addEventListener('click', () => downloadQr('png'));
        dom.downloadJpeg.addEventListener('click', () => downloadQr('jpeg'));
        dom.downloadSvg.addEventListener('click', () => downloadQr('svg'));

        // Resolution toggle
        dom.resToggleBtn.addEventListener('click', () => {
            dom.resPicker.classList.toggle('visible');
        });

        // Gallery
        dom.saveDesignBtn.addEventListener('click', saveDesign);

        // JSON
        dom.exportJsonBtn.addEventListener('click', exportJson);
        dom.importJsonBtn.addEventListener('click', () => dom.importJsonInp.click());
        dom.importJsonInp.addEventListener('change', importJson);
    }

    /* ─── Init ─── */

    function init() {
        // Theme
        StateManager.initTheme();

        // QR Code instance
        qrCode = new QRCodeStyling(StateManager.buildQrOptions());
        qrCode.append(dom.qrPreview);

        // Wire events
        wireAll();

        // Render gallery
        UIRenderer.renderGallery();
    }

    return { init, scheduleUpdate };
})();


/* ==============================================================
   4. BOOTSTRAP
   ============================================================== */

EventHandlers.init();

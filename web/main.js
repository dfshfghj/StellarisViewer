import './style.css';
import loadLocalization from 'virtual:stellaris-localization';
import { getLanguage, setLanguage, t, translateDocument } from './app-i18n.js';
import { setGameLocalization } from './game-localization.js';
import { GalaxyMap } from './galaxy-map.js';
import { SystemView } from './system-view.js';
import { renderFleetWindow } from './fleet-window-generated.js';
import { renderShipWindow } from './ship-window-generated.js';
import { renderPlanetWindow } from './planet-window-generated.js';
import { renderOverviewPanel } from './overview-panel-generated.js';
import { renderMainGui } from './main-gui-generated.js';
import { renderStatusBar } from './ui-components.js';
import { showDialog } from './ui-dialogs.js';

import init, {
    parse_save,
    get_galaxy_data,
    get_system_view,
    get_fleet_detail,
    get_ship_detail,
    get_planet_detail,
    get_player_info,
    set_localization,
} from './pkg/stellaris_parser.js';
import wasmUrl from './pkg/stellaris_parser_bg.wasm?url';

// ============ App State ============
const state = {
    view: 'loading', // loading | galaxy | system
    selectedSystem: null,
    galaxyData: null,
    playerInfo: null,
    localizationLoaded: false,
    saveLoaded: false,
};

// ============ DOM References ============
const els = {
    loadingScreen: document.getElementById('loading-screen'),
    fileInput: document.getElementById('file-input'),
    loadingProgress: document.getElementById('loading-progress'),
    loadingText: document.getElementById('loading-text'),
    app: document.getElementById('app'),
    canvas: document.getElementById('main-canvas'),
    resourceBar: document.getElementById('resource-bar'),
    overviewPanel: document.getElementById('overview-panel'),
    statusBar: document.getElementById('status-bar'),
    statusDate: document.getElementById('status-date'),
    statusEmpire: document.getElementById('status-empire'),
    fleetWindow: document.getElementById('fleet-window'),
    shipWindow: document.getElementById('ship-window'),
    planetWindow: document.getElementById('planet-window'),
    btnBack: document.getElementById('btn-back'),
    modalLayer: document.getElementById('modal-layer'),
    languageToggle: document.getElementById('language-toggle'),
};

// ============ Renderers ============
let galaxyMap = null;
let systemView = null;

// ============ Initialization ============
async function main() {
    setLanguage('en');
    translateDocument();
    await init({ module_or_path: wasmUrl });
    console.log('[Stellaris Viewer] WASM initialized successfully');
    setupEventListeners();
}

function setupEventListeners() {
    els.fileInput.addEventListener('change', handleFileSelect);
    els.btnBack.addEventListener('click', handleBack);
    els.languageToggle.addEventListener('click', handleLanguageToggle);
    enablePopupDragging(els.fleetWindow);
    enablePopupDragging(els.shipWindow);
    enablePopupDragging(els.planetWindow);

    // Keyboard shortcuts (M = galaxy map, Escape = close popups)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            console.log('[key] M pressed, view=', state.view);
            if (state.view === 'system') switchToGalaxy();
        }
        if (e.key === 'Escape') {
            closePopups();
            els.planetWindow.classList.add('hidden');
        }
    });

    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const action = icon.dataset.action;
            if (action === 'galaxy') switchToGalaxy();
            if (action === 'overview') toggleOverview();
            if (!['galaxy', 'overview'].includes(action)) {
                showDialog(els.modalLayer, {
                    title: icon.title,
                    description: t('dialog.unavailable'),
                });
            }
        });
    });

    window.addEventListener('resize', handleResize);
}

async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    els.loadingProgress.classList.remove('hidden');
    els.languageToggle.disabled = true;
    els.loadingText.textContent = t('loading.localization', {
        language: t(getLanguage() === 'zh' ? 'language.chinese' : 'language.english'),
    });
    document.querySelector('.progress-fill').style.width = '20%';

    try {
        const localization = await loadLocalization(getLanguage());
        setGameLocalization(localization);
        set_localization(localization);
        state.localizationLoaded = true;
        els.loadingText.textContent = t('loading.reading', { file: file.name });
        const text = await file.text();
        document.querySelector('.progress-fill').style.width = '50%';
        els.loadingText.textContent = t('loading.parsingSave');

        // Small delay to let UI update
        await new Promise(r => setTimeout(r, 50));
        const parseTime = parse_save(text);
        state.saveLoaded = true;
        document.querySelector('.progress-fill').style.width = '80%';
        els.loadingText.textContent = t('loading.complete', { time: parseTime.toFixed(0) });

        state.playerInfo = get_player_info();
        state.galaxyData = get_galaxy_data();

        document.querySelector('.progress-fill').style.width = '100%';
        await new Promise(r => setTimeout(r, 100));

        startApp();
    } catch (err) {
        console.error('[Stellaris Viewer] Parse failed:', err);
        els.loadingText.textContent = t('loading.error', { error: err });
        document.querySelector('.progress-fill').style.width = '0%';
    } finally {
        els.languageToggle.disabled = false;
    }
}

async function handleLanguageToggle() {
    const language = getLanguage() === 'en' ? 'zh' : 'en';
    setLanguage(language);
    translateDocument();
    if (!state.localizationLoaded) return;

    els.languageToggle.disabled = true;
    try {
        const localization = await loadLocalization(language);
        setGameLocalization(localization);
        set_localization(localization);
        if (state.saveLoaded) refreshLocalizedView();
    } catch (error) {
        console.error('[Stellaris Viewer] Language switch failed:', error);
        setLanguage(language === 'en' ? 'zh' : 'en');
        translateDocument();
    } finally {
        els.languageToggle.disabled = false;
    }
}

function refreshLocalizedView() {
    state.playerInfo = get_player_info();
    state.galaxyData = get_galaxy_data();
    renderMainGui(els.resourceBar, state.playerInfo);
    renderStatusBar(els.statusDate, els.statusEmpire, state.playerInfo);
    renderOverviewPanel(els.overviewPanel, state.playerInfo, {
        onFleetClick: openFleetWindow,
        onPlanetClick: openPlanetWindow,
        onClose: () => {
            els.overviewPanel.classList.add('hidden');
            updateSidebar(state.view);
        },
    });
    closePopups();
    els.planetWindow.classList.add('hidden');
    galaxyMap?.setData(state.galaxyData);
    if (state.view === 'system' && state.selectedSystem != null) {
        systemView?.setData(get_system_view(state.selectedSystem));
    }
}

function startApp() {
    els.loadingScreen.classList.add('hidden');
    els.app.classList.remove('hidden');

    renderMainGui(els.resourceBar, state.playerInfo);
    renderStatusBar(els.statusDate, els.statusEmpire, state.playerInfo);
    renderOverviewPanel(els.overviewPanel, state.playerInfo, {
        onFleetClick: openFleetWindow,
        onPlanetClick: openPlanetWindow,
        onClose: () => {
            els.overviewPanel.classList.add('hidden');
            updateSidebar(state.view);
        },
    });
    els.overviewPanel.classList.remove('hidden');

    switchToGalaxy();
}

// ============ View Switching ============
function switchToGalaxy() {
    state.view = 'galaxy';
    state.selectedSystem = null;
    els.planetWindow.classList.add('hidden');
    closePopups();

    if (!galaxyMap) {
        galaxyMap = new GalaxyMap(els.canvas, state.galaxyData, {
            onSystemClick: (id) => enterSystem(id),
            onFleetClick: (id) => openFleetWindow(id),
        });
    }
    if (systemView) systemView.hide();
    galaxyMap.show();
    updateSidebar('galaxy');
}

function enterSystem(systemId) {
    state.view = 'system';
    state.selectedSystem = systemId;
    closePopups();

    const data = get_system_view(systemId);
    console.log('[enterSystem] data:', JSON.stringify({
        name: data.name, planets: data.planets.length,
        orbits: data.planets.map(p => p.orbit),
        fleets: data.fleets.length
    }));
    if (!systemView) {
        systemView = new SystemView(els.canvas, {
            onPlanetClick: (id) => openPlanetWindow(id),
            onFleetClick: (id) => openFleetWindow(id),
            onBack: () => switchToGalaxy(),
        });
    }
    systemView.setData(data);
    galaxyMap.hide();
    systemView.show();
    console.log('[enterSystem] canvas:', els.canvas.width, 'x', els.canvas.height, 'display:', els.canvas.style.display);
    updateSidebar('system');
}

function handleBack() {
    if (state.view === 'system') switchToGalaxy();
}

function updateSidebar(active) {
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.classList.toggle('active', icon.dataset.action === active);
    });
}

// ============ Popups ============
function openFleetWindow(fleetId) {
    const data = get_fleet_detail(fleetId);
    renderFleetWindow(els.fleetWindow, data, {
        onShipClick: (shipId) => openShipWindow(shipId),
        onClose: () => els.fleetWindow.classList.add('hidden'),
        onManage: () => showDialog(els.modalLayer, {
            title: t('nav.fleets'),
            description: t('dialog.readOnlyFleet'),
        }),
        onDisband: () => showDialog(els.modalLayer, {
            title: t('dialog.disbandFleet'),
            description: t('dialog.disbandFleetDescription', { name: data.name }),
            confirmText: t('dialog.confirm'),
            cancelText: t('dialog.cancel'),
            tone: 'danger',
        }),
    });
    els.fleetWindow.classList.remove('hidden');
    positionPopup(els.fleetWindow);
}

function openShipWindow(shipId) {
    const data = get_ship_detail(shipId);
    renderShipWindow(els.shipWindow, data, {
        onClose: () => els.shipWindow.classList.add('hidden'),
        onOpenDesigner: () => showDialog(els.modalLayer, { title: t('nav.shipDesigner'), description: t('dialog.shipDesignerUnavailable') }),
        onOpenFleetManager: () => showDialog(els.modalLayer, { title: t('nav.fleets'), description: t('dialog.shipReadOnly') }),
    });
    els.shipWindow.classList.remove('hidden');
    positionPopup(els.shipWindow, 650);
}

function openPlanetWindow(planetId) {
    const data = get_planet_detail(planetId);
    renderPlanetWindow(els.planetWindow, data, {
        onClose: () => els.planetWindow.classList.add('hidden'),
    });
    els.planetWindow.classList.remove('hidden');
    positionPopup(els.planetWindow);
    // 1162x680 大窗口：保证不超出左/上边缘
    const left = parseInt(els.planetWindow.style.left, 10);
    const top = parseInt(els.planetWindow.style.top, 10);
    if (Number.isFinite(left) && left < 0) els.planetWindow.style.left = '0px';
    if (Number.isFinite(top) && top < 0) els.planetWindow.style.top = '0px';
}

function closePopups() {
    els.fleetWindow.classList.add('hidden');
    els.shipWindow.classList.add('hidden');
}

function positionPopup(el, offsetX = 0) {
    const rect = els.canvas.getBoundingClientRect();
    el.style.left = `${rect.width / 2 - el.offsetWidth / 2 + offsetX}px`;
    el.style.top = `${rect.height / 2 - el.offsetHeight / 2}px`;
}

function enablePopupDragging(popup) {
    popup.addEventListener('pointerdown', (event) => {
        const header = event.target.closest('.popup-header');
        if (!header || event.target.closest('button, a, input, select, textarea')) return;

        const rect = popup.getBoundingClientRect();
        const pointerOffsetX = event.clientX - rect.left;
        const pointerOffsetY = event.clientY - rect.top;
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
        popup.classList.add('dragging');
        header.setPointerCapture(event.pointerId);
        event.preventDefault();

        const move = (moveEvent) => {
            const maxLeft = Math.max(0, window.innerWidth - popup.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - popup.offsetHeight);
            popup.style.left = `${Math.min(maxLeft, Math.max(0, moveEvent.clientX - pointerOffsetX))}px`;
            popup.style.top = `${Math.min(maxTop, Math.max(0, moveEvent.clientY - pointerOffsetY))}px`;
        };
        const end = () => {
            popup.classList.remove('dragging');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
    });
}

function toggleOverview() {
    els.overviewPanel.classList.toggle('hidden');
    updateSidebar(els.overviewPanel.classList.contains('hidden') ? state.view : 'overview');
}

function handleResize() {
    if (galaxyMap && state.view === 'galaxy') galaxyMap.resize();
    if (systemView && state.view === 'system') systemView.resize();
}

// ============ Start ============
main();

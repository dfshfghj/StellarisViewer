import './style.css';
import loadLocalization from 'virtual:stellaris-localization';
import { GalaxyMap } from './galaxy-map.js';
import { SystemView } from './system-view.js';
import { renderFleetWindow } from './fleet-window.js';
import { renderShipWindow } from './ship-window.js';
import { renderPlanetWindow } from './planet-window.js';
import { renderResourceBar, renderOverviewPanel, renderStatusBar } from './ui-components.js';

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
    overviewContent: document.getElementById('overview-content'),
    statusBar: document.getElementById('status-bar'),
    statusDate: document.getElementById('status-date'),
    statusEmpire: document.getElementById('status-empire'),
    fleetWindow: document.getElementById('fleet-window'),
    shipWindow: document.getElementById('ship-window'),
    planetWindow: document.getElementById('planet-window'),
    btnBack: document.getElementById('btn-back'),
    closeOverview: document.getElementById('close-overview'),
};

// ============ Renderers ============
let galaxyMap = null;
let systemView = null;

// ============ Initialization ============
async function main() {
    await init({ module_or_path: wasmUrl });
    set_localization(await loadLocalization());
    console.log('[Stellaris Viewer] WASM initialized successfully');
    setupEventListeners();
}

function setupEventListeners() {
    els.fileInput.addEventListener('change', handleFileSelect);
    els.btnBack.addEventListener('click', handleBack);
    els.closeOverview.addEventListener('click', () => els.overviewPanel.classList.add('hidden'));
    enablePopupDragging(els.fleetWindow);
    enablePopupDragging(els.shipWindow);

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
        });
    });

    window.addEventListener('resize', handleResize);
}

async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    els.loadingProgress.classList.remove('hidden');
    els.loadingText.textContent = `正在读取 ${file.name}...`;
    document.querySelector('.progress-fill').style.width = '20%';

    const text = await file.text();
    document.querySelector('.progress-fill').style.width = '50%';
    els.loadingText.textContent = '正在解析存档...';

    // Small delay to let UI update
    await new Promise(r => setTimeout(r, 50));

    try {
        const parseTime = parse_save(text);
        document.querySelector('.progress-fill').style.width = '80%';
        els.loadingText.textContent = `解析完成 (${parseTime.toFixed(0)}ms)，正在加载视图...`;

        state.playerInfo = get_player_info();
        state.galaxyData = get_galaxy_data();

        document.querySelector('.progress-fill').style.width = '100%';
        await new Promise(r => setTimeout(r, 100));

        startApp();
    } catch (err) {
        console.error('[Stellaris Viewer] Parse failed:', err);
        els.loadingText.textContent = `解析错误: ${err}`;
        document.querySelector('.progress-fill').style.width = '0%';
    }
}

function startApp() {
    els.loadingScreen.classList.add('hidden');
    els.app.classList.remove('hidden');

    renderResourceBar(els.resourceBar, state.playerInfo);
    renderStatusBar(els.statusDate, els.statusEmpire, state.playerInfo);
    renderOverviewPanel(els.overviewContent, state.playerInfo, {
        onFleetClick: openFleetWindow,
        onPlanetClick: openPlanetWindow,
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
    });
    els.fleetWindow.classList.remove('hidden');
    positionPopup(els.fleetWindow);
}

function openShipWindow(shipId) {
    const data = get_ship_detail(shipId);
    renderShipWindow(els.shipWindow, data, {
        onClose: () => els.shipWindow.classList.add('hidden'),
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
}

function handleResize() {
    if (galaxyMap && state.view === 'galaxy') galaxyMap.resize();
    if (systemView && state.view === 'system') systemView.resize();
}

// ============ Start ============
main();

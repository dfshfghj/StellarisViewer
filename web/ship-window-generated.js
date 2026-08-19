import shipViewDefinition from 'virtual:stellaris-ship-view-ui';
import componentIcons from 'virtual:stellaris-component-icons';
import { assetUrl } from './asset-url.js';
import { mountGui } from './gui-runtime.js';
import { localizeGameText as localize, resolveGameLocalization } from './game-localization.js';
import { bindShipViewData, bindShipViewTextData } from './ship-view-binding.js';

const TEXT_ICON_FILES = {
    ship_stats_hitpoints: 'hit_points',
    ship_stats_armor: 'armor',
    ship_stats_shield: 'shield',
    ship_stats_speed: 'speed',
    ship_stats_evasion: 'evasion',
    ship_stats_damage: 'damage',
    ship_stats_special: 'special',
    ship_stats_cloaking_strength: 'cloaking_strength',
};

const STAT_LABEL_KEYS = {
    hitpoints: 'SHIP_STAT_HITPOINTS_INLINE',
    armor: 'SHIP_STAT_ARMOR_INLINE',
    shields: 'SHIP_STAT_SHIELDS_INLINE',
    speed: 'SHIP_STAT_SPEED_INLINE',
    evasion: 'SHIP_STAT_EVASION_INLINE',
    damage: 'SHIP_STAT_DAMAGE_INLINE',
    rank: 'SHIP_STAT_RANK_INLINE',
    cloaking: 'SHIP_STAT_CLOAKING_INLINE',
};

function renderStatLabels(view) {
    const stats = view.find('stats');
    if (!stats) return;
    for (const [name, key] of Object.entries(STAT_LABEL_KEYS)) {
        const element = view.findIn(stats, name, 'instanttextboxtype');
        if (!element) continue;
        const localized = resolveGameLocalization(key).replace(/§./g, '');
        const parts = localized.split(/(£[a-z0-9_]+£)/gi);
        element.replaceChildren();
        for (const part of parts) {
            const match = part.match(/^£([a-z0-9_]+)£$/i);
            const file = match && TEXT_ICON_FILES[match[1].toLowerCase()];
            if (file) {
                const icon = document.createElement('img');
                icon.className = 'generated-ship-stat-icon';
                icon.src = assetUrl(`/gfx/interface/icons/ship_stats/${file}.webp`);
                icon.alt = '';
                element.appendChild(icon);
            } else if (part) {
                element.appendChild(document.createTextNode(part.replace(/£[^£]+£/g, '')));
            }
        }
    }
}

function ensureStyle() {
    if (document.getElementById('generated-ship-view-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-ship-view-style';
    style.textContent = `
        #ship-window:has(> [data-gui-name="ship_view"]),
        #ship-view-preview:has(> [data-gui-name="ship_view"]) {
            display:block; width:650px; height:650px; min-width:650px; max-width:650px;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
        }
        [data-gui-name="ship_view"] { user-select:none; }
        [data-gui-name="ship_view"] > .generated-ship-drag-handle {
            position:absolute; z-index:1; left:0; top:0; width:650px; height:65px;
            display:block; padding:0; background:transparent;
        }
        [data-gui-name="ship_view"] > [data-gui-name="close"],
        [data-gui-name="ship_view"] > [data-gui-name="rename_button"] { z-index:2; }
        .generated-ship-stat-icon {
            display:inline-block; width:18px; height:18px; margin-right:2px;
            vertical-align:-4px; pointer-events:none;
        }
    `;
    document.head.appendChild(style);
}

function addDragHandle(view) {
    const handle = document.createElement('div');
    handle.className = 'popup-header generated-ship-drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    view.root.appendChild(handle);
}

export function renderShipWindow(container, data = {}, callbacks = {}) {
    ensureStyle();
    const view = mountGui(container, shipViewDefinition, { localize, applyRootPosition: false });
    bindShipViewData(view, data, componentIcons);
    addDragHandle(view);
    view.localizeAll(localize);
    bindShipViewTextData(view, data);
    renderStatLabels(view);

    const close = view.find('close');
    const designer = view.find('open_designer');
    const manager = view.find('open_fleet_manager');
    if (close) close.onclick = callbacks.onClose || (() => {});
    if (designer) designer.onclick = callbacks.onOpenDesigner || (() => {});
    if (manager) manager.onclick = callbacks.onOpenFleetManager || (() => {});
    return view;
}

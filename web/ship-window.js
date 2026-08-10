import componentIcons from 'virtual:stellaris-component-icons';
import { SHIP_SIZE_FRAME_COUNT, shipSizeFrame, spriteFrame } from './gfx-sprites.js';

const IMAGE_ROOT = '/gfx/interface/icons';
const PART_ROOT = `${IMAGE_ROOT}/ship_parts`;

const STAT_ROWS = [
    ['hit_points', '船体值', 'max_hitpoints'],
    ['armor', '装甲', 'max_armor'],
    ['shield', '护盾', 'max_shield'],
    ['cloaking_strength', '隐身强度', 'cloaking_strength'],
    ['speed', '速度', 'speed'],
    ['evasion', '闪避', 'evasion'],
    ['damage', '伤害', 'damage'],
];

// Ship Detail Window DOM Renderer
export function renderShipWindow(container, data, callbacks) {
    const sizeLabel = getShipSizeLabel(data.ship_size);

    container.innerHTML = `
        <div class="popup-header ship-popup-header">
            <div class="ship-heading">
                <div class="popup-title">${esc(data.name)}</div>
                <div class="popup-subtitle">${esc(data.design_name || sizeLabel)}${data.design_name && sizeLabel ? ` · ${esc(sizeLabel)}` : ''}</div>
            </div>
            <button class="popup-close" id="ship-close" title="关闭" aria-label="关闭"></button>
        </div>
        <div class="popup-body ship-popup-body">
            <div class="ship-overview">
                <div class="ship-visual" aria-label="舰船类型">
                    ${renderShipClass(data.ship_size)}
                </div>
                <div class="ship-stats">
                    ${STAT_ROWS.map(([icon, label, field]) => renderStat(data, icon, label, field)).join('')}
                </div>
            </div>

            ${renderComponentSection('核心部件', data.core_components.map(template => ({ template, slot: '' })), 'core')}
            ${renderComponentSection('武器配备', data.weapons, 'weapon')}
            ${renderComponentSection('通用', data.utilities, 'utility')}
        </div>
        <div class="popup-actions ship-popup-actions">
            <button class="action-btn" id="ship-designer" type="button">打开设计器</button>
            <button class="action-btn" id="ship-fleet" type="button">舰队管理</button>
        </div>
    `;

    container.querySelector('#ship-close').onclick = callbacks.onClose;
    container.querySelector('#ship-designer').onclick = callbacks.onOpenDesigner;
    container.querySelector('#ship-fleet').onclick = callbacks.onOpenFleetManager;
    installImageFallbacks(container);
}

function renderStat(data, icon, label, field) {
    let value = data[field];
    if (field === 'evasion') value = Number.isFinite(value) ? `${fmt(value)}%` : '—';
    else if (field === 'damage') value = Number.isFinite(value) ? fmt(value, 1) : '—';
    else value = Number.isFinite(value) ? fmt(value, field === 'speed' ? 1 : 0) : '—';
    const timeIcon = field === 'damage'
        ? `<img class="ship-time-icon" src="${IMAGE_ROOT}/resources/time.webp" alt="每日">`
        : '';
    return `
        <div class="ship-stat">
            <span class="stat-name"><img src="${IMAGE_ROOT}/ship_stats/${icon}.webp" alt="">${label}</span>
            <span class="stat-value">${value}${timeIcon}</span>
        </div>`;
}

function renderComponentSection(title, components, kind) {
    if (!components?.length) return '';
    return `
        <section class="component-section ${kind}-components">
            <div class="component-title">${title}</div>
            <div class="component-grid">
                ${components.map(component => renderComponent(component, kind)).join('')}
            </div>
        </section>`;
}

function renderComponent(component, kind) {
    const template = component.template || '';
    const slotType = kind === 'core' ? '' : getSlotType(component.slot, template);
    const icon = getComponentIconPath(template);
    return `
        <div class="component-slot ${kind} slot-frame-${slotType.toLowerCase()}" title="${esc(template)}${component.slot ? ` (${esc(component.slot)})` : ''}">
            <img class="component-icon" src="${icon}" data-fallback-src="${PART_ROOT}/ship_part_placeholder.webp" alt="${esc(template)}">
        </div>`;
}

function installImageFallbacks(container) {
    for (const image of container.querySelectorAll('img[data-fallback-src]')) {
        image.addEventListener('error', () => {
            if (image.src.endsWith('/ship_part_placeholder.webp')) return;
            image.src = image.dataset.fallbackSrc;
        }, { once: true });
    }
}

function getShipSizeLabel(size) {
    const map = {
        corvette: '护卫舰', destroyer: '驱逐舰', cruiser: '巡洋舰',
        battleship: '战列舰', titan: '泰坦', juggernaut: '主宰',
        science: '科研船', constructor: '工程船', colonizer: '殖民船',
        transport: '运输船', military_station_small: '小型防御平台',
        military_station_medium: '中型防御平台', military_station_large: '大型防御平台',
        starbase: '星港',
    };
    return map[size] || size || '';
}

function renderShipClass(size) {
    return spriteFrame(`${IMAGE_ROOT}/ship_parts/ship_sizes.webp`, SHIP_SIZE_FRAME_COUNT, shipSizeFrame(size), 'ship-visual-class');
}

function getSlotType(slot, template) {
    const s = `${slot || ''} ${template || ''}`.toUpperCase();
    if (s.includes('POINT_DEFENCE') || s.includes('POINT_DEFENSE') || s.includes('FLAK')) return 'P';
    if (s.includes('HANGAR') || s.includes('STRIKE_CRAFT')) return 'H';
    if (s.includes('EXTRA_LARGE') || s.includes('PERDITION')) return 'X';
    if (s.includes('TORPEDO')) return 'G';
    if (s.includes('LARGE')) return 'L';
    if (s.includes('MEDIUM')) return 'M';
    if (s.includes('SMALL')) return 'S';
    if (s.includes('AUX')) return 'A';
    return '';
}

function getComponentIconPath(template) {
    return componentIcons[template] || `${PART_ROOT}/ship_part_placeholder.webp`;
}

function fmt(value, digits = 0) {
    if (value >= 100000) return `${(value / 1000).toFixed(0)}K`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return Number(value).toFixed(digits);
}

function esc(value) {
    const d = document.createElement('div');
    d.textContent = value || '';
    return d.innerHTML;
}

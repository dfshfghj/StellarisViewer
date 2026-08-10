import { SHIP_SIZE_FRAME_COUNT, shipSizeFrame, spriteFrame } from './gfx-sprites.js';

const GFX_ROOT = `${import.meta.env.BASE_URL}gfx/interface/`;
const ICON_ROOT = `${GFX_ROOT}icons/`;

// Fleet Window DOM Renderer
export function renderFleetWindow(container, data, callbacks) {
    const shipType = data.ships.length > 0 ? data.ships[0].ship_size : 'unknown';
    const typeLabel = getShipSizeLabel(shipType);
    const fleetType = data.civilian ? '民用舰船' : data.station ? '空间站' : '军用舰队';
    container.dataset.fleetTheme = getFleetTheme(data, shipType);

    container.innerHTML = `
        <div class="popup-header fleet-popup-header">
            <div class="fleet-emblem">${spriteFrame(`${ICON_ROOT}fleet_type_icons.webp`, 5, getFleetTypeFrame(data, shipType), 'fleet-type-sprite')}</div>
            <div>
                <div class="popup-title">${esc(data.name)}</div>
                <div class="popup-subtitle">${typeLabel} · ${fleetType} · ${data.ships.length} 艘</div>
            </div>
            <div class="fleet-header-actions">
                <button class="gfx-icon-button fleet-manager-button" id="fleet-manage" type="button" title="舰队管理" aria-label="舰队管理"></button>
                <button class="gfx-icon-button fleet-disband-button" id="fleet-disband" type="button" title="解散舰队" aria-label="解散舰队"></button>
                <button class="popup-close" id="fleet-close" type="button" title="关闭" aria-label="关闭"></button>
            </div>
        </div>
        <div class="popup-body">
            <div class="fleet-strength-row">
                <span class="fleet-order-state">${getMovementLabel(data)}</span>
            </div>
            ${renderFleetStats(data)}
            ${renderCommander(data.commander)}

            <div class="ship-grid">
                ${data.ships.map(s => `
                    <div class="ship-grid-item" data-ship-id="${s.id}">
                        <div class="ship-condition" aria-label="舰船状态">
                            ${miniBar('hull', s.hp_pct)}
                            ${miniBar('armor', s.armor_pct)}
                            ${miniBar('shield', s.shield_pct)}
                        </div>
                        <div class="ship-icon">${renderShipIcon(s.ship_size)}</div>
                        <div class="ship-entry-copy">
                            <div class="ship-class">${esc(s.name)}</div>
                            <div class="ship-size">${esc(getShipSizeLabel(s.ship_size))}</div>
                        </div>
                        <span class="ship-entry-power">${Number.isFinite(s.military_power) ? s.military_power.toFixed(0) : ''}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelector('#fleet-close').onclick = callbacks.onClose;
    container.querySelector('#fleet-manage').onclick = callbacks.onManage;
    container.querySelector('#fleet-disband').onclick = callbacks.onDisband;
    container.querySelectorAll('.ship-grid-item').forEach(el => {
        el.onclick = () => callbacks.onShipClick(parseInt(el.dataset.shipId));
    });
}

function renderFleetStats(data) {
    const stats = [
        [`${ICON_ROOT}ship_stats/hit_points.webp`, '船体', `${avgStat(data.ships, 'hp_pct').toFixed(0)}%`],
        [`${ICON_ROOT}ship_stats/armor.webp`, '装甲', `${avgStat(data.ships, 'armor_pct').toFixed(0)}%`],
        [`${ICON_ROOT}ship_stats/shield.webp`, '护盾', `${avgStat(data.ships, 'shield_pct').toFixed(0)}%`],
        [`${ICON_ROOT}ship_stats/cloaking_strength.webp`, '隐身强度', '0'],
        [`${ICON_ROOT}fleet_capacity_icon.webp`, '舰容', navalUsage(data.ships).toString()],
        [`${ICON_ROOT}fleet_size_icon.webp`, '战斗力', data.military_power.toFixed(0)],
    ];
    return `<div class="fleet-stat-strip">${stats.map(([icon, label, value]) => `
        <div class="fleet-stat" title="${label}">
            <img src="${icon}" alt="${label}">
            <span>${value}</span>
        </div>`).join('')}</div>`;
}

function renderCommander(commander) {
    if (!commander) {
        return `<div class="commander-section commander-empty">
            <img class="leader-assign-icon" src="${GFX_ROOT}leaders/leader_assign_icon.webp" alt="">
            <div><div class="commander-name">未指派领袖</div><div class="commander-role">该舰队当前没有司令</div></div>
        </div>`;
    }
    const traits = (commander.traits || []).slice(0, 3);
    return `<div class="commander-section">
        <div class="commander-portrait" title="${esc(commander.portrait)}"><img src="${GFX_ROOT}fleet_view/unknown_leader.webp" alt=""></div>
        <div class="commander-info">
            <div class="commander-name">${esc(commander.name)}</div>
            <div class="commander-role">${getLeaderClassLabel(commander.class)} · 等级 ${commander.level}${commander.age ? ` · ${commander.age} 岁` : ''}</div>
            <div class="commander-experience">经验 ${Math.round(Number(commander.experience) || 0)}</div>
            ${traits.length ? `<div class="commander-traits">${traits.map(trait => `<span title="${esc(trait)}">${esc(formatTrait(trait))}</span>`).join('')}</div>` : ''}
        </div>
    </div>`;
}

function navalUsage(ships) {
    const weights = {
        corvette: 1, destroyer: 2, cruiser: 4, battleship: 8,
        titan: 16, juggernaut: 32, science: 1, constructor: 1,
        colonizer: 1, transport: 1,
    };
    return ships.reduce((total, ship) => total + (weights[ship.ship_size] || 0), 0);
}

function formatTrait(trait) {
    return trait
        .replace(/^(leader_trait_|subclass_commander_)/, '')
        .replace(/_\d+$/, '')
        .replaceAll('_', ' ');
}

function miniBar(kind, value) {
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    return `<span class="mini-condition mini-${kind}"><i style="height:${percent}%"></i></span>`;
}

function avgStat(ships, field) {
    if (ships.length === 0) return 100;
    return ships.reduce((sum, s) => sum + (s[field] || 0), 0) / ships.length;
}

function getShipSizeLabel(size) {
    const map = {
        corvette: '护卫舰', destroyer: '驱逐舰', cruiser: '巡洋舰',
        battleship: '战列舰', titan: '泰坦', juggernaut: '主宰',
        science: '科研船', constructor: '工程船', colonizer: '殖民船',
        transport: '运输船', military_station_small: '小型防御平台',
        military_station_medium: '中型防御平台', military_station_large: '大型防御平台',
        starbase: '星港', ion_cannon: '离子炮',
    };
    return map[size] || size;
}

function getLeaderClassLabel(cls) {
    const map = { commander: '舰队司令', scientist: '科学家', governor: '总督', general: '陆军司令' };
    return map[cls] || cls;
}

function renderShipIcon(size) {
    if (size === 'colonizer') return `<img src="${ICON_ROOT}icon_colony_ship.webp" alt="">`;
    if (size === 'starbase') return `<img src="${ICON_ROOT}starbase_outliner.webp" alt="">`;
    return spriteFrame(`${ICON_ROOT}ship_parts/ship_sizes.webp`, SHIP_SIZE_FRAME_COUNT, shipSizeFrame(size), 'ship-size-sprite');
}

function getMovementLabel(data) {
    if (data.movement_state === 'move_idle') return '待命中';
    if (data.movement_state === 'move_system') return `正在移动${data.destination ? ` → ${esc(data.destination)}` : ''}`;
    return esc(data.movement_state || '状态未知');
}

function getFleetTheme(data, shipType) {
    if (data.station) return 'station';
    if (shipType === 'science') return 'science';
    if (shipType === 'transport') return 'transport';
    if (data.civilian) return 'civilian';
    return 'military';
}

function getFleetTypeFrame(data, shipType) {
    if (data.station) return 4;
    if (shipType === 'science') return 3;
    if (shipType === 'transport') return 2;
    if (data.civilian) return 1;
    return 0;
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

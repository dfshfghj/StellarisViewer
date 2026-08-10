import { SHIP_SIZE_FRAME_COUNT, shipSizeFrame } from './gfx-sprites.js';

const SHIP_ROW_HEIGHT = 43;
const MAX_VISIBLE_SHIPS = 8;
const ENTRY_BASE_HEIGHT = 259;
const FLEETS_TOP = 23;

const FLEET_METRIC_ICONS = {
    hull_points: '/gfx/interface/icons/ship_stats/hit_points.webp',
    armor_points: '/gfx/interface/icons/ship_stats/armor.webp',
    shield_points: '/gfx/interface/icons/ship_stats/shield.webp',
    size_limit: '/gfx/interface/icons/navy_size_icon.webp',
    fleet_power: '/gfx/interface/system/offensive_value.webp',
};

const HIDDEN_ENTRY_BRANCHES = [
    'observation_station_window',
    'colonizer_pop',
    'growth_interface',
    'custom_state_message',
    'orders_large',
    'observation_orders',
    'orders_small',
    'orders_hero_ship',
    'precommunications',
    'observation_actions',
    'drop_area',
    'science_ship_automation_settings_container',
];

export function averageFleetStat(ships, field) {
    if (!ships?.length) return null;
    return ships.reduce((sum, ship) => sum + (Number(ship[field]) || 0), 0) / ships.length;
}

export function navalUsage(ships = []) {
    const weights = {
        corvette: 1, destroyer: 2, cruiser: 4, battleship: 8,
        titan: 16, juggernaut: 32, science: 1, constructor: 1,
        colonizer: 1, transport: 1,
    };
    return ships.reduce((total, ship) => total + (weights[ship.ship_size] || 0), 0);
}

export function fleetMovementLabel(data = {}) {
    if (data.movement_state === 'idle' || data.movement_state === 'move_idle') return '待命中';
    if (data.movement_state === 'move_system') return `正在移动${data.destination ? ` → ${data.destination}` : ''}`;
    return data.movement_state || '状态未知';
}

export function shipSizeLabel(size) {
    const labels = {
        corvette: '护卫舰', destroyer: '驱逐舰', cruiser: '巡洋舰',
        battleship: '战列舰', titan: '泰坦', juggernaut: '主宰',
        science: '科研船', constructor: '工程船', colonizer: '殖民船',
        transport: '运输船', military_station_small: '小型防御平台',
        military_station_medium: '中型防御平台', military_station_large: '大型防御平台',
        starbase: '星港', ion_cannon: '离子炮',
    };
    return labels[size] || size || '未知舰种';
}

function fleetTypeLabel(data) {
    const shipType = data.ships?.[0]?.ship_size;
    const category = data.station ? '空间站' : data.civilian ? '民用舰船' : '军用舰队';
    return `${shipSizeLabel(shipType)} · ${category} · ${data.ships?.length || 0} 艘`;
}

function formatPercent(value) {
    return Number.isFinite(value) ? `${value.toFixed(0)}%` : '—';
}

function formatNumber(value) {
    return Number.isFinite(value) ? value.toFixed(0) : '—';
}

function setText(element, value) {
    if (!element) return;
    const text = value == null || value === '' ? '—' : String(value);
    element.textContent = text;
    element.dataset.guiText = text;
    delete element.dataset.guiAppendText;
}

function setInlineMetric(element, iconPath, value, label) {
    setText(element, value);
    if (!element || typeof document === 'undefined') return;
    const text = element.dataset.guiText;
    const icon = document.createElement('img');
    icon.className = 'generated-fleet-inline-icon';
    icon.src = iconPath;
    icon.alt = '';
    const number = document.createElement('span');
    number.className = 'generated-fleet-inline-value';
    number.textContent = text;
    element.replaceChildren(icon, number);
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.gap = '2px';
    if (element.style.textAlign === 'right') element.style.justifyContent = 'flex-end';
    else if (element.style.textAlign === 'center') element.style.justifyContent = 'center';
    element.setAttribute?.('aria-label', `${label} ${text}`);
}

function hide(element) {
    if (element) element.style.display = 'none';
}

function setSpriteFrame(element, frame, frames) {
    if (!element) return;
    const clamped = Math.max(0, Math.min(frames - 1, Number(frame) || 0));
    element.style.backgroundPosition = `${frames <= 1 ? 0 : (clamped / (frames - 1)) * 100}% 0`;
    element.dataset.guiDynamicFrame = String(clamped);
}

function scoped(view, scope, name, type = null) {
    return scope && view.findIn(scope, name, type);
}

function disable(element) {
    if (!element) return;
    element.disabled = true;
    element.style.pointerEvents = 'none';
    element.setAttribute?.('aria-disabled', 'true');
}

function commanderClassLabel(value) {
    return ({ commander: '舰队司令', scientist: '科学家', governor: '总督', general: '陆军司令' })[value]
        || value || '领袖';
}

function formatTrait(value) {
    return String(value || '')
        .replace(/^(leader_trait_|subclass_commander_)/, '')
        .replace(/_\d+$/, '')
        .replaceAll('_', ' ');
}

function renderCommander(container, commander) {
    if (!container || typeof document === 'undefined') return;
    const overlay = document.createElement('div');
    overlay.className = 'generated-fleet-commander';

    const portrait = document.createElement('img');
    portrait.className = 'generated-fleet-commander-portrait';
    portrait.src = commander
        ? '/gfx/interface/fleet_view/unknown_leader.webp'
        : '/gfx/interface/leaders/leader_assign_icon.webp';
    portrait.alt = '';
    overlay.appendChild(portrait);

    const copy = document.createElement('div');
    copy.className = 'generated-fleet-commander-copy';
    const name = document.createElement('div');
    name.className = 'generated-fleet-commander-name';
    name.textContent = commander?.name || '未指派领袖';
    copy.appendChild(name);
    const detail = document.createElement('div');
    detail.className = 'generated-fleet-commander-detail';
    detail.textContent = commander
        ? `${commanderClassLabel(commander.class)} · 等级 ${commander.level || 1}${commander.age ? ` · ${commander.age} 岁` : ''}`
        : '该舰队当前没有司令';
    copy.appendChild(detail);
    if (commander?.traits?.length) {
        const traits = document.createElement('div');
        traits.className = 'generated-fleet-commander-traits';
        traits.textContent = commander.traits.slice(0, 3).map(formatTrait).join(' · ');
        copy.appendChild(traits);
    }
    overlay.appendChild(copy);
    container.appendChild(overlay);
}

export function bindFleetViewText(view, entry, data = {}) {
    const top = scoped(view, entry, 'top', 'containerwindowtype');
    const bottom = scoped(view, entry, 'bottom', 'containerwindowtype');
    const fleetName = scoped(view, top, 'fleet_name', 'instanttextboxtype');
    setText(fleetName, data.name);
    // Clausewitz draws the 20px localized font outside the declared 15px
    // text bounds. A CSS overflow box would clip the glyphs instead.
    if (fleetName) {
        fleetName.style.height = '20px';
        fleetName.style.lineHeight = '20px';
    }
    setText(scoped(view, top, 'fleet_type', 'instanttextboxtype'), fleetTypeLabel(data));
    setInlineMetric(
        scoped(view, bottom, 'hull_points', 'instanttextboxtype'),
        FLEET_METRIC_ICONS.hull_points, formatPercent(averageFleetStat(data.ships, 'hp_pct')), '船体',
    );
    setInlineMetric(
        scoped(view, bottom, 'armor_points', 'instanttextboxtype'),
        FLEET_METRIC_ICONS.armor_points, formatPercent(averageFleetStat(data.ships, 'armor_pct')), '装甲',
    );
    setInlineMetric(
        scoped(view, bottom, 'shield_points', 'instanttextboxtype'),
        FLEET_METRIC_ICONS.shield_points, formatPercent(averageFleetStat(data.ships, 'shield_pct')), '护盾',
    );
    setInlineMetric(
        scoped(view, bottom, 'size_limit', 'instanttextboxtype'),
        FLEET_METRIC_ICONS.size_limit, String(navalUsage(data.ships)), '舰队规模',
    );
    setInlineMetric(
        scoped(view, bottom, 'fleet_power', 'instanttextboxtype'),
        FLEET_METRIC_ICONS.fleet_power, formatNumber(data.military_power), '舰队战斗力',
    );
    setText(scoped(view, bottom, 'orders', 'instanttextboxtype'), data.stance || '无命令');
    setText(scoped(view, bottom, 'activity', 'instanttextboxtype'), fleetMovementLabel(data));
}

function bindShipRow(view, list, ship, index, callbacks) {
    const row = view.instantiate('fleet_view_subentry', list, { name: `ship-${index}` });
    row.dataset.shipId = String(ship.id);
    setText(scoped(view, row, 'name', 'instanttextboxtype'), `${ship.name || '—'} · ${shipSizeLabel(ship.ship_size)}`);
    setSpriteFrame(scoped(view, row, 'icon', 'icontype'), shipSizeFrame(ship.ship_size), SHIP_SIZE_FRAME_COUNT);

    for (const [name, field] of [['health', 'hp_pct'], ['armor', 'armor_pct'], ['shields', 'shield_pct']]) {
        scoped(view, row, name, 'icontype')?.setProgress?.(ship[field], 100);
    }

    const inspect = scoped(view, row, 'inspect', 'buttontype');
    const openShip = () => callbacks.onShipClick?.(ship.id);
    row.onclick = event => {
        if (!event?.target?.closest?.('button')) openShip();
    };
    if (inspect) inspect.onclick = event => {
        event?.stopPropagation?.();
        openShip();
    };
    disable(scoped(view, row, 'disband', 'buttontype'));
    hide(scoped(view, row, 'inspect_army', 'buttontype'));
    return row;
}

export function bindFleetViewData(view, data = {}, callbacks = {}) {
    const fleets = view.find('fleets');
    if (!fleets) throw new Error('fleet_view is missing the fleets list');
    // In Clausewitz the 500px list is a vertical layout/scroll region and its
    // 510px entries may extend across it. Avoid turning that difference into
    // a browser horizontal scrollbar.
    fleets.style.width = '510px';
    fleets.style.overflowX = 'hidden';
    const entry = view.instantiate('fleet_view_entry', fleets, { name: `fleet-${data.id ?? 'unknown'}` });
    bindFleetViewText(view, entry, data);

    for (const name of HIDDEN_ENTRY_BRANCHES) hide(scoped(view, entry, name));
    const top = scoped(view, entry, 'top', 'containerwindowtype');
    const bottom = scoped(view, entry, 'bottom', 'containerwindowtype');
    hide(scoped(view, top, 'flag', 'buttontype'));
    hide(scoped(view, top, 'icon', 'icontype'));
    hide(scoped(view, top, 'unknown_faction_name', 'instanttextboxtype'));
    disable(scoped(view, top, 'rename_button', 'buttontype'));
    hide(scoped(view, bottom, 'cloaking_values', 'containerwindowtype'));
    hide(scoped(view, bottom, 'focus_on', 'buttontype'));
    hide(scoped(view, bottom, 'go_to_planet_view', 'buttontype'));

    const portrait = scoped(view, entry, 'portrait_container', 'containerwindowtype');
    renderCommander(portrait, data.commander);

    const ships = scoped(view, entry, 'ships', 'smoothlistboxtype');
    ships.style.width = '510px';
    ships.style.overflowX = 'hidden';
    for (const [index, ship] of (data.ships || []).entries()) bindShipRow(view, ships, ship, index, callbacks);

    const visibleRows = Math.min(MAX_VISIBLE_SHIPS, data.ships?.length || 0);
    const shipListHeight = visibleRows * SHIP_ROW_HEIGHT;
    const entryHeight = ENTRY_BASE_HEIGHT + shipListHeight;
    const rootHeight = FLEETS_TOP + entryHeight;
    ships.style.height = `${shipListHeight}px`;
    ships.style.overflowY = (data.ships?.length || 0) > MAX_VISIBLE_SHIPS ? 'auto' : 'hidden';
    entry.style.height = `${entryHeight}px`;
    fleets.style.height = `${entryHeight}px`;
    view.root.style.height = `${rootHeight}px`;

    const manage = scoped(view, top, 'open_fleet_manager', 'buttontype');
    const disband = scoped(view, top, 'disband', 'buttontype');
    const deselect = scoped(view, top, 'deselect', 'buttontype');
    if (manage) manage.onclick = callbacks.onManage || (() => {});
    if (disband) disband.onclick = callbacks.onDisband || (() => {});
    if (deselect) deselect.onclick = callbacks.onClose || (() => {});

    return { entry, rootHeight, shipListHeight };
}

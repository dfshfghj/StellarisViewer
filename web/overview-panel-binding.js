import { SHIP_SIZE_FRAME_COUNT, shipSizeFrame } from './gfx-sprites.js';

const SECTION_HEADER_HEIGHT = 36;
const ROW_HEIGHT = 41;

export function planetClassShort(value) {
    const labels = {
        pc_continental: '陆地', pc_ocean: '海洋', pc_desert: '沙漠',
        pc_arid: '干旱', pc_tundra: '冻原', pc_arctic: '极地',
        pc_tropical: '热带', pc_alpine: '高山', pc_savannah: '草原',
        pc_city: '城市', pc_machine: '机械', pc_hive: '蜂巢',
        pc_ringworld_habitable: '环世', pc_habitat: '栖息地',
    };
    return labels[value] || String(value || '').replace(/^pc_/, '') || '?';
}

export function civilianFleetType(name) {
    const normalized = String(name || '').toLowerCase();
    if (normalized.includes('explorer') || normalized.includes('science')) return '科研船';
    if (normalized.includes('constructor') || normalized.includes('builder')) return '工程船';
    if (normalized.includes('colon')) return '殖民船';
    if (normalized.includes('transport')) return '运输船';
    return '民用舰船';
}

function setText(element, value, { allowEmpty = false } = {}) {
    if (!element) return;
    const text = value == null || value === '' && !allowEmpty ? '—' : String(value ?? '');
    element.textContent = text;
    element.dataset.guiText = text;
    delete element.dataset.guiAppendText;
}

function scoped(view, scope, name, type = null) {
    return scope && view.findIn(scope, name, type);
}

function hide(element) {
    if (element) element.style.display = 'none';
}

function setBackgroundIcon(element, path, frames = 1, frame = 0) {
    if (!element) return;
    const clamped = Math.max(0, Math.min(frames - 1, Number(frame) || 0));
    element.style.backgroundImage = `url("${path}")`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = `${frames * 100}% 100%`;
    element.style.backgroundPosition = `${frames <= 1 ? 0 : (clamped / (frames - 1)) * 100}% 0`;
    element.dataset.overviewIcon = path;
    element.dataset.guiDynamicFrame = String(clamped);
}

function setInlineValue(element, iconPath, value, label) {
    setText(element, value);
    if (!element || typeof document === 'undefined') return;
    const icon = document.createElement('img');
    icon.className = 'generated-overview-inline-icon';
    icon.src = iconPath;
    icon.alt = '';
    const text = document.createElement('span');
    text.textContent = element.dataset.guiText;
    element.replaceChildren(icon, text);
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'flex-end';
    element.style.gap = '2px';
    element.setAttribute?.('aria-label', `${label} ${element.dataset.guiText}`);
}

function prepareRow(view, row, callback, id, kind) {
    hide(scoped(view, row, 'selected_overlay', 'containerwindowtype'));
    row.dataset.overviewKind = kind;
    row.dataset.overviewId = String(id);
    row.onclick = () => callback?.(id);
}

function bindPlanetRow(view, list, planet, index, callbacks) {
    const row = view.instantiate('outliner_member_planet_entry_window', list, { name: `planet-${index}` });
    prepareRow(view, row, callbacks.onPlanetClick, planet.id, 'planet');
    setText(scoped(view, row, 'name', 'instanttextboxtype'), planet.name);
    setText(
        scoped(view, row, 'colony_type', 'instanttextboxtype'),
        `${planetClassShort(planet.planet_class)} · ${Number(planet.num_pops) || 0} 人口`,
    );
    setBackgroundIcon(scoped(view, row, 'planet_type_icon', 'icontype'), '/gfx/interface/icons/planet.webp');
    for (const name of [
        'designation_icon', 'planet_type_overlay_icon_bg', 'designation_overlay_icon_bg',
        'planet_type_icon_overlay', 'designation_icon_overlay', 'occupied', 'blockaded',
        'invasion', 'revolting', 'planet_status_container', 'holding_flag', 'star',
        'constructions', 'colonize', 'leader_level',
    ]) hide(scoped(view, row, name));
    return row;
}

function bindMilitaryFleetRow(view, list, fleet, index, callbacks) {
    const row = view.instantiate('outliner_member_fleet_entry_window', list, { name: `military-${index}` });
    prepareRow(view, row, callbacks.onFleetClick, fleet.id, 'fleet');
    setText(scoped(view, row, 'name', 'instanttextboxtype'), fleet.name);
    setText(scoped(view, row, 'size_limit', 'instanttextboxtype'), `${Number(fleet.ship_count) || 0} 艘`);
    setInlineValue(
        scoped(view, row, 'offensive_power', 'instanttextboxtype'),
        '/gfx/interface/system/offensive_value.webp', Number(fleet.military_power || 0).toFixed(0), '舰队战斗力',
    );
    setBackgroundIcon(
        scoped(view, row, 'alliance_icon', 'icontype'),
        '/gfx/interface/icons/ship_parts/ship_sizes.webp', SHIP_SIZE_FRAME_COUNT, shipSizeFrame('corvette'),
    );
    for (const name of ['fleet_status', 'leader_level', 'location', 'progress', 'fleet_status_grid']) {
        hide(scoped(view, row, name));
    }
    return row;
}

function bindCivilianFleetRow(view, list, fleet, index, callbacks) {
    const row = view.instantiate('outliner_member_fleet_civilian_entry_window', list, { name: `civilian-${index}` });
    prepareRow(view, row, callbacks.onFleetClick, fleet.id, 'fleet');
    setText(scoped(view, row, 'name', 'instanttextboxtype'), fleet.name);
    setText(scoped(view, row, 'type', 'instanttextboxtype'), civilianFleetType(fleet.name));
    setBackgroundIcon(scoped(view, row, 'fleet_status', 'icontype'), '/gfx/interface/icons/fleet_task_small.webp', 5, 0);
    for (const name of ['leader_level', 'location', 'progress']) hide(scoped(view, row, name));
    return row;
}

function bindStationRow(view, list, fleet, index, callbacks) {
    const row = view.instantiate('outliner_member_starbase_entry_window', list, { name: `station-${index}` });
    prepareRow(view, row, callbacks.onFleetClick, fleet.id, 'station');
    setText(scoped(view, row, 'name', 'instanttextboxtype'), fleet.name);
    setText(scoped(view, row, 'starbase_type', 'instanttextboxtype'), '空间站');
    setInlineValue(
        scoped(view, row, 'military_power', 'instanttextboxtype'),
        '/gfx/interface/system/offensive_value.webp', Number(fleet.military_power || 0).toFixed(0), '空间站战斗力',
    );
    for (const name of ['system', 'starbase_status_container', 'constructions']) hide(scoped(view, row, name));
    return row;
}

function bindMetricRow(view, list, metric, index) {
    const row = view.instantiate('outliner_member_fleet_civilian_entry_window', list, { name: `metric-${index}` });
    prepareRow(view, row, null, index, 'metric');
    setText(scoped(view, row, 'name', 'instanttextboxtype'), metric.label);
    setText(scoped(view, row, 'type', 'instanttextboxtype'), metric.value);
    for (const name of ['fleet_status', 'leader_level', 'location', 'progress']) hide(scoped(view, row, name));
    return row;
}

function addSection(view, rootList, title, items, bindRow, callbacks, index) {
    const section = view.instantiate('outliner_title_entry_window', rootList, { name: `section-${index}` });
    hide(scoped(view, section, 'selected_overlay', 'containerwindowtype'));
    setText(scoped(view, section, 'title', 'instanttextboxtype'), title);
    setText(scoped(view, section, 'amount', 'instanttextboxtype'), items.length);
    const list = scoped(view, section, 'list', 'smoothlistboxtype');
    for (const [rowIndex, item] of items.entries()) bindRow(view, list, item, rowIndex, callbacks);
    const rowsHeight = items.length * ROW_HEIGHT;
    list.style.height = `${rowsHeight}px`;
    list.style.overflow = 'hidden';
    section.style.height = `${SECTION_HEADER_HEIGHT + rowsHeight}px`;
    return section;
}

export function bindOverviewPanelData(view, playerInfo = {}, callbacks = {}) {
    setText(view.find('tab_name'), '大纲');
    hide(view.find('options'));
    hide(view.find('rearrange'));
    const rootList = view.find('list');
    if (!rootList) throw new Error('outliner_tab_window is missing its root list');

    const fleets = playerInfo.fleets || [];
    const military = fleets.filter(fleet => !fleet.civilian && !fleet.station);
    const civilian = fleets.filter(fleet => fleet.civilian && !fleet.station);
    const stations = fleets.filter(fleet => fleet.station);
    const sections = [
        ['星域', playerInfo.planets || [], bindPlanetRow],
        ['军用舰队', military, bindMilitaryFleetRow],
        ['民用舰船', civilian, bindCivilianFleetRow],
    ];
    if (stations.length) sections.push(['船坞', stations, bindStationRow]);
    sections.push(['帝国概况', [
        { label: '军事力量', value: Number(playerInfo.military_power || 0).toFixed(0) },
        { label: '帝国规模', value: String(playerInfo.empire_size ?? '—') },
        { label: '人口', value: String(playerInfo.num_pops ?? '—') },
    ], bindMetricRow]);

    const instances = sections.map(([title, items, binder], index) =>
        addSection(view, rootList, title, items, binder, callbacks, index));
    rootList.style.width = '320px';
    rootList.style.height = 'calc(100% - 40px)';
    rootList.style.overflowX = 'hidden';
    rootList.style.overflowY = 'auto';
    view.root.style.width = '320px';
    view.root.style.height = '100%';
    return { sections: instances, military, civilian, stations };
}

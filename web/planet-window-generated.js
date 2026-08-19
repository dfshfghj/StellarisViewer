import planetViewDefinition from 'virtual:stellaris-planet-view-ui';
import { mountGui } from './gui-runtime.js';
import { localizeGameText as localize, resolveGameLocalization } from './game-localization.js';
import { t } from './app-i18n.js';
import { assetUrl } from './asset-url.js';

const PAGE_DEFINITIONS = {
    summary: ['summary_window', 'summary_tab', 'summary_tab_active'],
    management: ['management_window', 'management_tab', 'management_tab_active'],
    population: ['population_window', 'population_tab', 'population_tab_active'],
    armies: ['armies_window', 'armies_tab', 'armies_tab_active'],
    corporate: ['corporate_window', 'corporate_tab', 'corporate_tab_active'],
};

const RESOURCE_KEYS = [
    'energy', 'minerals', 'food', 'consumer_goods', 'alloys', 'trade',
    'physics_research', 'society_research', 'engineering_research',
    'influence', 'unity', 'volatile_motes', 'exotic_gases', 'rare_crystals',
    'living_metal', 'zro', 'dark_matter', 'nanites', 'minor_artifacts',
];

const RESOURCE_ICON_KEYS = {
    living_metal: 'sr_living_metal',
    zro: 'sr_zro',
    dark_matter: 'sr_dark_matter',
};

const STANDARD_DISTRICT_TYPES = [
    'district_city', 'district_generator', 'district_mining', 'district_farming',
];

const STANDARD_PLANET_CLASSES = new Set([
    'pc_desert', 'pc_arid', 'pc_tundra', 'pc_continental', 'pc_tropical',
    'pc_ocean', 'pc_arctic', 'pc_gaia', 'pc_nuked', 'pc_alpine',
    'pc_savannah', 'pc_relic',
]);

const PLANET_CLASS_FRAMES = {
    pc_desert: 0, pc_arid: 1, pc_tundra: 2, pc_continental: 3, pc_tropical: 4,
    pc_ocean: 5, pc_arctic: 6, pc_gaia: 7, pc_barren_cold: 8, pc_barren: 9,
    pc_toxic: 10, pc_molten: 11, pc_frozen: 12, pc_gas_giant: 13, pc_machine: 14,
    pc_hive: 15, pc_nuked: 16, pc_asteroid: 17, pc_alpine: 18, pc_savannah: 19,
    pc_ringworld: 20, pc_habitat: 21, pc_shrouded: 22, pc_city: 24,
};

function ensureStyle() {
    if (document.getElementById('generated-planet-view-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-planet-view-style';
    style.textContent = `
        #planet-window:has(> [data-gui-name="planet_view"]),
        #planet-view-preview:has(> [data-gui-name="planet_view"]) {
            display:block; width:1162px; height:680px; min-width:1162px;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
        }
        #planet-window:has(> [data-gui-name="planet_view"])::after { display:none; }
        #planet-window > [data-gui-name="planet_view"] { user-select:none; }
        #planet-window > [data-gui-name="planet_view"] > .cw-node:not(.generated-planet-backdrop) { z-index:1; }
        #planet-window [data-planet-tab] { z-index:30; }
        #planet-window [data-planet-tab][aria-selected="true"] { cursor:default; }
        #planet-window .generated-planet-close-hit-target {
            position:absolute; left:1120px; top:12px; z-index:100; width:38px; height:38px;
            padding:0; border:0; background:transparent; opacity:0; cursor:pointer; pointer-events:auto;
        }
        #planet-window .generated-planet-drag-handle {
            position:absolute; left:0; top:0; z-index:25; width:1055px; height:92px;
            cursor:move; touch-action:none; background:transparent;
        }
        #planet-window.dragging .generated-planet-drag-handle { cursor:grabbing; }
        #planet-window .generated-planet-readonly {
            position:absolute; z-index:20; box-sizing:border-box;
            color:#d5e8e5; font:14px/1.45 Arial,"Microsoft YaHei",sans-serif;
            background:linear-gradient(135deg,rgba(12,35,38,.94),rgba(7,22,27,.84));
            border:1px solid rgba(104,177,170,.35); box-shadow:inset 0 0 18px rgba(45,112,107,.18);
        }
        #planet-window .generated-planet-readonly h3 {
            margin:0 0 12px; color:#a8d4e6; font-size:20px; font-weight:400;
        }
        #planet-window .generated-planet-readonly dl {
            display:grid; grid-template-columns:minmax(145px,auto) 1fr; gap:9px 18px; margin:0;
        }
        #planet-window .generated-planet-readonly dt { color:#87aaa7; }
        #planet-window .generated-planet-readonly dd { margin:0; color:#fff; }
        #planet-window .generated-planet-note { margin-top:18px; color:#75938f; }
        #planet-window .generated-data-list {
            position:absolute; z-index:24; box-sizing:border-box; overflow:auto;
            color:#d7e8e7; font:14px/1.25 Arial,"Microsoft YaHei",sans-serif;
            scrollbar-color:#4d7774 #10282b; scrollbar-width:thin;
        }
        #planet-window .generated-data-row {
            display:flex; align-items:center; min-height:42px; margin:0 0 4px; padding:4px 9px;
            box-sizing:border-box; border:1px solid rgba(83,137,133,.28);
            background:linear-gradient(90deg,rgba(24,57,60,.9),rgba(10,30,34,.8));
        }
        #planet-window .generated-data-row img { width:34px; height:34px; margin-right:9px; object-fit:contain; }
        #planet-window .generated-data-name { flex:1; min-width:0; color:#dce9e7; text-transform:none; }
        #planet-window .generated-data-value { color:#f3f6e8; font-size:16px; white-space:nowrap; }
        #planet-window .generated-data-muted { display:block; color:#829f9b; font-size:12px; }
        #planet-window .generated-stratum { margin-bottom:7px; border-left:3px solid #799b72; }
        #planet-window .generated-stratum-title {
            display:flex; justify-content:space-between; padding:5px 10px; color:#bcd4cf;
            background:rgba(48,78,76,.72); font-size:15px;
        }
        #planet-window .generated-job-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:3px; padding:4px; }
        #planet-window .generated-job { min-height:52px; padding:4px 6px; margin:0; }
        #planet-window .generated-job img { width:30px; height:30px; margin-right:5px; }
        #planet-window .generated-army-row { min-height:49px; }
        #planet-window .generated-army-health { width:86px; margin-left:10px; }
        #planet-window .generated-army-health-bar { height:6px; background:#16332e; border:1px solid #315d54; }
        #planet-window .generated-army-health-bar span { display:block; height:100%; background:#59b36e; }
        #planet-window .generated-resource-output {
            display:flex; flex-wrap:wrap; align-content:flex-start; justify-content:center;
            gap:5px 9px; padding:2px 4px; box-sizing:border-box;
        }
        #planet-window .generated-resource-entry {
            position:relative; display:inline-flex; align-items:center; gap:2px; color:#e5eee9;
            white-space:nowrap; font-size:14px; line-height:18px;
        }
        #planet-window .generated-resource-entry img { width:18px; height:18px; object-fit:contain; }
        #planet-window .generated-resource-entry[data-resource-sign="positive"] { color:#9fdfaf; }
        #planet-window .generated-resource-entry[data-resource-sign="negative"] { color:#e58c82; }
        #planet-window .generated-planet-empty {
            display:flex; align-items:center; justify-content:center; text-align:center;
            color:#789894; letter-spacing:.02em;
        }
        #planet-window .generated-planet-disabled { opacity:.45; cursor:not-allowed; }
        #planet-window [data-planet-building-slot] { pointer-events:none; }
        #planet-window .generated-planet-backdrop {
            position:absolute; inset:0; z-index:0; pointer-events:none; overflow:visible;
        }
        #planet-window .generated-planet-bg-left {
            position:absolute; left:0; top:28px; width:850px; height:594px; box-sizing:border-box;
            border-style:solid; border-width:296px 330px; border-color:transparent;
            border-image:url('/gfx/interface/tiles/tile_large_bg_plain.webp') 296 330 fill;
            background:#061316;
        }
        #planet-window .generated-planet-bg-right {
            position:absolute; left:850px; top:10px; width:312px; height:631px; box-sizing:border-box;
            border-style:solid; border-width:80px; border-color:transparent;
            border-image:url('/gfx/interface/tiles/plain_bg_tile.webp') 80 fill;
            background:#071517;
        }
        #planet-window .generated-planet-stripes {
            position:absolute; left:0; top:9px; width:850px; height:242px;
            background:url('/gfx/interface/planetview/planetview_big_stripes.webp') 0 0/100% 100% no-repeat;
        }
        #planet-window .generated-planet-gradient {
            position:absolute; left:0; top:10px; width:189px; height:116px;
            background:url('/gfx/interface/planetview/planet_view_gradient.webp') 0 0/100% 100% no-repeat;
        }
        #planet-window .generated-planet-banner {
            position:absolute; left:0; top:0; width:251px; height:72px;
            background:url('/gfx/interface/planetview/planet_title_banner.webp') 0 0/100% 100% no-repeat;
        }
        #planet-window .generated-planet-orb {
            position:absolute; left:310px; top:10px; width:230px; height:230px;
            filter:drop-shadow(0 0 18px rgba(80,190,255,.35));
        }
    `;
    document.head.appendChild(style);
}

function directChild(parent, name) {
    return [...parent.children].find(element => element.dataset?.guiName === name) || null;
}

function addGeneratedBackdrop(root, data) {
    const backdrop = document.createElement('div');
    backdrop.className = 'generated-planet-backdrop';
    for (const className of [
        'generated-planet-bg-left', 'generated-planet-bg-right', 'generated-planet-stripes',
        'generated-planet-gradient', 'generated-planet-banner', 'generated-planet-orb',
    ]) {
        const element = document.createElement('div');
        element.className = className;
        backdrop.appendChild(element);
    }
    const orb = backdrop.lastElementChild;
    const frame = PLANET_CLASS_FRAMES[data.planet_class] ?? 0;
    orb.style.background = `url('${assetUrl('/gfx/interface/icons/planet_type_big_icons.webp')}') ${(frame / 35) * 100}% 0 / 3600% 100% no-repeat`;
    root.prepend(backdrop);
}

function hide(element) {
    if (element) element.style.display = 'none';
}

function selectBaseBranches(view) {
    const root = view.root;
    for (const name of [
        'terraforming_in_progress',
        'colonize_button_container',
        'sector_governor_window',
        'planet_devastation',
        'side_bar_window',
    ]) hide(directChild(root, name));

    const header = directChild(root, 'header_actions');
    for (const name of ['open_orbital_ring', 'previous_planet_extra_shortcut', 'move_capital', 'go_to_observation_post']) {
        hide(header && view.findIn(header, name));
    }

    const actions = directChild(root, 'planet_actions_window');
    for (const element of view.findAll('colonizing_planet_window', actions || root)) hide(element);

    const summary = directChild(root, 'summary_window');
    for (const name of ['uncolonizable_planet_window', 'archaeological_site_window']) {
        hide(summary && directChild(summary, name));
    }
    return { summary, colonizable: summary && directChild(summary, 'colonizable_planet_window') };
}

function formatNumber(value) {
    return Number.isFinite(value) ? String(Math.round(value)) : '—';
}

function gameText(key, fallback) {
    const value = resolveGameLocalization(key);
    return value === key ? fallback : localize(key);
}

function typeName(key, prefix = '') {
    if (!key) return '—';
    const value = resolveGameLocalization(key);
    if (value !== key) return localize(key);
    return String(key).replace(new RegExp(`^${prefix}`), '').replace(/_/g, ' ');
}

function setText(view, name, value, scope = view.root) {
    const element = view.findIn(scope, name);
    if (element) element.textContent = value;
    return element;
}

function resourceSummary(resources, sign) {
    const parts = RESOURCE_KEYS.flatMap(key => {
        const value = resources?.[key];
        if (!Number.isFinite(value) || Math.abs(value) < 0.1) return [];
        const label = gameText(key, key.replace(/_/g, ' '));
        const amount = Number.isInteger(value) ? value : value.toFixed(1);
        return [`${sign}${Math.abs(amount)} ${label}`];
    });
    return parts.join('   ') || '—';
}

function bindResourceOutput(view, name, resources, sign, scope) {
    const element = view.findIn(scope, name);
    if (!element) return;
    element.replaceChildren();
    element.classList.add('generated-resource-output');
    let count = 0;
    for (const key of RESOURCE_KEYS) {
        const value = resources?.[key];
        if (!Number.isFinite(value) || Math.abs(value) < 0.1) continue;
        const label = gameText(key, key.replace(/_/g, ' '));
        const amount = Number.isInteger(value) ? Math.abs(value) : Math.abs(value).toFixed(1);
        const entry = document.createElement('span');
        entry.className = 'generated-resource-entry';
        entry.dataset.resourceKey = key;
        entry.dataset.resourceSign = sign === '+' ? 'positive' : 'negative';
        entry.title = label;
        entry.setAttribute('aria-label', `${label} ${sign}${amount}`);
        const icon = document.createElement('img');
        icon.src = assetUrl(`/gfx/interface/icons/resources/${RESOURCE_ICON_KEYS[key] || key}.webp`);
        icon.alt = '';
        const number = document.createElement('span');
        number.textContent = `${sign}${amount}`;
        entry.append(icon, number);
        element.appendChild(entry);
        count += 1;
    }
    if (!count) element.textContent = '—';
}

const DISTRICT_ORDER = ['city', 'generator', 'mining', 'farming'];

function districtCategory(type) {
    if (!type) return 'other';
    if (/^district_(city|arcology_housing|hab_housing|rw_city)/.test(type)) return 'city';
    if (type.startsWith('district_generator')) return 'generator';
    if (type.startsWith('district_mining')) return 'mining';
    if (type.startsWith('district_farming')) return 'farming';
    return 'other';
}

function districtCap(type, data) {
    const category = districtCategory(type);
    if (category === 'city') return Math.max(0, (data.size || 0) - (data.blocked_districts || 0));
    const deposits = data.resource_deposits || {};
    const value = category === 'generator' ? deposits.generator
        : category === 'mining' ? deposits.mining
        : category === 'farming' ? deposits.farming : null;
    return value == null ? null : Math.max(3, Math.min(value, 15));
}

function groupDistricts(districts, data) {
    const groups = new Map();
    for (const district of districts) {
        const key = district.district_type || 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(district);
    }
    const hasStandardDistrict = STANDARD_DISTRICT_TYPES.some(type => groups.has(type));
    if (STANDARD_PLANET_CLASSES.has(data?.planet_class) || hasStandardDistrict) {
        for (const type of STANDARD_DISTRICT_TYPES) {
            if (!groups.has(type)) groups.set(type, []);
        }
    }
    return [...groups.entries()].sort(([left], [right]) => {
        const leftOrder = DISTRICT_ORDER.indexOf(districtCategory(left));
        const rightOrder = DISTRICT_ORDER.indexOf(districtCategory(right));
        return (leftOrder < 0 ? 99 : leftOrder) - (rightOrder < 0 ? 99 : rightOrder)
            || left.localeCompare(right);
    });
}

function setElementIcon(element, path) {
    if (!element) return;
    element.style.backgroundImage = `url("${path}")`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = 'contain';
    element.style.backgroundPosition = 'center';
}

function setElementFrame(element, path, frames, frame) {
    if (!element) return;
    const boundedFrame = Math.max(0, Math.min(frames - 1, frame));
    element.style.backgroundImage = `url("${path}")`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = `${frames * 100}% 100%`;
    element.style.backgroundPosition = `${frames === 1 ? 0 : (boundedFrame / (frames - 1)) * 100}% 0`;
    element.dataset.spriteFrame = String(boundedFrame);
}

function configureBuildingSlot(view, box, building, index) {
    const slot = view.instantiate('planet_building_entry', box, { name: `building-${index}` });
    slot.dataset.planetBuildingSlot = building ? 'filled' : 'empty';
    slot.dataset.planetBuildingPosition = String(index);
    for (const name of [
        'locked_building_button', 'ruined_building_icon', 'progressbar',
        'selected_building_icon', 'upgrade_building', 'disabled_building',
    ]) hide(view.findIn(slot, name));

    const open = view.findIn(slot, 'open_building_button');
    if (open) {
        open.disabled = true;
        open.classList.add('generated-planet-disabled');
    }
    const icon = view.findIn(slot, 'building_icon');
    const empty = view.findIn(slot, 'add_building_bg');
    const background = view.findIn(slot, 'building_bg');
    if (building) {
        slot.dataset.planetBuildingType = building.building_type;
        slot.title = typeName(building.building_type, 'building_');
        setElementIcon(icon, assetUrl(`/gfx/interface/icons/buildings/${building.building_type}.webp`));
        hide(empty);
    } else {
        hide(icon);
        hide(background);
        slot.title = gameText('BUILDING_SLOT_OPEN', 'Empty building slot');
    }
}

function populateBuildings(view, box, zone) {
    if (!box) return;
    box.replaceChildren();
    const buildings = new Map((zone?.buildings || []).map(building => [building.position, building]));
    for (let index = 0; index < (zone?.slots || 0); index += 1) {
        configureBuildingSlot(view, box, buildings.get(index), index);
    }
}

function configureZone(view, zoneElement, zone) {
    if (!zoneElement) return;
    const locked = !zone || zone.locked;
    const info = view.findIn(zoneElement, 'zone_info_button');
    const button = view.findIn(zoneElement, 'zone_button');
    const available = view.findIn(zoneElement, 'zone_available');
    const unavailable = view.findIn(zoneElement, 'zone_unavailable');
    const title = view.findIn(zoneElement, 'zone_title');
    const icon = view.findIn(zoneElement, 'zone_icon');
    const buildings = view.findIn(zoneElement, 'buildings_box', 'gridboxtype');

    hide(view.findIn(zoneElement, 'selection_highlight'));
    hide(view.findIn(zoneElement, 'progressbar'));
    if (locked) {
        hide(info);
        hide(title);
        hide(icon);
        hide(unavailable);
        hide(buildings);
        if (button) {
            button.disabled = true;
            button.classList.add('generated-planet-disabled');
        }
        if (available) available.textContent = gameText('zone_available', 'Specialization available');
        return;
    }

    hide(button);
    hide(available);
    hide(unavailable);
    if (info) {
        info.disabled = true;
        info.classList.add('generated-planet-disabled');
    }
    if (title) title.textContent = typeName(zone.zone_type, 'zone_');
        setElementIcon(icon, assetUrl(`/gfx/interface/icons/zones/${zone.zone_type}.webp`));
    populateBuildings(view, buildings, zone);
}

function populateDistrictZones(view, entry, districts) {
    const zones = districts.flatMap(district => district.zones || []);
    const base = zones.find(zone => !zone.locked && zone.zone_type === 'zone_default');
    const primary = view.findIn(entry, 'zone', 'containerwindowtype');
    configureZone(view, primary, base || zones[0]);

    const secondaryGrid = view.findIn(entry, 'zones_grid_box', 'gridboxtype');
    if (!secondaryGrid) return;
    secondaryGrid.replaceChildren();
    const secondary = zones.filter(zone => zone !== base).slice(0, 3);
    for (const [index, zone] of secondary.entries()) {
        const zoneEntry = view.instantiate('zone_entry', secondaryGrid, { name: `zone-${index}` });
        configureZone(view, zoneEntry, zone);
    }
}

function populateDistrictCubes(view, entry, districtType, built, cap, blocked) {
    const grid = view.findIn(entry, 'district_box_grid', 'gridboxtype');
    const capContainer = view.findIn(entry, 'planet_district_cap_container');
    if (grid) grid.replaceChildren();
    const available = Math.max(0, (cap ?? built) - built);
    const slots = built + available + blocked;
    if (slots > 30 || !grid) {
        if (capContainer) capContainer.style.display = '';
        return;
    }
    if (capContainer) capContainer.style.display = '';
    const path = assetUrl(`/gfx/interface/icons/districts/grid_box/${districtType}_rectangle.webp`);
    const states = [
        ['built', built, 0],
        ['available', available, 1],
        ['blocked', blocked, 2],
    ];
    let index = 0;
    for (const [state, count, frame] of states) {
        for (let stateIndex = 0; stateIndex < count; stateIndex += 1) {
        const cube = view.instantiate('rectangle_district_grid_box_entry', grid, { name: `district-cube-${index}` });
            cube.dataset.planetDistrictSlot = state;
            setElementFrame(view.findIn(cube, 'rectangle'), path, 3, frame);
            index += 1;
        }
    }
}

function bindDistricts(view, colonizable, data) {
    if (!colonizable) return;
    const districts = data.districts || [];
    const groups = groupDistricts(districts, data);
    const total = districts.reduce((sum, district) => sum + (district.level || 0), 0);
    setText(view, 'planet_districts_amount', `${total}/${data.size ?? '—'}`, colonizable);

    const mainGrid = view.findIn(colonizable, 'main_districts_grid_box', 'gridboxtype');
    const districtGrid = view.findIn(colonizable, 'districts_grid_box', 'gridboxtype');
    mainGrid?.replaceChildren();
    districtGrid?.replaceChildren();

    const bindEntry = ([districtType, instances], parent, template, index) => {
        if (!parent) return;
        const entry = view.instantiate(template, parent, { name: `district-${index}` });
        const built = instances.reduce((sum, district) => sum + (district.level || 0), 0);
        const cap = districtCap(districtType, data);
        const blocked = Number(data.blocked_districts || 0);
        entry.dataset.planetDistrict = districtType;
        entry.dataset.planetDistrictBuilt = String(built);
        entry.dataset.planetDistrictAvailable = String(Math.max(0, (cap ?? built) - built));
        entry.dataset.planetDistrictBlocked = String(blocked);
        if (cap != null) entry.dataset.planetDistrictCap = String(cap);
        setText(view, 'name', typeName(districtType, 'district_'), entry);
        hide(view.findIn(entry, 'triggered_name'));
        hide(view.findIn(entry, 'not_surveyed'));
        setText(view, 'num_districts_text', cap == null ? String(built) : `${built}/${cap}`, entry);
        const icon = view.findIn(entry, 'district_icon');
        setElementIcon(icon, assetUrl(`/gfx/interface/icons/districts/${districtType}.webp`));
        setElementIcon(
            view.findIn(entry, 'districts_window_background'),
            assetUrl(`/gfx/interface/planetview/district_backgrounds/${districtType}_bg.webp`),
        );
        hide(view.findIn(entry, 'district_overlay_icon'));
        populateDistrictCubes(view, entry, districtType, built, cap, blocked);
        populateDistrictZones(view, entry, instances);
        for (const name of ['district_button', 'build_district', 'zone_info_button', 'zone_button']) {
            const button = view.findIn(entry, name);
            if (button) {
                button.disabled = true;
                button.classList.add('generated-planet-disabled');
                button.title = t('planet.readOnly');
            }
        }
    };

    groups.slice(0, 4).forEach((group, index) => {
        bindEntry(group, index === 0 ? mainGrid : districtGrid,
            index === 0 ? 'planet_district_entry_width_2' : 'planet_district_entry_width_1', index);
    });
    if (!groups.length && mainGrid) {
        const empty = document.createElement('div');
        empty.className = 'generated-planet-empty';
        empty.style.cssText = 'position:relative;width:830px;height:150px';
        empty.textContent = t('planet.noDistricts');
        mainGrid.appendChild(empty);
    }
}

function wireClose(view, callbacks) {
    const close = directChild(view.root, 'header_actions')
        && view.findIn(directChild(view.root, 'header_actions'), 'close');
    const onClose = callbacks.onClose || (() => {});
    if (close) {
        close.style.zIndex = '99';
        close.onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        };
    }
    const target = document.createElement('button');
    target.className = 'generated-planet-close-hit-target';
    target.type = 'button';
    target.dataset.planetClose = '';
    target.setAttribute('aria-label', gameText('CLOSE_TITLE', t('common.close')));
    target.addEventListener('pointerdown', event => event.stopPropagation());
    target.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
    });
    view.root.appendChild(target);
}

function addDragHandle(view) {
    const handle = document.createElement('div');
    handle.className = 'popup-header generated-planet-drag-handle';
    handle.dataset.planetDragHandle = '';
    handle.setAttribute('aria-label', gameText('MOVE_WINDOW', 'Move planet window'));
    view.root.appendChild(handle);
}

function bindCommonData(view, data) {
    const values = {
        planet_name: data.name || t('planet.name'),
        colony_type_text: typeName(data.designation, 'designation_'),
        planet_stability_amount: formatNumber(data.stability),
        planet_pops_amount: String(data.num_pops ?? 0),
        planet_crime_amount: formatNumber(data.crime),
        planet_housing_amount: formatNumber(data.free_housing),
        planet_amenities_amount: formatNumber(data.free_amenities),
        planet_jobs_amount: formatNumber(data.employable_pops),
        planet_unemployed_amount: '—',
    };
    for (const [name, value] of Object.entries(values)) {
        const element = view.find(name);
        if (element) element.textContent = value;
    }

    const summary = directChild(view.root, 'summary_window');
    setText(view, 'management_planet_class_text', typeName(data.planet_class, 'pc_'), summary);
    setText(view, 'management_habitability', `${gameText('HABITABILITY', 'Habitability')}: —`, summary);
    setText(view, 'colonization_date', `${gameText('COLONIZED', 'Colonized')}: ${data.colonize_date || '—'}`, summary);
    setText(view, 'planet_size', `${gameText('SIZE', 'Size')}: ${data.size ?? '—'}`, summary);
    setText(view, 'designation_name', typeName(data.designation, 'designation_'), summary);
    bindResourceOutput(view, 'planetary_production_output_amount', data.produces, '+', summary);
    bindResourceOutput(view, 'planetary_consumption_output_amount', data.upkeep, '-', summary);
}

function addReadonlyPanel(page, title, rows, note) {
    const panel = document.createElement('section');
    panel.className = 'generated-planet-readonly';
    panel.style.cssText = 'left:300px;top:72px;width:535px;min-height:285px;padding:22px 26px';
    const heading = document.createElement('h3');
    heading.textContent = title;
    panel.appendChild(heading);
    const list = document.createElement('dl');
    for (const [label, value] of rows) {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        list.append(term, description);
    }
    panel.appendChild(list);
    if (note) {
        const message = document.createElement('p');
        message.className = 'generated-planet-note';
        message.textContent = note;
        panel.appendChild(message);
    }
    page.appendChild(panel);
}

function dataList(page, className, style) {
    const list = document.createElement('div');
    list.className = `generated-data-list ${className}`;
    list.style.cssText = style;
    page.appendChild(list);
    return list;
}

function dataRow({ icon, name, value, detail = '', className = '' }) {
    const row = document.createElement('div');
    row.className = `generated-data-row ${className}`;
    if (icon) {
        const image = document.createElement('img');
        image.src = icon;
        image.alt = '';
        row.appendChild(image);
    }
    const label = document.createElement('span');
    label.className = 'generated-data-name';
    label.textContent = name;
    if (detail) {
        const muted = document.createElement('small');
        muted.className = 'generated-data-muted';
        muted.textContent = detail;
        label.appendChild(muted);
    }
    const amount = document.createElement('span');
    amount.className = 'generated-data-value';
    amount.textContent = value;
    row.append(label, amount);
    return row;
}

function signed(value) {
    const rounded = Math.round(Number(value) || 0);
    return rounded > 0 ? `+${rounded}` : String(rounded);
}

function bindManagementPage(view, page, data) {
    const features = dataList(page, 'generated-feature-list', 'left:15px;top:98px;width:270px;height:329px');
    for (const feature of data.features || []) {
        const row = dataRow({
            icon: assetUrl(`/gfx/interface/icons/deposits/${feature.icon_key}.webp`),
            name: typeName(feature.feature_type),
            value: '',
        });
        row.dataset.planetFeature = feature.feature_type;
        features.appendChild(row);
    }

    const demographics = dataList(page, 'generated-species-list', 'left:305px;top:98px;width:530px;height:329px');
    for (const species of data.species || []) {
        const groups = (data.pop_groups || []).filter(group => group.species_id === species.id);
        const row = dataRow({
            icon: assetUrl('/gfx/interface/icons/pop.webp'),
            name: species.name,
            detail: `${typeName(species.class)} · ${groups.length} ${gameText('POP_GROUPS', 'population groups')}`,
            value: formatNumber(species.pops),
        });
        row.dataset.planetSpecies = String(species.id);
        demographics.appendChild(row);
    }

    const growth = data.monthly_population || {};
    setText(view, 'total_growth', signed(growth.net), page);
    for (const [windowName, value] of [
        ['growth_data', growth.growth], ['migration_data', growth.migration], ['assembly_data', growth.assembly],
    ]) {
        const scope = view.findIn(page, windowName);
        if (scope) setText(view, 'value', signed(value), scope);
    }
}

function bindPopulationPage(view, page, data) {
    const list = dataList(page, 'generated-jobs-list', 'left:20px;top:100px;width:815px;height:326px');
    const order = ['ruler', 'specialist', 'worker', 'civilian', 'pre_sapients', 'other'];
    for (const category of order) {
        const jobs = (data.jobs || []).filter(job => job.category === category);
        if (!jobs.length) continue;
        const section = document.createElement('section');
        section.className = 'generated-stratum';
        const title = document.createElement('div');
        title.className = 'generated-stratum-title';
        const categoryLabel = typeName(category === 'pre_sapients' ? 'PRE_SAPIENTS' : `pop_cat_${category}`);
        const total = jobs.reduce((sum, job) => sum + job.workforce, 0);
        title.innerHTML = `<span>${categoryLabel}</span><span>${formatNumber(total)}</span>`;
        const grid = document.createElement('div');
        grid.className = 'generated-job-grid';
        for (const job of jobs) {
            const row = dataRow({
                icon: assetUrl(`/gfx/interface/icons/jobs/job_${job.job_type}.webp`),
                name: typeName(`job_${job.job_type}`),
                value: formatNumber(job.workforce),
                className: 'generated-job',
            });
            row.dataset.planetJob = job.job_type;
            grid.appendChild(row);
        }
        section.append(title, grid);
        list.appendChild(section);
    }
    setText(view, 'job_types_amount', `${(data.jobs || []).length} ${gameText('JOB_TYPES', 'Job Types')}`, page);
}

function bindArmiesPage(view, page, data) {
    const combat = directChild(page, 'ground_combat_window');
    if (combat) hide(combat);
    const list = dataList(page, 'generated-armies-list', 'left:24px;top:198px;width:487px;height:225px');
    for (const army of data.army_units || []) {
        const pct = army.max_health > 0 ? Math.round(army.health / army.max_health * 100) : 0;
        const row = dataRow({
            icon: army.army_type === 'defense_army'
                ? assetUrl('/gfx/interface/icons/text_icons/text_icon_defense_army.webp')
                : assetUrl('/gfx/interface/planetview/army_icon.webp'),
            name: army.name,
            detail: `${army.species_name} · ${typeName(army.army_type)}`,
            value: `${formatNumber(army.power)} · ${pct}%`,
            className: 'generated-army-row',
        });
        row.dataset.planetArmy = String(army.id);
        const health = document.createElement('div');
        health.className = 'generated-army-health';
        health.innerHTML = `<div class="generated-army-health-bar"><span style="width:${pct}%"></span></div>`;
        row.appendChild(health);
        list.appendChild(row);
    }
    const recruitment = dataList(page, 'generated-recruitment-list', 'left:524px;top:105px;width:310px;height:312px');
    for (const option of data.recruitable_armies || []) {
        const row = dataRow({
            icon: assetUrl('/gfx/interface/planetview/army_icon.webp'),
            name: typeName(option.army_type),
            detail: `${option.species_name} · ${option.build_time} ${gameText('DAYS', 'days')}`,
            value: `${formatNumber(option.mineral_cost)}`,
            className: 'generated-army-row',
        });
        row.dataset.recruitableArmy = option.army_type;
        recruitment.appendChild(row);
    }
    setText(view, 'armies_count', String((data.army_units || []).length), page);
    setText(view, 'garrison_power', formatNumber(data.army_power), page);
    setText(view, 'garrison_assault_power', formatNumber(data.army_power), page);
    setText(view, 'no_armies', (data.army_units || []).length ? '' : gameText('NO_ARMIES', 'No armies'), page);
}

function bindDetailPages(view, data) {
    const management = directChild(view.root, 'management_window');
    const population = directChild(view.root, 'population_window');
    const armies = directChild(view.root, 'armies_window');
    const corporate = directChild(view.root, 'corporate_window');

    bindManagementPage(view, management, data);
    bindPopulationPage(view, population, data);
    bindArmiesPage(view, armies, data);

    addReadonlyPanel(corporate, gameText('CORPORATE_TAB', 'Corporate'), [
        [gameText('PLANETARY_PRODUCTION', 'Planetary production'), resourceSummary(data.produces, '+')],
        [gameText('PLANETARY_DEFICIT', 'Planetary deficit'), resourceSummary(data.upkeep, '-')],
    ], t('planet.holdingsUnavailable'));
}

function wireTabs(view) {
    const root = view.root;
    const activate = pageName => {
        for (const [name, [windowName, tabName, activeName]] of Object.entries(PAGE_DEFINITIONS)) {
            const page = directChild(root, windowName);
            const tab = directChild(root, tabName);
            const active = directChild(root, activeName);
            if (page) page.style.display = name === pageName ? '' : 'none';
            if (active) {
                active.style.display = name === pageName ? '' : 'none';
                active.style.pointerEvents = 'none';
                active.setAttribute('aria-hidden', 'true');
            }
            if (tab) tab.setAttribute('aria-selected', String(name === pageName));
        }
        root.dataset.planetActivePage = pageName;
    };

    for (const [name, [windowName, tabName]] of Object.entries(PAGE_DEFINITIONS)) {
        const page = directChild(root, windowName);
        const tab = directChild(root, tabName);
        if (page) page.dataset.planetPage = name;
        if (tab) {
            tab.dataset.planetTab = name;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', `planet-page-${name}`);
            tab.addEventListener('pointerdown', event => event.stopPropagation());
            tab.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                activate(name);
            });
        }
        if (page) page.id = `planet-page-${name}`;
    }
    activate('summary');
}

function disableMutationControls(view) {
    for (const name of [
        'decisions_button', 'terraform_button', 'designation_button', 'automated_development_button',
        'upgrade_ascension_tier_button', 'resettle_button', 'restore_jobs_button',
    ]) {
        for (const control of view.findAll(name)) {
            control.disabled = true;
            control.classList.add('generated-planet-disabled');
            control.title = t('planet.readOnly');
        }
    }
}

export function renderPlanetWindow(container, data = {}, callbacks = {}) {
    ensureStyle();
    const view = mountGui(container, planetViewDefinition, { localize, applyRootPosition: false });
    addGeneratedBackdrop(view.root, data);
    const { colonizable } = selectBaseBranches(view);

    view.localizeAll(localize);
    bindCommonData(view, data);
    bindDistricts(view, colonizable, data);
    bindDetailPages(view, data);
    disableMutationControls(view);
    wireTabs(view);
    addDragHandle(view);
    wireClose(view, callbacks);
    return view;
}

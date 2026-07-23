export const COMPONENT_PLACEHOLDER = '/gfx/interface/icons/ship_parts/ship_part_placeholder.png';

const WEAPON_SLOT_FRAMES = [
    ['EXTRA_LARGE', 8], ['PRIMARY_GUN', 8],
    ['TITANIC', 9],
    ['PLANET_KILLER', 10],
    ['TORPEDO', 7],
    ['POINT_DEFENCE', 3], ['POINT_DEFENSE', 3], ['PD', 3], ['TERTIARY_GUN', 3],
    ['STRIKE_CRAFT', 13], ['HANGAR', 13],
    ['SECONDARY_GUN', 5],
    ['SMALL', 4], ['MEDIUM', 5], ['LARGE', 6],
];

const UTILITY_SLOT_FRAMES = [
    ['AUX', 11], ['SMALL', 0], ['MEDIUM', 1], ['LARGE', 2],
];

export function slotFrameIndex(slot, kind) {
    const name = String(slot || '').toUpperCase();
    const table = kind === 'utility' ? UTILITY_SLOT_FRAMES : WEAPON_SLOT_FRAMES;
    for (const [prefix, frame] of table) {
        if (name.startsWith(prefix)) return frame;
    }
    return kind === 'utility' ? 0 : 4;
}

export function formatShipNumber(value, digits = 0) {
    if (!Number.isFinite(value)) return '—';
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
    return value.toFixed(digits);
}

function setText(element, value) {
    if (!element) return;
    const text = value == null || value === '' ? '—' : String(value);
    element.textContent = text;
    // Keep asynchronous localizeAll() from restoring the .gui placeholder.
    element.dataset.guiText = text;
    delete element.dataset.guiAppendText;
}

function setHidden(element, hidden = true) {
    if (element) element.style.display = hidden ? 'none' : '';
}

function setTooltip(element, text) {
    if (!element) return;
    element.title = text;
    element.setAttribute?.('title', text);
}

function addComponentIcon(element, path) {
    if (!element) return;
    const background = element.style.backgroundImage;
    element.style.backgroundImage = `url("${path}")${background && background !== 'none' ? `, ${background}` : ''}`;
    element.style.backgroundSize = background && background !== 'none'
        ? '100% 100%, 100% 100%'
        : '100% 100%';
    element.style.backgroundRepeat = 'no-repeat';
    element.dataset.componentIcon = path;
}

function componentPath(componentIcons, template) {
    return componentIcons[template] || COMPONENT_PLACEHOLDER;
}

function bindCoreComponent(view, grid, template, index, componentIcons) {
    const instance = view.instantiate('ship_view_required_component_entry', grid, { name: `core-${index}` });
    const icon = view.findIn(instance, 'icon', 'icontype');
    addComponentIcon(icon, componentPath(componentIcons, template));
    setTooltip(instance, template || '—');
}

function bindSlottedComponent(view, grid, component, kind, index, componentIcons) {
    const template = component?.template || '';
    const slot = component?.slot || '';
    const instance = view.instantiate('ship_view_component_entry', grid, { name: `${kind}-${index}` });
    const icon = view.findIn(instance, 'icon', 'icontype');
    const frame = view.findIn(instance, 'icon_bg', 'icontype');
    addComponentIcon(icon, componentPath(componentIcons, template));
    if (frame) {
        const frameIndex = slotFrameIndex(slot, kind);
        frame.style.backgroundPosition = `${(frameIndex / 15) * 100}% 0`;
        frame.dataset.componentSlotFrame = String(frameIndex);
    }
    setTooltip(instance, `${template || '—'}${slot ? ` (${slot})` : ''}`);
}

function bindComponentSection(view, componentSets, templateName, gridName, components, kind, componentIcons) {
    const section = view.instantiate(templateName, componentSets, { name: `${kind}-section` });
    const grid = view.findIn(section, gridName, 'gridboxtype');
    if (!grid) return section;
    for (const [index, component] of components.entries()) {
        bindSlottedComponent(view, grid, component, kind, index, componentIcons);
    }
    return section;
}

export function bindShipViewTextData(view, data = {}) {
    setText(view.find('name'), data.name);
    setText(view.find('type'), data.design_name || data.ship_size);

    const stats = view.find('stats');
    const statValues = {
        hitpoints_value: formatShipNumber(data.max_hitpoints),
        armor_value: formatShipNumber(data.max_armor),
        shields_value: formatShipNumber(data.max_shield),
        speed_value: formatShipNumber(data.speed, 1),
        evasion_value: Number.isFinite(data.evasion) ? `${formatShipNumber(data.evasion, 1)}%` : '—',
        damage_value: formatShipNumber(data.damage, 1),
        rank_value: data.rank || '—',
    };
    for (const [name, value] of Object.entries(statValues)) {
        setText(stats && view.findIn(stats, name), value);
    }
}

export function bindShipViewData(view, data = {}, componentIcons = {}) {
    bindShipViewTextData(view, data);

    const stats = view.find('stats');

    // The GUI only declares the level-0 sprite; do not claim a cloak level until
    // the parser and adapter can select the matching runtime sprite.
    setHidden(stats && view.findIn(stats, 'cloaking'), true);
    setHidden(stats && view.findIn(stats, 'cloaking_level'), true);
    setHidden(stats && view.findIn(stats, 'growth'), true);

    const rename = view.find('rename_button');
    if (rename) {
        rename.disabled = true;
        rename.style.pointerEvents = 'none';
        rename.setAttribute?.('aria-disabled', 'true');
    }

    const components = view.findAll('components', view.root, 'containerwindowtype')[0];
    const coreGrid = components && view.findIn(components, 'components', 'gridboxtype');
    if (coreGrid) {
        for (const [index, value] of (data.core_components || []).entries()) {
            const template = typeof value === 'string' ? value : value?.template || '';
            bindCoreComponent(view, coreGrid, template, index, componentIcons);
        }
    }

    const componentSets = view.find('component_sets');
    if (componentSets) {
        bindComponentSection(
            view, componentSets, 'ship_view_armaments', 'armaments',
            data.weapons || [], 'weapon', componentIcons,
        );
        bindComponentSection(
            view, componentSets, 'ship_view_utilities', 'utilities',
            data.utilities || [], 'utility', componentIcons,
        );
    }
}

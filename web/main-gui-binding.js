import { t } from './app-i18n.js';

const ICON_ROOT = `${import.meta.env?.BASE_URL ?? '/'}gfx/interface/icons/resources/`;
const ROW_HEIGHT = 25;

export const STRATEGIC_CATEGORIES = [
    {
        key: 'RARE_RESOURCES', format: 'default', resources: [
            { key: 'volatile_motes', labelKey: 'resource.volatileMotes' },
            { key: 'exotic_gases', labelKey: 'resource.exoticGases' },
            { key: 'rare_crystals', labelKey: 'resource.rareCrystals' },
            { key: 'living_metal', labelKey: 'resource.livingMetal', icon: 'sr_living_metal' },
            { key: 'zro', labelKey: 'resource.zro', icon: 'sr_zro' },
            { key: 'dark_matter', labelKey: 'resource.darkMatter', icon: 'sr_dark_matter' },
            { key: 'nanites', labelKey: 'resource.nanites' },
        ],
    },
    {
        key: 'EXCEPTIONAL_MATERIALS', format: 'default', onlyIfOwned: true, resources: [
            { key: 'minor_artifacts', labelKey: 'resource.minorArtifacts' },
        ],
    },
];

export const RESEARCH_CATEGORIES = [{
    key: 'RESEARCH', format: 'balance_only', resources: [
        { key: 'physics_research', labelKey: 'resource.physics' },
        { key: 'society_research', labelKey: 'resource.society' },
        { key: 'engineering_research', labelKey: 'resource.engineering' },
    ],
}];

const STRATEGIC_RESOURCES = STRATEGIC_CATEGORIES.flatMap(category => category.resources);
const RESEARCH_RESOURCES = RESEARCH_CATEGORIES.flatMap(category => category.resources);

export const RESOURCE_GROUPS = [
    { name: 'tb_energy_group', type: 'resource', key: 'energy', labelKey: 'resource.energy' },
    { name: 'tb_mineral_group', type: 'resource', key: 'minerals', labelKey: 'resource.minerals' },
    { name: 'tb_food_group', type: 'resource', key: 'food', labelKey: 'resource.food' },
    { name: 'tb_consumer_goods_group', type: 'resource', key: 'consumer_goods', labelKey: 'resource.consumerGoods' },
    { name: 'tb_alloys_group', type: 'resource', key: 'alloys', labelKey: 'resource.alloys' },
    { name: 'tb_trade_group', type: 'resource', key: 'trade', labelKey: 'resource.trade' },
    { name: 'tb_others_group', type: 'composite', keys: STRATEGIC_RESOURCES, labelKey: 'resource.strategic', categories: STRATEGIC_CATEGORIES },
    { name: 'tb_influence_group', type: 'resource', key: 'influence', labelKey: 'resource.influence' },
    { name: 'tb_unity_group', type: 'resource', key: 'unity', labelKey: 'resource.unity' },
    { name: 'tb_research_group', type: 'composite', keys: RESEARCH_RESOURCES, labelKey: 'resource.research', categories: RESEARCH_CATEGORIES },
    { name: 'empire_size_group', type: 'metric', key: 'empire_size', labelKey: 'overview.empireSize' },
    { name: 'leaders_group', type: 'metric', key: 'envoys', labelKey: 'resource.envoys' },
    { name: 'starbase_group', type: 'ratio', numerator: 'num_upgraded_starbase', denominator: 'starbase_capacity', labelKey: 'resource.starbaseCapacity' },
    { name: 'navy_group', type: 'metric', key: 'used_naval_capacity', labelKey: 'resource.navalCapacity' },
];

function numberOrZero(value) {
    return Number.isFinite(value) ? value : 0;
}

function trimFixed(value, digits) {
    return Number(value.toFixed(digits)).toString();
}

export function formatResourceNumber(value) {
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000) return `${trimFixed(value / 1_000_000, 1)}M`;
    if (absolute >= 10_000) return `${trimFixed(value / 1_000, 1)}K`;
    if (absolute >= 1_000) return `${trimFixed(value / 1_000, 2)}K`;
    if (absolute >= 100) return value.toFixed(0);
    if (absolute >= 10) return trimFixed(value, 1);
    return trimFixed(value, 2);
}

export function formatResourceDelta(value) {
    return `${value >= 0 ? '+' : ''}${formatResourceNumber(value)}`;
}

function deltaClass(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
}

export function computeResourceGroup(group, playerInfo = {}, resources = {}, monthly = {}) {
    if (group.type === 'resource') {
        const value = numberOrZero(resources[group.key]);
        const delta = numberOrZero(monthly[group.key]);
        return {
            text: formatResourceNumber(value), delta, className: deltaClass(delta),
            tooltip: `${t(group.labelKey)}: ${formatResourceNumber(value)} (${formatResourceDelta(delta)})`,
        };
    }
    if (group.type === 'composite') {
        const value = group.keys.reduce((sum, resource) => sum + numberOrZero(resources[resource.key]), 0);
        const delta = group.keys.reduce((sum, resource) => sum + numberOrZero(monthly[resource.key]), 0);
        return {
            text: formatResourceNumber(value), delta, className: deltaClass(delta),
            tooltip: group.keys.map(resource => {
                const stored = numberOrZero(resources[resource.key]);
                const balance = numberOrZero(monthly[resource.key]);
                return `${t(resource.labelKey)}: ${formatResourceNumber(stored)} (${formatResourceDelta(balance)})`;
            }).join('\n'),
        };
    }
    if (group.type === 'ratio') {
        const text = `${numberOrZero(playerInfo[group.numerator]).toFixed(0)}/${numberOrZero(playerInfo[group.denominator]).toFixed(0)}`;
        return { text, delta: null, className: '', tooltip: `${t(group.labelKey)}: ${text}` };
    }
    const raw = playerInfo[group.key];
    const text = raw == null ? '—' : formatResourceNumber(numberOrZero(raw));
    return { text, delta: null, className: '', tooltip: `${t(group.labelKey)}: ${text}` };
}

export function visibleResourceCategories(categories, resources = {}) {
    return categories.map(category => ({
        ...category,
        resources: category.resources.filter(resource =>
            !category.onlyIfOwned || numberOrZero(resources[resource.key]) > 0),
    })).filter(category => category.resources.length > 0);
}

export function formatResourceRow(format, stored, balance) {
    if (format === 'balance_only') {
        return { text: formatResourceDelta(balance), className: balance < 0 ? 'negative' : '' };
    }
    return {
        text: `${formatResourceNumber(stored)}${balance < 0 ? ' ' : '+'}${formatResourceNumber(balance)}`,
        className: balance < 0 ? 'negative' : '',
    };
}

function findIn(view, scope, name, type = null) {
    return view.findIn(scope, name, type);
}

function setAmount(element, value) {
    element.textContent = value.text + (value.delta == null ? '' : ` ${formatResourceDelta(value.delta)}`);
    element.classList.add('generated-main-amount');
    element.classList.toggle('positive', value.className === 'positive');
    element.classList.toggle('negative', value.className === 'negative');
}

function setResourceIcon(element, icon) {
    element.style.backgroundImage = `url("${ICON_ROOT}${icon}.webp")`;
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = 'contain';
}

function populateDropdown(view, group, categories, resources, monthly) {
    const panel = findIn(view, group, 'expanded_window', 'expandedwindow');
    const grid = panel && findIn(view, panel, 'resources', 'gridboxtype');
    if (!panel || !grid) throw new Error(`${group.dataset.guiName} is missing its generated dropdown nodes`);

    const visible = visibleResourceCategories(categories, resources);
    grid.replaceChildren();
    for (const category of visible) {
        for (const resource of category.resources) {
            const row = view.instantiate('single_resource_entry', grid, { name: resource.key });
            row.classList.add('generated-main-dropdown-row');
            row.title = t(resource.labelKey);
            row.setAttribute('aria-label', t(resource.labelKey));
            const icon = findIn(view, row, 'icon', 'icontype');
            const amount = findIn(view, row, 'amount', 'instanttextboxtype');
            setResourceIcon(icon, resource.icon || resource.key);
            const formatted = formatResourceRow(
                category.format,
                numberOrZero(resources[resource.key]),
                numberOrZero(monthly[resource.key]),
            );
            setAmount(amount, { ...formatted, delta: null });
        }
    }

    const separator = findIn(view, panel, 'bg_separator', 'icontype');
    const firstCategorySize = visible[0]?.resources.length || 0;
    if (separator) {
        const showSeparator = visible.length > 1;
        separator.hidden = !showSeparator;
        separator.style.display = showSeparator ? '' : 'none';
        separator.style.left = '3px';
        separator.style.top = `${3 + firstCategorySize * ROW_HEIGHT}px`;
        separator.style.width = '94px';
    }
    const rowCount = visible.reduce((sum, category) => sum + category.resources.length, 0);
    panel.style.height = `${Math.max(6, rowCount * ROW_HEIGHT + 6)}px`;
    grid.style.height = `${rowCount * ROW_HEIGHT}px`;
    return panel;
}

function panelPosition(panel, visible) {
    const pair = visible ? panel.__guiNode.props.show_position : panel.__guiNode.props.hide_position;
    if (!pair) return;
    panel.style.left = `${Number(pair.x || 0)}px`;
    panel.style.top = `${Number(pair.y || 0)}px`;
}

export function bindMainGuiData(view, playerInfo = {}) {
    const resources = playerInfo.resources || {};
    const monthly = playerInfo.monthly_resources || {};
    view.find('tb_biomass_group')?.remove();

    const dropdowns = [];
    for (const definition of RESOURCE_GROUPS) {
        const group = view.find(definition.name);
        if (!group) throw new Error(`main.gui is missing ${definition.name}`);
        group.classList.add('generated-main-resource-group');
        const amount = findIn(view, group, 'amount', 'instanttextboxtype');
        const value = computeResourceGroup(definition, playerInfo, resources, monthly);
        setAmount(amount, value);
        group.title = value.tooltip;

        if (definition.categories) {
            group.classList.add('generated-main-dropdown');
            group.tabIndex = 0;
            group.setAttribute('role', 'button');
            group.setAttribute('aria-expanded', 'false');
            const panel = populateDropdown(view, group, definition.categories, resources, monthly);
            panelPosition(panel, false);
            panel.hidden = true;
            panel.style.display = 'none';
            dropdowns.push({ group, panel });
        }
    }

    let open = null;
    function close(entry = open) {
        if (!entry) return;
        entry.panel.hidden = true;
        entry.panel.style.display = 'none';
        panelPosition(entry.panel, false);
        entry.group.setAttribute('aria-expanded', 'false');
        if (open === entry) open = null;
    }
    function toggle(entry) {
        if (open === entry) return close(entry);
        close();
        entry.panel.hidden = false;
        entry.panel.style.display = '';
        panelPosition(entry.panel, true);
        entry.group.setAttribute('aria-expanded', 'true');
        open = entry;
    }

    const listeners = [];
    for (const entry of dropdowns) {
        const click = event => {
            if (entry.panel.contains(event.target)) return;
            toggle(entry);
        };
        const keydown = event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggle(entry);
        };
        entry.group.addEventListener('click', click);
        entry.group.addEventListener('keydown', keydown);
        listeners.push(() => {
            entry.group.removeEventListener('click', click);
            entry.group.removeEventListener('keydown', keydown);
        });
    }
    const outside = event => {
        if (!open || open.group.contains(event.target) || open.panel.contains(event.target)) return;
        close();
    };
    document.addEventListener('click', outside);

    return () => {
        close();
        document.removeEventListener('click', outside);
        for (const remove of listeners) remove();
    };
}

// UI Components: Resource Bar and Status Bar

const ICON_ROOT = `${import.meta.env.BASE_URL}gfx/interface/icons/`;
const resourceIcon = (name) => `${ICON_ROOT}resources/${name}.webp`;

const STRATEGIC_RESOURCES = [
    { key: 'volatile_motes', label: '易爆微粒' },
    { key: 'exotic_gases', label: '异星天然气' },
    { key: 'rare_crystals', label: '稀有水晶' },
    { key: 'living_metal', label: '活体金属' },
    { key: 'zro', label: '泽珞' },
    { key: 'dark_matter', label: '暗物质' },
    { key: 'nanites', label: '纳米机器人' },
    { key: 'minor_artifacts', label: '稀有文物' },
];

const RESEARCH_RESOURCES = [
    { key: 'society_research', label: '社会学研究' },
    { key: 'physics_research', label: '物理学研究' },
    { key: 'engineering_research', label: '工程学研究' },
];

const HEADER_ITEMS = [
    { type: 'resource', key: 'energy', label: '能量币', icon: resourceIcon('energy'), group: 0 },
    { type: 'resource', key: 'minerals', label: '矿物', icon: resourceIcon('minerals'), group: 0 },
    { type: 'resource', key: 'food', label: '食物', icon: resourceIcon('food'), group: 0 },

    { type: 'resource', key: 'consumer_goods', label: '消费品', icon: resourceIcon('consumer_goods'), group: 1 },
    { type: 'resource', key: 'alloys', label: '合金', icon: resourceIcon('alloys'), group: 1 },
    { type: 'resource', key: 'trade', label: '贸易额', icon: resourceIcon('trade'), group: 1 },
    { type: 'composite', keys: STRATEGIC_RESOURCES, label: '战略资源', icon: resourceIcon('strategic'), group: 1 },

    { type: 'resource', key: 'influence', label: '影响力', icon: resourceIcon('influence'), group: 2 },
    { type: 'resource', key: 'unity', label: '凝聚力', icon: resourceIcon('unity'), group: 2 },
    { type: 'composite', keys: RESEARCH_RESOURCES, label: '研究', icon: `${ICON_ROOT}research_icon.webp`, group: 2 },

    { type: 'metric', key: 'empire_size', label: '帝国规模', icon: `${ICON_ROOT}empire_sprawl_icon.webp`, group: 3 },
    { type: 'metric', key: 'envoys', label: '使节', icon: resourceIcon('diplomatic_weight'), group: 3 },
    { type: 'ratio', numerator: 'num_upgraded_starbase', denominator: 'starbase_capacity', label: '升级恒星基地', icon: `${ICON_ROOT}station_icon.webp`, group: 3 },
    { type: 'metric', key: 'used_naval_capacity', label: '已用海军容量', icon: `${ICON_ROOT}fleet_size_icon.webp`, group: 3 },
];

export function renderResourceBar(container, playerInfo) {
    if (!playerInfo || !playerInfo.resources) {
        container.innerHTML = '<span style="color:var(--text-secondary)">无资源数据</span>';
        return;
    }

    const resources = playerInfo.resources;
    const monthly = playerInfo.monthly_resources || {};
    container.innerHTML = HEADER_ITEMS.map((item, index) => {
        const separator = index > 0 && HEADER_ITEMS[index - 1].group !== item.group
            ? '<span class="resource-separator" aria-hidden="true"></span>'
            : '';
        return separator + renderHeaderItem(item, playerInfo, resources, monthly);
    }).join('');
}

function renderHeaderItem(item, playerInfo, resources, monthly) {
    let value;
    let delta = null;
    let details = '';

    if (item.type === 'resource') {
        value = numberOrZero(resources[item.key]);
        delta = numberOrZero(monthly[item.key]);
        details = `${item.label}: ${formatNum(value)} (${formatDelta(delta)})`;
    } else if (item.type === 'composite') {
        value = sumKeys(resources, item.keys);
        delta = sumKeys(monthly, item.keys);
        details = item.keys.map(entry => {
            const current = numberOrZero(resources[entry.key]);
            const change = numberOrZero(monthly[entry.key]);
            return `${entry.label}: ${formatNum(current)} (${formatDelta(change)})`;
        }).join('\n');
    } else if (item.type === 'ratio') {
        value = `${numberOrZero(playerInfo[item.numerator]).toFixed(0)}/${numberOrZero(playerInfo[item.denominator]).toFixed(0)}`;
        details = `${item.label}: ${value}`;
    } else {
        const rawValue = playerInfo[item.key];
        value = rawValue == null ? '—' : formatNum(numberOrZero(rawValue));
        details = `${item.label}: ${value}`;
    }

    return `
        <div class="resource-item" title="${escAttr(details)}">
            <img class="resource-icon" src="${item.icon}" alt="">
            <span class="resource-value ${deltaClass(delta)}">${typeof value === 'number' ? formatNum(value) : value}${delta == null ? '' : formatDelta(delta)}</span>
        </div>
    `;
}

function sumKeys(values, keys) {
    return keys.reduce((sum, entry) => sum + numberOrZero(values[entry.key]), 0);
}

function numberOrZero(value) {
    return Number.isFinite(value) ? value : 0;
}

function formatDelta(value) {
    const sign = value >= 0 ? '+' : '';
    return sign + formatNum(value);
}

function deltaClass(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
}

export function renderStatusBar(dateEl, empireEl, playerInfo) {
    if (!playerInfo) return;
    dateEl.textContent = playerInfo.date || '';
    const govLabel = getGovLabel(playerInfo.government_type);
    empireEl.textContent = `${playerInfo.name} — ${govLabel}`;
}

function formatNum(n) {
    const abs = Math.abs(n);
    if (abs >= 1000000) return `${trimFixed(n / 1000000, 1)}M`;
    if (abs >= 10000) return `${trimFixed(n / 1000, 1)}K`;
    if (abs >= 1000) return `${trimFixed(n / 1000, 2)}K`;
    if (abs >= 100) return n.toFixed(0);
    if (abs >= 10) return trimFixed(n, 1);
    return trimFixed(n, 2);
}

function trimFixed(value, digits) {
    return value.toFixed(digits).replace(/\.?0+$/, '');
}

function getGovLabel(govType) {
    if (!govType) return t('common.unknown');
    const localized = resolveGameLocalization(govType);
    return localized === govType ? govType : localized.replace(/§./g, '');
}

function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
import { resolveGameLocalization } from './game-localization.js';
import { t } from './app-i18n.js';

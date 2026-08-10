// resource-bar-v2.js — 严格按 interface/main.gui 的 topbar_static + 相关 .gfx 转写的顶部资源栏。
//
// 布局来源（main.gui）：
//   topbar_static 容器 @(57,0)；每个资源组 70x36，组内：
//     background = GFX_topbar_button_narrow_hover (topbar_main_button_70_36.dds, noOfFrames=2: 常态/悬停)
//     icon       @ (26,2)   —— 18x18 资源图标，26+9=35 恰好水平居中
//     amount     @ (0,17)   —— cg_16b(=Chinese_normal 14px)，maxWidth 70，居中
//   分隔线 containerWindowType @(216/500/714, 2)，8 x 75%，底图 GFX_vertical_divider(vertical_line 1x30)
//   战略资源(426)与研究(640)是 dropDownBoxType，带 expand_arrow @(44,10)（GFX_direction_down → resolutiuon_direction_down 17x10, scale 0.7）
//     各自的 expandedWindow（点击展开明细面板）：show_position (0,36)/(0,35)，宽 100，
//     底图 GFX_subwindow_tile_plain_solid，gridBoxType "resources" 行高 25；
//     战略面板含 bg_separator 分隔 RARE_RESOURCES / EXCEPTIONAL_MATERIALS 两分类。
//     面板行数据来自 interface/resource_groups/*.txt + RESOURCE_GROUP_* 本地化；点击组展开/收起，点别处收起。
//   leaders_group(784, 使节) background = GFX_invisible → 无按钮底图
// 顶栏背景：GFX_topbar_background (topbar_background.dds 36x36, corneredTile borderSize 8) → 9-slice
//
// 与游戏一致：顶栏高 36px（原页面为 47px），挂载后通过 :has() 同步收窄 sidebar/overview-panel 的 top。
// 数据模型沿用 ui-components.js 的 playerInfo.resources / monthly_resources。

import { STRATEGIC_CATEGORIES, RESEARCH_CATEGORIES, createPanelController } from './resource-panel-v2.js';

const ICON_ROOT = `${import.meta.env.BASE_URL}gfx/interface/icons/`;
const GFX = `${import.meta.env.BASE_URL}gfx/interface/`;
// main.gui topbar_static position x=57：资源组与面板都以此为基准偏移
const TOPBAR_STATIC_LEFT = 57;

// 顶栏合计沿用扁平列表（与 ui-components.js 一致）；
// 明细面板的分类数据与渲染在 resource-panel-v2.js。
const STRATEGIC_RESOURCES = STRATEGIC_CATEGORIES.flatMap(c => c.resources);
const RESEARCH_RESOURCES = RESEARCH_CATEGORIES.flatMap(c => c.resources);

// gui 组定义：x 为 main.gui 中组在 topbar_static 内的横坐标；icon 为贴图相对 icons/ 的路径。
// size = 原生像素，scale = gui 的 scale 系数（显示尺寸 = size*scale，定位仍按 gui 的 left:26 top:2）。
const GROUPS = [
    { x: 2,   type: 'resource', key: 'energy',         label: '能量币',   icon: 'resources/energy' },
    { x: 72,  type: 'resource', key: 'minerals',       label: '矿物',     icon: 'resources/minerals' },
    { x: 142, type: 'resource', key: 'food',           label: '食物',     icon: 'resources/food' },
    { x: 216, divider: true },
    { x: 216, type: 'resource', key: 'consumer_goods', label: '消费品',   icon: 'resources/consumer_goods' },
    { x: 286, type: 'resource', key: 'alloys',         label: '合金',     icon: 'resources/alloys' },
    { x: 356, type: 'resource', key: 'trade',          label: '贸易额',   icon: 'resources/trade' },
    { x: 426, type: 'composite', keys: STRATEGIC_RESOURCES, label: '战略资源', icon: 'resources/strategic', dropdown: true, panelCategories: STRATEGIC_CATEGORIES, panelTop: 36 },
    { x: 500, divider: true },
    { x: 500, type: 'resource', key: 'influence',      label: '影响力',   icon: 'resources/influence' },
    { x: 570, type: 'resource', key: 'unity',          label: '凝聚力',   icon: 'resources/unity' },
    { x: 640, type: 'composite', keys: RESEARCH_RESOURCES, label: '研究', icon: 'research_icon', size: 22, scale: 0.9, dropdown: true, panelCategories: RESEARCH_CATEGORIES, panelTop: 35 },
    { x: 714, divider: true },
    { x: 714, type: 'metric', key: 'empire_size',      label: '帝国规模', icon: 'empire_sprawl_icon', size: 25, scale: 0.8 },
    { x: 784, type: 'metric', key: 'envoys',           label: '使节',     icon: 'diplomacy/diplomacy_envoy', size: 33, scale: 0.65, noBg: true }, // gui: GFX_envoy_icon(diplomacy_envoy 33x33, scale 0.65)
    { x: 854, type: 'ratio', numerator: 'num_upgraded_starbase', denominator: 'starbase_capacity', label: '升级恒星基地', icon: 'station_icon', size: 20 },
    { x: 924, type: 'metric', key: 'used_naval_capacity', label: '已用海军容量', icon: 'fleet_size_icon', size: 19 },
];

const STYLE_ID = 'resource-bar-v2-style';
const CSS = `
/* --- 挂载后收窄宿主容器并同步下方布局（仅当 v2 在位时生效，便于回滚） --- */
#resource-bar:has(> .rb2-root) {
    height: 36px; padding: 0; display: block; overflow: visible;
    box-shadow: 0 2px 13px #000;
}
#resource-bar:has(> .rb2-root)::before { content: none; }
#resource-bar:has(> .rb2-root) ~ #sidebar { top: 36px; }
#resource-bar:has(> .rb2-root) ~ #overview-panel { top: 36px; }

.rb2-root { position: absolute; inset: 0; overflow: hidden; }

/* GFX_topbar_background: corneredTile borderSize 8 → 9-slice（border 简写拆三条，见指南） */
.rb2-bg {
    position: absolute; inset: 0; box-sizing: border-box;
    border-style: solid; border-width: 8px; border-color: transparent;
    border-image: url('${GFX}main/topbar_background.webp') 8 fill;
    pointer-events: none;
}

/* topbar_static @(57,0) */
.rb2-static { position: absolute; left: ${TOPBAR_STATIC_LEFT}px; top: 0; height: 36px; }

/* 资源组 70x36；底图 topbar_main_button_70_36.webp 为 2 帧条图(140x36)：帧1常态 / 帧2悬停 */
.rb2-group { position: absolute; top: 0; width: 70px; height: 36px; }
.rb2-group-bg {
    position: absolute; inset: 0;
    background: url('${GFX}buttons/topbar_main_button_70_36.webp') 0% 0 / 200% 100% no-repeat;
}
.rb2-group:hover .rb2-group-bg { background-position: 100% 0; }

/* icon @ (26,2)；18x18 时 26+9=35 恰为 70/2 居中 */
.rb2-icon { position: absolute; left: 26px; top: 2px; }

/* amount @ (0,17) maxWidth 70 居中；cg_16b = Chinese_normal 14px */
.rb2-amount {
    position: absolute; left: 0; top: 17px; width: 70px; height: 16px;
    line-height: 16px; text-align: center; white-space: nowrap;
    font-size: 14px; font-weight: 500; color: var(--text-primary, #d9f0e8);
    text-shadow: 0 1px 2px #000;
}
.rb2-amount.positive { color: #8ce19d; }
.rb2-amount.negative { color: #ef766d; }
.rb2-delta { font-size: 10px; margin-left: 2px; opacity: .9; }

/* 分隔线 @(216/500/714,2) 8 x 75%，底图 vertical_line(1x30) 居中拉伸 */
.rb2-divider {
    position: absolute; top: 2px; width: 8px; height: 75%;
    background: url('${GFX}vertical_line.webp') center / 1px 100% no-repeat;
    pointer-events: none;
}

/* expand_arrow @(44,10)：GFX_direction_down(resolutiuon_direction_down 17x10, scale 0.7 → 约 12x7) */
.rb2-arrow {
    position: absolute; left: 44px; top: 10px; width: 12px; height: 7px;
    pointer-events: none;
}
`;

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

function numberOrZero(value) {
    return Number.isFinite(value) ? value : 0;
}

function trimFixed(n, digits) {
    return Number(n.toFixed(digits)).toString();
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

function formatDelta(value) {
    return (value >= 0 ? '+' : '') + formatNum(value);
}

function deltaClass(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
}

function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 计算某组的展示值 / 增量 / tooltip（逻辑与 ui-components.renderHeaderItem 对齐）
function computeGroup(group, playerInfo, resources, monthly) {
    if (group.type === 'resource') {
        const value = numberOrZero(resources[group.key]);
        const delta = numberOrZero(monthly[group.key]);
        return {
            text: formatNum(value),
            delta,
            cls: deltaClass(delta),
            tooltip: `${group.label}: ${formatNum(value)} (${formatDelta(delta)})`,
        };
    }
    if (group.type === 'composite') {
        const value = group.keys.reduce((s, e) => s + numberOrZero(resources[e.key]), 0);
        const delta = group.keys.reduce((s, e) => s + numberOrZero(monthly[e.key]), 0);
        const tooltip = group.keys
            .map(e => `${e.label}: ${formatNum(numberOrZero(resources[e.key]))} (${formatDelta(numberOrZero(monthly[e.key]))})`)
            .join('\n');
        return { text: formatNum(value), delta, cls: deltaClass(delta), tooltip };
    }
    if (group.type === 'ratio') {
        const num = numberOrZero(playerInfo[group.numerator]);
        const den = numberOrZero(playerInfo[group.denominator]);
        const text = `${num.toFixed(0)}/${den.toFixed(0)}`;
        return { text, delta: null, cls: '', tooltip: `${group.label}: ${text}` };
    }
    // metric
    const raw = playerInfo[group.key];
    const text = raw == null ? '—' : formatNum(numberOrZero(raw));
    return { text, delta: null, cls: '', tooltip: `${group.label}: ${text}` };
}

function iconTag(group) {
    const native = group.size || 18;
    const px = Math.round(native * (group.scale || 1));
    return `<img class="rb2-icon" src="${ICON_ROOT}${group.icon}.webp" width="${px}" height="${px}" alt="">`;
}

function groupHtml(group, playerInfo, resources, monthly) {
    if (group.divider) {
        return `<div class="rb2-divider" style="left:${group.x}px" aria-hidden="true"></div>`;
    }
    const { text, delta, cls, tooltip } = computeGroup(group, playerInfo, resources, monthly);
    const deltaHtml = delta == null ? '' : `<span class="rb2-delta">${formatDelta(delta)}</span>`;
    const dropAttrs = group.dropdown ? ` data-dropdown data-x="${group.x}"` : '';
    return `
        <div class="rb2-group" style="left:${group.x}px"${dropAttrs} title="${escAttr(tooltip)}">
            ${group.noBg ? '' : '<div class="rb2-group-bg"></div>'}
            ${iconTag(group)}
            <div class="rb2-amount ${cls}">${text}${deltaHtml}</div>
            ${group.dropdown ? `<img class="rb2-arrow" src="${GFX}galacticCommunity/resolutiuon_direction_down.webp" alt="" aria-hidden="true">` : ''}
        </div>`;
}

// 明细面板控制器按 container 惰性创建、跨重绘复用（渲染/显隐在 resource-panel-v2.js）。
function getPanelController(container) {
    if (!container._rb2Panel) container._rb2Panel = createPanelController(container);
    return container._rb2Panel;
}

// 事件委托：container(#resource-bar) 只绑定一次。本文件只做事件路由与坐标换算
// （show_position x=0 相对组 → 页面 left = TOPBAR_STATIC_LEFT + 组 x；top = group.panelTop），
// 面板的生成与显隐交给 resource-panel-v2.js 的控制器。
function bindDropdowns(container) {
    if (container._rb2Bound) return;
    container._rb2Bound = true;
    const controller = getPanelController(container);
    container.addEventListener('click', event => {
        const groupEl = event.target.closest('.rb2-group[data-dropdown]');
        if (!groupEl) return;
        const group = GROUPS.find(g => g.dropdown && g.x === Number(groupEl.dataset.x));
        const playerInfo = container._rb2PlayerInfo;
        if (!group || !playerInfo || !playerInfo.resources) return;
        controller.toggle(
            group.panelCategories,
            { left: TOPBAR_STATIC_LEFT + group.x, top: group.panelTop },
            playerInfo.resources,
            playerInfo.monthly_resources || {},
        );
    });
    document.addEventListener('click', event => {
        if (event.target.closest('.rb2-panel')) return;
        if (event.target.closest('.rb2-group[data-dropdown]')) return;
        controller.hide();
    });
}

export function renderResourceBar(container, playerInfo) {
    injectStyle();

    if (!playerInfo || !playerInfo.resources) {
        container.innerHTML = '<div class="rb2-root"><div class="rb2-bg"></div></div>';
        return;
    }

    // 重绘会移除已展开的面板，先经控制器关闭以复位其内部状态；保留最新数据供展开时使用
    getPanelController(container).hide();
    container._rb2PlayerInfo = playerInfo;

    const resources = playerInfo.resources;
    const monthly = playerInfo.monthly_resources || {};
    const groups = GROUPS.map(g => groupHtml(g, playerInfo, resources, monthly)).join('');

    container.innerHTML = `
        <div class="rb2-root">
            <div class="rb2-bg"></div>
            <div class="rb2-static">${groups}</div>
        </div>`;

    bindDropdowns(container);
}

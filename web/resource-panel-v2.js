// resource-panel-v2.js — 顶栏"战略资源 / 研究"下拉明细面板（main.gui expandedWindow）的独立组件。
//
// 布局来源（main.gui expandedWindow）：
//   show_position (0,36)/(0,35)（相对所属组），宽 100，底图 GFX_subwindow_tile_plain_solid，
//   gridBoxType "resources" @(3,3) 行高 25，resizeparent=yes（宽度交给内容）；
//   战略面板含 bg_separator 分隔 RARE_RESOURCES / EXCEPTIONAL_MATERIALS 两分类。
// 行数据来自 interface/resource_groups/*.txt + RESOURCE_GROUP_* 本地化：
//   topbar_other_resource_groups.txt  → RARE_RESOURCES + EXCEPTIONAL_MATERIALS(show_only_if_owned)
//   topbar_research_resource_groups.txt → RESEARCH
// 数值格式（本地化 RESOURCE_GROUP_* 键）：
//   default      → "$STORED$+$BALANCE$"（负增量用空格分隔并标红，对应 RESOURCE_GROUP_DEFAULT_NEG）
//   balance_only → "+$BALANCE$"（科研，对应 RESOURCE_GROUP_BALANCE_ONLY）
//
// 本模块只负责面板的"数据 + 渲染 + 显隐"，不绑定任何 DOM 事件——
// 事件委托由调用方（resource-bar-v2.js）持有，因为下拉组属于顶栏。
// 名称与 localisation/simp_chinese 对齐；living_metal/zro/dark_matter 存档键无 sr_ 前缀，
// 但图标文件带 sr_ 前缀（sr_living_metal.webp 等），故需 icon 覆盖。

import { t } from './app-i18n.js';

const ICON_ROOT = `${import.meta.env.BASE_URL}gfx/interface/icons/`;
const GFX = `${import.meta.env.BASE_URL}gfx/interface/`;

// 战略资源明细分类（topbar_other_resource_groups.txt）
export const STRATEGIC_CATEGORIES = [
    {
        key: 'RARE_RESOURCES', labelKey: 'resource.rare', format: 'default',
        resources: [
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
        key: 'EXCEPTIONAL_MATERIALS', labelKey: 'resource.exceptional', format: 'default', onlyIfOwned: true,
        resources: [
            { key: 'minor_artifacts', labelKey: 'resource.minorArtifacts' },
            // astral_threads(星界丝缕)/entropy_crystals(结晶熵) 在 txt 中但 parser 未导出，暂略
        ],
    },
];

// 研究明细分类（topbar_research_resource_groups.txt）
export const RESEARCH_CATEGORIES = [
    {
        key: 'RESEARCH', labelKey: 'resource.research', format: 'balance_only',
        resources: [
            { key: 'physics_research', labelKey: 'resource.physics' },
            { key: 'society_research', labelKey: 'resource.society' },
            { key: 'engineering_research', labelKey: 'resource.engineering' },
        ],
    },
];

const PANEL_STYLE_ID = 'resource-panel-v2-style';
const PANEL_CSS = `
/* --- expandedWindow：点击战略资源/研究组展开的明细面板（main.gui expandedWindow） ---
   背景 GFX_subwindow_tile_plain_solid(180x180, borderSize 80)——贴图本身是纯色+细边框，
   80px 圆角无法套在 100px 宽面板上，故整体拉伸；grid 起点 (3,3) 用 padding 还原。
   行 slotsize 100% x 25；resizeparent=yes → 宽度交给内容(width:max-content, min 100)。 */
.rb2-panel {
    position: absolute; z-index: 200; box-sizing: border-box;
    min-width: 100px; width: max-content; padding: 3px;
    background: url('${GFX}tiles/subwindow_tile_plain_solid.webp') 0 0 / 100% 100% no-repeat;
}
.rb2-panel-row {
    display: flex; align-items: center; gap: 4px;
    height: 25px; padding: 0 8px 0 3px; white-space: nowrap;
    font-size: 14px; color: var(--text-primary, #d9f0e8);
}
.rb2-row-icon { width: 20px; height: 20px; flex: 0 0 auto; }
.rb2-row-name { text-shadow: 0 1px 2px #000; }
.rb2-row-amount { margin-left: auto; padding-left: 14px; text-shadow: 0 1px 2px #000; }
.rb2-row-amount.negative { color: #ef766d; }
/* bg_separator：GFX_subwindow_tile_plain_solid_separator(180x1) 横向分隔线 */
.rb2-panel-separator {
    height: 1px; margin: 2px 3px;
    background: url('${GFX}tiles/subwindow_tile_plain_solid_separator.webp') 0 0 / 100% 100% no-repeat;
}
`;

function injectPanelStyle() {
    if (document.getElementById(PANEL_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PANEL_STYLE_ID;
    style.textContent = PANEL_CSS;
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

// 面板内单行数值格式（对应本地化 RESOURCE_GROUP_* 键）。
function formatRowAmount(format, stored, balance) {
    if (format === 'balance_only') {
        const negative = balance < 0;
        return { text: (negative ? '' : '+') + formatNum(balance), cls: negative ? 'negative' : '' };
    }
    const negative = balance < 0;
    return { text: `${formatNum(stored)}${negative ? ' ' : '+'}${formatNum(balance)}`, cls: negative ? 'negative' : '' };
}

// 生成明细面板 HTML。
//   categories : 分类数组（STRATEGIC_CATEGORIES / RESEARCH_CATEGORIES 结构）
//   anchor     : { left, top }，面板绝对定位坐标（show_position 已由调用方换算为页面坐标）
//   resources  : 当前存量 { key: value }
//   monthly    : 月度增量 { key: value }
export function panelHtml(categories, anchor, resources, monthly) {
    injectPanelStyle();
    let rows = '';
    let hasPrevCategory = false;
    for (const category of categories) {
        const visible = category.resources.filter(
            r => !category.onlyIfOwned || numberOrZero(resources[r.key]) > 0,
        );
        if (visible.length === 0) continue;
        if (hasPrevCategory) rows += '<div class="rb2-panel-separator" aria-hidden="true"></div>';
        hasPrevCategory = true;
        for (const r of visible) {
            const stored = numberOrZero(resources[r.key]);
            const balance = numberOrZero(monthly[r.key]);
            const amount = formatRowAmount(category.format, stored, balance);
            const icon = r.icon || r.key;
            rows += `
            <div class="rb2-panel-row">
                <img class="rb2-row-icon" src="${ICON_ROOT}resources/${icon}.webp" alt="">
                <span class="rb2-row-name">${t(r.labelKey)}</span>
                <span class="rb2-row-amount ${amount.cls}">${amount.text}</span>
            </div>`;
        }
    }
    return `<div class="rb2-panel" style="left:${anchor.left}px;top:${anchor.top}px">${rows}
        </div>`;
}

// 面板显隐控制器。host 为面板挂载的父元素（#resource-bar，overflow:visible）。
// 被动对象：不绑定任何事件，调用方自行决定何时 show/hide/toggle。
// 同一 host 同一时刻至多一个面板；以 anchor.left 作为面板身份（对应组 x）。
export function createPanelController(host) {
    let openEl = null;
    let openKey = null;

    function hide() {
        if (openEl) {
            openEl.remove();
            openEl = null;
            openKey = null;
        }
    }

    function show(categories, anchor, resources, monthly) {
        hide();
        const html = panelHtml(categories, anchor, resources, monthly);
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const panel = holder.firstElementChild;
        host.appendChild(panel);
        openEl = panel;
        openKey = anchor.left;
    }

    function toggle(categories, anchor, resources, monthly) {
        if (openEl && openKey === anchor.left) {
            hide();
            return;
        }
        show(categories, anchor, resources, monthly);
    }

    return {
        show,
        hide,
        toggle,
        get isOpen() { return openEl != null; },
    };
}

// ship-window-v2.js
// 严格依照 web/assets/interface/ship_view.gui + 相关 .gfx 定义实现的舰船详情窗口。
// 实验目的：验证 gui/gfx 是否已完全确定 UI。
//
// 与 gui 的对应关系（ship_view.gui 650x650, clipping, moveable）：
//   background  GFX_tile_outliner_bg        → outliner.gfx   corneredTile borderSize 80x30 → 9-slice
//   hex_bg      GFX_hex_bg                  → planet_view.gfx  planet_view_hex_bg.png 340x68 @(-15,-15)
//   empire_header_line GFX_line_long        → planet_view.gfx  line_long.png 512x17 @(6,22)
//   name        font malgun_goth_24         → fonts.gfx simp_chinese 覆盖 = Chinese_header 20px
//   type        font cg_16b, color code "E" → fonts.gfx simp_chinese 覆盖 = Chinese_normal 14px；§E 为引擎内置淡蓝
//   close       GFX_close_square 3帧        → planet_view.gfx  close_button_square.png 114x38 (38x38/帧) UPPER_RIGHT(-40,11)
//   ship_model  348x120 @(15,65)，3d_icon=GFX_dummy_3d_ship_details(rendertarget着色器)
//               → 游戏内此处是3D渲染目标，gui/gfx 只确定底图 ship_design_entry_bg.png（拉伸至348x120）
//   stats       260x220 @(-15,65) upper_right，底图 GFX_tiles_dark_area_cut_8 borderSize 8
//   components  358x78 @(10,195)，grid 58x78 x6列，格子=ship_view_required_component_entry
//   component_sets smoothListbox 630x320 @(10,292)，装 ship_view_armaments / ship_view_utilities（各630x150）
//               格子=ship_view_component_entry：icon_bg=GFX_ship_designer_slot(16帧,60x58) + icon=GFX_ship_part_background(58x58)
//   buttons     @(0,588)：open_designer x=48 / open_fleet_manager x=338（按游戏实际布局取左边距）
//               GFX_standard_button_240_34_button → button_240_34_animated.png 792x60 (264x60/帧, 3帧)
//
// gui/gfx 无法确定、由运行时代码决定的部分（本实现按游戏行为补齐）：
//   - 3d_icon 内容（rendertarget，只显示底图）
//   - ship_designer_slot 的帧选择（游戏按槽位尺寸选帧；这里按存档槽位名推导，见 slotFrameIndex）
//   - cloaking_level 图标帧（固定 GFX_cloaking_level_0）
//   - 组件图标精灵（由存档数据 + component_templates→icons.gfx 映射链决定，经 virtual:stellaris-component-icons 提供）
//   - stats 的 growth 子容器（生物发生舰专属，代码控制显隐）→ 不渲染
//   - rank/cloaking 数值文本（代码填充；存档未提供该字段时显示 —）
//   - component_sets 滚动：改为武器/通用分区内部滚动，窗口整体不滚动

import componentIcons from 'virtual:stellaris-component-icons';
import loadLocalization from 'virtual:stellaris-localization';

// ---- 本地化（与 main.js 共用同一 virtual 模块；窗口打开时必然已解析完） ----
let strings = {};
loadLocalization().then(s => { strings = s; });

function t(key, fallback) {
    return strings[key] ?? fallback ?? key;
}

// texticons.gfx: GFX_text_<name> → gfx/interface/icons/ship_stats/<file>.dds
const TEXT_ICON_FILES = {
    ship_stats_hitpoints: 'hit_points',
    ship_stats_armor: 'armor',
    ship_stats_shield: 'shield',
    ship_stats_speed: 'speed',
    ship_stats_evasion: 'evasion',
    ship_stats_damage: 'damage',
    ship_stats_special: 'special',
    ship_stats_cloaking_strength: 'cloaking_strength',
};

// 解析本地化串：展开 $VAR$ 引用与 £icon£ 文本图标（如 SHIP_STAT_HITPOINTS_INLINE）
function loc(key, fallback) {
    let s = t(key, fallback);
    s = s.replace(/\$([A-Z0-9_]+)\$/g, (_, k) => strings[k] ?? k);
    return s.replace(/£([a-z0-9_]+)£/g, (_, name) => {
        const file = TEXT_ICON_FILES[name];
        return file ? `<img class="sv2-texticon" src="/gfx/interface/icons/ship_stats/${file}.png" alt="">` : '';
    });
}

const PLACEHOLDER = '/gfx/interface/icons/ship_parts/ship_part_placeholder.png';

// ---- 必要样式：全部尺寸/坐标取自 ship_view.gui，贴图取自各 .gfx 定义 ----
const CSS = `
#ship-window:has(> .sv2-root) {
    width: auto; min-width: 0; max-width: none;
    border: 0; background: none; box-shadow: none; overflow: visible;
}
.sv2-root {
    position: relative; width: 650px; height: 650px; overflow: hidden;
    font-family: "Malgun Gothic", "Microsoft YaHei", sans-serif;
    color: #fff; user-select: none;
}
.sv2-root img { display: block; }
/* gui moveable=yes：复用 main.js 的 .popup-header 拖拽机制；覆盖 style.css 中 .popup-header 的 flex/padding */
.sv2-root .popup-header {
    position: absolute; left: 0; top: 0; width: 650px; height: 65px;
    display: block; padding: 0; cursor: move; touch-action: none;
}
/* GFX_tile_outliner_bg: corneredTileSpriteType borderSize x=80 y=30 */
.sv2-bg {
    position: absolute; inset: 0; box-sizing: border-box;
    border-style: solid;
    border-width: 30px 80px;
    border-color: transparent;
    border-image: url('/gfx/interface/tiles/outliner_tile.png') 30 80 fill;
}
.sv2-root > *:not(.sv2-bg) { position: absolute; }
.sv2-hex { left: -15px; top: -15px; }                 /* GFX_hex_bg 340x68 */
.sv2-line { left: 6px; top: 22px; }                    /* GFX_line_long 512x17 */
/* name: malgun_goth_24 → simp_chinese Chinese_header ttf_size 20 */
.sv2-name { left: 19px; top: 5px; width: 270px; height: 40px; font-size: 20px; line-height: 20px; overflow: hidden; }
/* type: cg_16b → Chinese_normal ttf_size 14; text_color_code "E"（引擎内置淡蓝） */
.sv2-type { left: 20px; top: 45px; width: 300px; height: 20px; font-size: 14px; line-height: 20px; color: #a8d4e6; white-space: nowrap; overflow: hidden; }
/* close: GFX_close_square noOfFrames=3, UPPER_RIGHT position {-40,11} */
.sv2-close {
    top: 11px; right: 2px; width: 38px; height: 38px; padding: 0; border: 0;
    background: url('/gfx/interface/buttons/close_button_square.png') 0% 0 / 300% 100% no-repeat;
    cursor: pointer;
}
.sv2-close:hover { background-position: 50% 0; }
.sv2-close:active { background-position: 100% 0; }
/* ship_model 348x120 @(15,65)；3d_icon 底图拉伸（quadTextureSprite） */
.sv2-model { left: 15px; top: 65px; width: 348px; height: 120px; }
.sv2-model img { width: 100%; height: 100%; }
/* stats 260x220，orientation upper_right position {-15,65} → right:15 top:65 */
.sv2-stats { right: 15px; top: 65px; width: 260px; height: 220px; }
/* GFX_tiles_dark_area_cut_8: borderSize 8 */
.sv2-stats-bg {
    position: absolute; inset: 0; box-sizing: border-box;
    border: 8px solid transparent;
    border-image: url('/gfx/interface/tiles/dark_area_cut_8.png') 8 fill;
}
.sv2-stat-label, .sv2-stat-value { position: absolute; font-size: 14px; line-height: 20px; height: 20px; }
.sv2-stat-label { left: 6px; width: 200px; overflow: hidden; white-space: nowrap; }
.sv2-stat-value { right: 10px; text-align: right; }
.sv2-texticon { display: inline-block; width: 18px; height: 18px; vertical-align: -4px; margin-right: 2px; }
.sv2-cloak-icon { position: absolute; left: 200px; top: 145px; }  /* GFX_cloaking_level_0 */
/* components（核心部件）358x78 @(10,195) */
.sv2-core { left: 10px; top: 195px; width: 358px; height: 78px; }
.sv2-label { position: absolute; left: 10px; top: 0; font-size: 14px; line-height: 20px; }
/* GFX_tiles_frame_light: borderSize 12；bg 363x78 @(0,15) */
.sv2-frame-bg {
    position: absolute; left: 0; top: 15px; width: 363px; height: 78px; box-sizing: border-box;
    border: 12px solid transparent;
    border-image: url('/gfx/interface/tiles/planet_view_glow_tile.png') 12 fill;
}
/* gridBox slotSize 58x78, max_slots_horizontal 6, position {9,15} */
.sv2-core-grid { position: absolute; left: 9px; top: 15px; display: grid; grid-template-columns: repeat(6, 58px); grid-auto-rows: 78px; }
/* ship_view_required_component_entry 58x78：
   bg GFX_tiles_frame_light 64x64 orientation center position {-32,-32} → left:-3 top:7
   icon GFX_ship_part_background 58x58 center {-29,-29} → left:0 top:10 */
.sv2-core-cell { position: relative; width: 58px; height: 78px; }
.sv2-core-cell .sv2-cell-frame {
    position: absolute; left: -3px; top: 7px; width: 64px; height: 64px; box-sizing: border-box;
    border: 12px solid transparent;
    border-image: url('/gfx/interface/tiles/planet_view_glow_tile.png') 12 fill;
}
.sv2-core-cell img.sv2-cell-img { position: absolute; left: 0; top: 10px; width: 58px; height: 58px; }
/* component_sets smoothListbox 630x320 @(10,292)：整体不滚动，分区内部滚动 */
.sv2-sets { left: 10px; top: 292px; width: 630px; height: 320px; overflow: hidden; }
/* ship_view_armaments / ship_view_utilities：630x150 */
.sv2-set { position: relative; width: 630px; height: 150px; }
.sv2-set-list { position: absolute; left: 0; top: 15px; width: 630px; height: 132px; }
.sv2-set-list-bg {
    position: absolute; inset: 0; box-sizing: border-box;
    border: 12px solid transparent;
    border-image: url('/gfx/interface/tiles/planet_view_glow_tile.png') 12 fill;
}
.sv2-set-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; }
.sv2-set-scroll::-webkit-scrollbar { width: 6px; }
.sv2-set-scroll::-webkit-scrollbar-thumb { background: rgba(120, 200, 180, .35); }
/* gridBox slotSize 56x56, max_slots_horizontal 11, position {8,4} */
.sv2-set-grid { display: grid; grid-template-columns: repeat(11, 56px); grid-auto-rows: 56px; margin: 4px 0 0 8px; width: 616px; }
/* ship_view_component_entry 60x60（居中于56x56槽位）：
   icon_bg GFX_ship_designer_slot(960x58, 16帧) center {-30,-30}
   icon GFX_ship_part_background 58x58 @(0,0) */
.sv2-set-cell { position: relative; width: 56px; height: 56px; }
.sv2-set-cell .sv2-slotframe {
    position: absolute; z-index: 1; left: -2px; top: -1px; width: 60px; height: 58px;
    background: url('/gfx/interface/ship_designer/ship_designer_slot.png') var(--slot-pos, 0%) 0 / 1600% 100% no-repeat;
}
.sv2-set-cell img.sv2-cell-img { position: absolute; left: -2px; top: -2px; width: 58px; height: 58px; }
/* buttons @(0,588)；GFX_standard_button_240_34_button = button_240_34_animated.png 3帧(264x60) */
.sv2-buttons { left: 0; top: 588px; width: 650px; height: 60px; }
.sv2-btn {
    position: absolute; top: 0; width: 264px; height: 60px; padding: 0 0 8px; border: 0;
    display: flex; align-items: center; justify-content: center;
    background: url('/gfx/interface/buttons/button_240_34_animated.png') 0% 0 / 300% 100% no-repeat;
    color: #fff; font-size: 14px; font-family: inherit; cursor: pointer;
}
.sv2-btn:hover { background-position: 50% 0; }
.sv2-btn:active { background-position: 100% 0; }
.sv2-btn-designer { left: 48px; }
.sv2-btn-manager { left: 338px; }
`;

const STYLE_ID = 'ship-view-v2-style';
function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

// 与 ship-window.js 相同的导出签名，可直接替换 main.js 的 import
export function renderShipWindow(container, data, callbacks) {
    ensureStyle();

    // gui stats 行：y 坐标与本地化键均取自 ship_view.gui
    const statRows = [
        { y: 5, key: 'SHIP_STAT_HITPOINTS_INLINE', fb: '£ship_stats_hitpoints£船体值', value: fmt(data.max_hitpoints) },
        { y: 25, key: 'SHIP_STAT_ARMOR_INLINE', fb: '£ship_stats_armor£装甲', value: fmt(data.max_armor) },
        { y: 45, key: 'SHIP_STAT_SHIELDS_INLINE', fb: '£ship_stats_shield£护盾', value: fmt(data.max_shield) },
        { y: 65, key: 'SHIP_STAT_SPEED_INLINE', fb: '£ship_stats_speed£速度', value: fmt(data.speed, 1) },
        { y: 85, key: 'SHIP_STAT_EVASION_INLINE', fb: '£ship_stats_evasion£闪避', value: pct(data.evasion) },
        { y: 105, key: 'SHIP_STAT_DAMAGE_INLINE', fb: '£ship_stats_damage£伤害', value: fmt(data.damage, 1) },
        { y: 125, key: 'SHIP_STAT_RANK_INLINE', fb: '£ship_stats_special£等级：', value: esc(t('EXPERIENCED', '经验丰富')) },
    ];

    const closeTooltip = t('CLOSE_TITLE', '关闭').replace(/§./g, '');

    container.innerHTML = `
        <div class="sv2-root">
            <div class="sv2-bg"></div>
            <img class="sv2-hex" src="/gfx/interface/planetview/planet_view_hex_bg.png" alt="">
            <img class="sv2-line" src="/gfx/interface/planetview/line_long.png" alt="">
            <div class="sv2-name">${esc(data.name)}</div>
            <div class="sv2-type">${esc(data.design_name || data.ship_size)}</div>
            <div class="popup-header"></div>
            <button class="sv2-close" id="sv2-close" title="${esc(closeTooltip)}" aria-label="${esc(closeTooltip)}"></button>
            <div class="sv2-model"><img src="/gfx/interface/ship_designer/ship_design_entry_bg.png" alt=""></div>
            <div class="sv2-stats">
                <div class="sv2-stats-bg"></div>
                ${statRows.map(row => `
                    <div class="sv2-stat-label" style="top:${row.y}px">${loc(row.key, row.fb)}</div>
                    <div class="sv2-stat-value" style="top:${row.y}px">${row.value}</div>`).join('')}
                <div class="sv2-stat-label" style="top:145px">${loc('SHIP_STAT_CLOAKING_INLINE', '£ship_stats_cloaking_strength£隐身强度')}</div>
                <img class="sv2-cloak-icon" src="/gfx/interface/icons/ship_stats/cloaking_level_0.png" alt="">
            </div>
            <div class="sv2-core">
                <div class="sv2-label">${esc(t('FLEET_VIEW_COMPONENTS_LABEL', '核心部件'))}</div>
                <div class="sv2-frame-bg"></div>
                <div class="sv2-core-grid">
                    ${(data.core_components || []).map(template => coreCell(template)).join('')}
                </div>
            </div>
            <div class="sv2-sets">
                ${setSection('FLEET_VIEW_ARMAMENTS_LABEL', '武器配备', data.weapons, 'weapon')}
                ${setSection('FLEET_VIEW_UTILITIES_LABEL', '通用', data.utilities, 'utility')}
            </div>
            <div class="sv2-buttons">
                <button class="sv2-btn sv2-btn-designer" id="sv2-designer" type="button">${esc(t('SHIP_DESIGNER', '舰船设计器'))}</button>
                <button class="sv2-btn sv2-btn-manager" id="sv2-manager" type="button">${esc(t('FLEET_MANAGER_VIEW', '舰队管理'))}</button>
            </div>
        </div>
    `;

    container.querySelector('#sv2-close').onclick = callbacks.onClose;
    container.querySelector('#sv2-designer').onclick = callbacks.onOpenDesigner;
    container.querySelector('#sv2-manager').onclick = callbacks.onOpenFleetManager;

    // gui: shortcut = "ESCAPE"
    if (container._sv2Esc) document.removeEventListener('keydown', container._sv2Esc);
    container._sv2Esc = event => {
        if (event.key === 'Escape' && !container.classList.contains('hidden')) callbacks.onClose();
    };
    document.addEventListener('keydown', container._sv2Esc);

    for (const img of container.querySelectorAll('img[data-ph]')) {
        img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    }
}

function coreCell(template) {
    return `
        <div class="sv2-core-cell" title="${esc(template)}">
            <div class="sv2-cell-frame"></div>
            <img class="sv2-cell-img" src="/gfx/interface/icons/ship_parts/ship_part_background.png" alt="">
            <img class="sv2-cell-img" data-ph src="${componentIcon(template)}" alt="${esc(template)}">
        </div>`;
}

function setSection(locKey, fallback, components, kind) {
    return `
        <div class="sv2-set">
            <div class="sv2-label">${esc(t(locKey, fallback))}</div>
            <div class="sv2-set-list">
                <div class="sv2-set-list-bg"></div>
                <div class="sv2-set-scroll">
                    <div class="sv2-set-grid">
                        ${(components || []).map(component => setCell(component, kind)).join('')}
                    </div>
                </div>
            </div>
        </div>`;
}

function setCell(component, kind) {
    const template = component.template || '';
    const frame = slotFrameIndex(component.slot, kind);
    return `
        <div class="sv2-set-cell" title="${esc(template)}${component.slot ? ` (${esc(component.slot)})` : ''}">
            <div class="sv2-slotframe" style="--slot-pos:${(frame / 15) * 100}%"></div>
            <img class="sv2-cell-img" src="/gfx/interface/icons/ship_parts/ship_part_background.png" alt="">
            <img class="sv2-cell-img" data-ph src="${componentIcon(template)}" alt="${esc(template)}">
        </div>`;
}

// ship_designer_slot.png 共16帧(60x58)，帧含义（逐帧核对贴图 + 游戏内确认）：
//   0=通用S 1=通用M 2=通用L(绿) 3=P(点防) | 4=武器S 5=武器M 6=武器L(米黄/橙) |
//   7=G(鱼雷) 8=X 9=T(泰坦) 10=W(歼星) | 11-12=A(辅助) 13-14=H(机库) | 15=空
// 注意：该"尺寸→帧"对应是引擎代码硬编码，.gui/.gfx/common 配置里都没有，只能自维护；
// 但"槽位名→尺寸"有据可查：common/component_slot_templates 与 section_templates，
// 例如 PD_xx/TERTIARY_GUN_xx=point_defence、TORPEDO_xx=torpedo、TITANIC_xx=titanic、
// PLANET_KILLER_xx=planet_killer、PRIMARY_GUN_xx=extra_large、SECONDARY_GUN_xx=medium、
// STRIKE_CRAFT_xx=strike_craft(H)。武器与通用的 S/M/L 是不同帧，不可混用。
const WEAPON_SLOT_FRAMES = [
    ['EXTRA_LARGE', 8], ['PRIMARY_GUN', 8],                 // X
    ['TITANIC', 9],                                         // T
    ['PLANET_KILLER', 10],                                  // W
    ['TORPEDO', 7],                                         // G
    ['POINT_DEFENCE', 3], ['PD', 3], ['TERTIARY_GUN', 3],   // P
    ['STRIKE_CRAFT', 13], ['HANGAR', 13],                   // H
    ['SECONDARY_GUN', 5],                                   // M（海盗船等）
    ['SMALL', 4], ['MEDIUM', 5], ['LARGE', 6],              // 武器 S/M/L
];
const UTILITY_SLOT_FRAMES = [['AUX', 11], ['SMALL', 0], ['MEDIUM', 1], ['LARGE', 2]];

function slotFrameIndex(slot, kind) {
    const name = (slot || '').toUpperCase();
    const table = kind === 'utility' ? UTILITY_SLOT_FRAMES : WEAPON_SLOT_FRAMES;
    for (const [prefix, frame] of table) {
        if (name.startsWith(prefix)) return frame;
    }
    return kind === 'utility' ? 0 : 4;
}

function componentIcon(template) {
    return componentIcons[template] || PLACEHOLDER;
}

function fmt(value, digits = 0) {
    if (!Number.isFinite(value)) return '—';
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
    return value.toFixed(digits);
}

function pct(value) {
    return Number.isFinite(value) ? `${fmt(value, 1)}%` : '—';
}

function esc(value) {
    const d = document.createElement('div');
    d.textContent = value ?? '';
    return d.innerHTML;
}

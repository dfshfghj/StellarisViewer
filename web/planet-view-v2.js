import { assetUrl } from './asset-url.js';

// planet-view-v2.js
// 严格依照 web/assets/interface/planet_view.gui + 相关 .gfx 定义转写的行星视图窗口（P0：顶栏 + 信息条 + 摘要页）。
// 与 ship-window-v2.js 同一模式：根容器 1162x680（gui planet_view size），clipping=no，moveable=yes。
//
// 与 gui 的对应关系（绝对坐标均换算到 1162x680 根）：
//   planet_view_bg        GFX_tile_large_bg_plain   tiles/tile_large_bg_plain.webp 680x612 borderSize x=330 y=296 → (0,28) 850x594 9-slice
//   side_bar bg           GFX_plain_bg_tile         tiles/plain_bg_tile.webp 180x180 borderSize 80 → (850,10) 312x631 9-slice
//   stripes_1             GFX_planetview_big_stripes planetview/planetview_big_stripes.webp → (0,9) 850x242
//   planet_view_gradient  GFX_planet_view_gradient  planetview/planet_view_gradient.webp 415x240 → (0,10) 拉伸 189x116
//   planet_top_bar        GFX_planet_title_banner   planetview/planet_title_banner.webp → (0,0) 251x72
//   flag                  GFX_empire_flag_64        运行期按帝国绑定（无静态贴图）→ (3,0) 64x64 占位
//   planet_name           malgun_goth_24(20px)      → (77,3) 163x40
//   colony_type           (82,18)：icon GFX_colony_type(30x30/帧,50帧) scale0.8 → (76,28)24x24；text cg_16b(14px) → (106,33)
//   header_actions        (877,12) 283x40：prev(1001) next(1037) zoom(1085) close(1120)，均 38x38 3帧
//   portrait              3D rendertarget，gui 只确定区域 (5,10) 850x240 clipping → 用行星类别大图代替
//   planet_info bg        GFX_planet_info_background → (0,212) 850x40
//   信息条指标            stability(60/91) pops(160/187) crime(253/277) housing(342/367) amenities(428/452) jobs(517/542) unemployed(604/632)
//   districts_header_bg   GFX_dark_area → (4,253) 841x38；title(9,258,20px)；count(811,263)
//   districts 网格        planet_district_entry 279x170（dark_area 底 + tiles_frame_extra_light 图标框）→ (4,293) 两列
//   planetary_resources   GFX_dark_area → (568,295) 277x168；产出/赤字两段（growth_positive/negative 14x14）
//   planet_summary        GFX_planet_summary_bg → (855,52) 302x150；类别大图(1045,67)76x76；header(865,57,#a8d4e6)
//   designation           GFX_button_dark_job(borderSize12) → (855,213) 302x32；icon(860,214)30x30；name(892,218)
//   summary_build_queue   (855,249) 302x342；title bg(855,253)300x41；QUEUE(904,261,20px,#a8d4e6)；GFX_tiles_frame(borderSize4)(855,294)300x342
//   planet_devastation    GFX_dark_area_cut → (667,105) 175x35（devastation>0 时显示）
//
// gui/gfx 无法确定、由运行时代码决定的部分（本实现按游戏行为补齐）：
//   - flag 帝国旗帜（运行期绑定；存档未提供旗帜路径 → 占位）
//   - colony_type / designation 的帧选择（代码按殖民地类型选帧；无配置 → 用第 0 帧）
//   - portrait 3D 行星（rendertarget → 用 planet_type_big_icons 对应帧大图代替）
//   - governor_window @(0,70)：widget paragon_portrait_container_sector_governor 185x142，
//     肖像为 3D rendertarget（GFX_portrait_character_hologram）→ unknown_leader 占位；
//     skill_icon GFX_leader_skill(11帧19x22, frame=等级) @(65,124)；name @(80,108) 黄色；
//     title SECTOR_GOVERNOR_TITLE @(80,123)
//   - modifiers @(420,152)：overlappingElementsBox format=right 重叠排列；图标链 =
//     存档 key → modifier-icons.js（common/static_modifiers + planet_modifiers 生成，
//     pm_X 经 modifier="Y" 解析到 static Y 的 icon/本地化键）→ icons/ 下 png；
//     边框 GFX_modifier_frames 3帧(1绿/2黄/3红, icon_frame 1-based)；无收录回退 pm_unknown
//   - 区划按类型分组渲染为卡片（对应游戏 UI）：卡头 已建/上限 + 进度条
//     （住房上限=size-1；资源类=对应矿床数 clamp[3,15]；无上限类型不显示进度条），
//     卡内逐个实例列 zones：基础区（zone_default，6 建筑槽 2x3）+ 特化区（各 3 槽；
//     存档 zones 中 4294967295 = 未解锁特化槽 → 显示“特化可用”；建筑按 position 入槽）
//   - jobs/unemployed 精确受雇/失业数（存档未提供 → jobs 用 employable_pops，unemployed 显示 —）
//   - habitability（存档未提供 → —）；build queue（存档未提供 → 空）

import { resolveGameLocalization } from './game-localization.js';
import { MODIFIER_ICONS } from './modifier-icons.js';

// ---- 本地化（与 main.js 共用同一 virtual 模块；窗口打开时必然已解析完） ----
function t(key, fallback) {
    const value = resolveGameLocalization(key);
    return value === key ? fallback ?? key : value;
}

const PLACEHOLDER = '/gfx/interface/icons/ship_parts/ship_part_placeholder.webp';
const ICON = '/gfx/interface/icons/';
const GFX = '/gfx/interface/';

// ---- 行星类别 → planet_type_big_icons 帧（planet.gfx default_frame 为 1 起，CSS 0 起）----
// big_icons 与 planet_type 均 36 帧、同序（引擎按同一 planet_class 索引取帧）。
const PLANET_CLASS_FRAMES = {
    pc_desert: 0, pc_arid: 1, pc_tundra: 2, pc_continental: 3, pc_tropical: 4,
    pc_ocean: 5, pc_arctic: 6, pc_gaia: 7, pc_barren_cold: 8, pc_barren: 9,
    pc_toxic: 10, pc_molten: 11, pc_frozen: 12, pc_gas_giant: 13, pc_machine: 14,
    pc_hive: 15, pc_nuked: 16, pc_asteroid: 17, pc_alpine: 18, pc_savannah: 19,
    pc_ringworld: 20, pc_habitat: 21, pc_shrouded: 22, pc_city: 24, pc_m_star: 25,
};
const BIG_ICON_FRAMES = 36;

function classFrame(planetClass) {
    return PLANET_CLASS_FRAMES[planetClass] ?? 0;
}
// 帧条带：background-position-x = frame/(N-1)*100%，background-size = N*100% 100%
function bigIconStyle(frame) {
    return `background:url('${ICON}planet_type_big_icons.webp') ${(frame / (BIG_ICON_FRAMES - 1)) * 100}% 0 / ${BIG_ICON_FRAMES * 100}% 100% no-repeat;`;
}

// ---- 资源图标映射（ResourceInfo 字段 → resources/ 下贴图；sr_ 前缀特例见 main-gui-binding.js）----
const RESOURCE_META = [
    ['energy', 'energy', '能量币'], ['minerals', 'minerals', '矿物'], ['food', 'food', '食物'],
    ['physics_research', 'physics_research', '物理学研究'], ['society_research', 'society_research', '社会学研究'],
    ['engineering_research', 'engineering_research', '工程学研究'],
    ['influence', 'influence', '影响力'], ['unity', 'unity', '凝聚力'], ['trade', 'trade', '贸易额'],
    ['consumer_goods', 'consumer_goods', '消费品'], ['alloys', 'alloys', '合金'],
    ['volatile_motes', 'volatile_motes', '易爆微粒'], ['exotic_gases', 'exotic_gases', '异星天然气'],
    ['rare_crystals', 'rare_crystals', '稀有水晶'],
    ['living_metal', 'sr_living_metal', '活体金属'], ['zro', 'sr_zro', '泽珞'], ['dark_matter', 'sr_dark_matter', '暗物质'],
    ['nanites', 'nanites', '纳米机器人'], ['minor_artifacts', 'minor_artifacts', '稀有文物'],
];

function resourceEntries(info) {
    const out = [];
    for (const [key, icon, label] of RESOURCE_META) {
        const value = info ? info[key] : 0;
        if (Number.isFinite(value) && Math.abs(value) >= 0.1) {
            out.push({ icon, label, value });
        }
    }
    return out;
}

// ---- 本地化名（区划/建筑直接用 type 作键；designation 去前缀兜底）----
function typeName(typeStr, fallbackPrefix) {
    if (!typeStr) return '—';
    const direct = resolveGameLocalization(typeStr);
    if (direct !== typeStr) return direct;
    const cleaned = String(typeStr).replace(new RegExp(`^${fallbackPrefix}`), '').replace(/_/g, ' ');
    return cleaned || typeStr;
}

// ---- 总督（governor_window）：肖像占位 + 技能等级图标 + 名字 + 头衔 ----
function governorHtml(gov) {
    if (!gov) return '';
    const lvl = Math.max(0, Math.min(10, gov.level || 0));
    return `
        <div class="pv2-governor">
            <div class="pv2-gov-portrait"><img data-ph src="${GFX}fleet_view/unknown_leader.webp" alt=""></div>
            <div class="pv2-gov-skill" style="background-position:${(lvl / 10) * 100}% 0" title="${esc(t('LEVEL', '等级'))} ${lvl}"></div>
            <div class="pv2-gov-name" title="${esc(gov.name)}">${esc(gov.name)}</div>
            <div class="pv2-gov-title">${esc(t('SECTOR_GOVERNOR_TITLE', '星域总督'))}</div>
        </div>`;
}

// ---- 行星修正（modifiers window）：图标 + GFX_modifier_frames 边框，右对齐重叠排列 ----
// 图标链：存档 key → MODIFIER_ICONS（common/static_modifiers + planet_modifiers 生成）
function modifiersHtml(mods) {
    if (!mods || !mods.length) return '';
    const items = mods.map(m => {
        const meta = MODIFIER_ICONS[m.key];
        const icon = meta ? meta.icon : 'planet_modifiers/pm_unknown.webp';
        const frame = meta ? meta.frame : 1;
        const name = t(meta ? meta.name : m.key, m.key);
        const days = m.days >= 0 ? ` (${m.days}${t('DAYS', '天')})` : '';
        return `
            <div class="pv2-mod" title="${esc(name + days)}">
                <img class="pv2-mod-icon" data-ph src="${ICON}${icon}" alt="">
                <div class="pv2-mod-frame" style="background-position:${(frame - 1) / 2 * 100}% 0"></div>
            </div>`;
    }).join('');
    return `<div class="pv2-mods">${items}</div>`;
}

// ---- 样式：全部尺寸/坐标取自 planet_view.gui，贴图取自各 .gfx 定义 ----
const CSS = `
#planet-window:has(> .pv2-root) {
    inset: auto; display: block; width: 1162px; height: 680px;
    border: 0; background: none; box-shadow: none; overflow: visible;
}
#planet-window:has(> .pv2-root)::after { display: none; }
.pv2-root {
    position: relative; width: 1162px; height: 680px; overflow: visible;
    font-family: "Malgun Gothic", "Microsoft YaHei", sans-serif;
    color: #fff; user-select: none;
}
.pv2-root img { display: block; }
/* gui moveable=yes：复用 main.js 的 .popup-header 拖拽机制 */
.pv2-root .popup-header {
    position: absolute; left: 0; top: 0; width: 850px; height: 72px;
    display: block; padding: 0; cursor: move; touch-action: none; z-index: 20;
}
/* GFX_tile_large_bg_plain: corneredTile borderSize x=330 y=296 → border-width 296px 330px */
.pv2-bg-left {
    position: absolute; left: 0; top: 28px; width: 850px; height: 594px; box-sizing: border-box;
    border-style: solid; border-width: 296px 330px; border-color: transparent;
    border-image: url('${GFX}tiles/tile_large_bg_plain.webp') 296 330 fill;
}
/* GFX_plain_bg_tile: corneredTile borderSize 80 */
.pv2-bg-right {
    position: absolute; left: 850px; top: 10px; width: 312px; height: 631px; box-sizing: border-box;
    border-style: solid; border-width: 80px; border-color: transparent;
    border-image: url('${GFX}tiles/plain_bg_tile.webp') 80 fill;
}
/* ---- 顶栏 ---- */
.pv2-stripes { position: absolute; left: 0; top: 9px; width: 850px; height: 242px; }
.pv2-gradient { position: absolute; left: 0; top: 10px; width: 189px; height: 116px; }
.pv2-banner { position: absolute; left: 0; top: 0; width: 251px; height: 72px; }
.pv2-flag {
    position: absolute; left: 3px; top: 0; width: 64px; height: 64px;
    background: rgba(10, 30, 28, .55); box-sizing: border-box; border: 1px solid rgba(90, 170, 150, .35);
}
.pv2-name {
    position: absolute; left: 77px; top: 3px; width: 163px; height: 40px;
    font-size: 20px; line-height: 20px; overflow: hidden; z-index: 5;
}
.pv2-colony-icon {
    position: absolute; left: 76px; top: 28px; width: 24px; height: 24px;
    background: url('${GFX}planetview/colony_type.webp') 0% 0 / 5000% 100% no-repeat;
}
.pv2-colony-text {
    position: absolute; left: 106px; top: 33px; width: 140px; height: 20px;
    font-size: 14px; line-height: 20px; white-space: nowrap; overflow: hidden;
}
/* header 按钮 38x38 3帧（114x38 条图）：normal/hover/pressed */
.pv2-hbtn {
    position: absolute; top: 12px; width: 38px; height: 38px; padding: 0; border: 0;
    background-repeat: no-repeat; background-size: 300% 100%; background-position: 0% 0;
    cursor: pointer; z-index: 25;
}
.pv2-hbtn:hover { background-position: 50% 0; }
.pv2-hbtn:active { background-position: 100% 0; }
.pv2-prev  { left: 1001px; background-image: url('${GFX}buttons/button_left_solid.webp'); }
.pv2-next  { left: 1037px; background-image: url('${GFX}buttons/button_right_solid.webp'); }
.pv2-zoom  { left: 1085px; background-image: url('${GFX}fleet_view/fleet_action_button_focus_on_solid.webp'); }
.pv2-close { left: 1120px; background-image: url('${GFX}buttons/close_button_solid.webp'); }
/* ---- 行星肖像（3D rendertarget 代替）---- */
.pv2-portrait { position: absolute; left: 5px; top: 10px; width: 850px; height: 240px; overflow: hidden; }
.pv2-planet-big {
    position: absolute; left: 310px; top: 5px; width: 230px; height: 230px;
    filter: drop-shadow(0 0 18px rgba(80, 190, 255, .35));
}
/* ---- 总督（gui governor_window @(0,70) 250x125；widget paragon_portrait_container_sector_governor 185x142）---- */
.pv2-governor { position: absolute; left: 0; top: 70px; width: 185px; height: 142px; z-index: 6; }
/* 肖像为 3D rendertarget（GFX_portrait_character_hologram），web 端用 unknown_leader 占位 */
.pv2-gov-portrait { position: absolute; left: 0; top: 0; width: 145px; height: 142px; overflow: hidden; }
.pv2-gov-portrait img {
    position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%);
    opacity: .85; filter: saturate(.7) brightness(1.1);
}
/* GFX_leader_skill：209x22 = 11帧 19x22，frame = 等级；gui @(65,124) centerPosition */
.pv2-gov-skill {
    position: absolute; left: 55px; top: 113px; width: 19px; height: 22px;
    background: url('${ICON}leaders/leader_skill.webp') 0 0 / 1100% 100% no-repeat;
}
.pv2-gov-name {
    position: absolute; left: 80px; top: 108px; width: 120px; height: 20px;
    font-size: 14px; line-height: 20px; white-space: nowrap; overflow: hidden; color: #ffd866;
}
.pv2-gov-title {
    position: absolute; left: 80px; top: 123px; width: 150px; height: 20px;
    font-size: 14px; line-height: 20px; white-space: nowrap; overflow: hidden;
}
/* ---- 行星修正（gui modifiers @(420,152) 220x34；overlappingElementsBox @(180,5) format=right）---- */
.pv2-mods {
    position: absolute; left: 600px; top: 157px; width: 220px; height: 34px;
    display: flex; justify-content: flex-end; z-index: 6;
}
.pv2-mod { position: relative; width: 34px; height: 34px; margin-left: -10px; cursor: help; }
.pv2-mod:first-child { margin-left: 0; }
.pv2-mod-icon { position: absolute; inset: 0; width: 34px; height: 34px; }
/* GFX_modifier_frames 180x60 = 3帧 60x60：帧1绿(正面)/2黄/3红(负面)；icon_frame 1-based */
.pv2-mod-frame {
    position: absolute; inset: 0; pointer-events: none;
    background: url('${ICON}planet_modifiers/modifier_frames.webp') 0 0 / 300% 100% no-repeat;
}
/* ---- 信息条 ---- */
.pv2-info-bg { position: absolute; left: 0; top: 212px; width: 850px; height: 40px; }
.pv2-metric-icon { position: absolute; }
.pv2-metric-val {
    position: absolute; top: 222px; width: 40px; height: 20px;
    font-size: 14px; line-height: 20px; text-align: center;
}
/* ---- 区划 ---- */
.pv2-districts-header {
    position: absolute; left: 4px; top: 253px; width: 841px; height: 38px;
    background: url('${GFX}tiles/dark_area.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-districts-title { position: absolute; left: 9px; top: 258px; font-size: 20px; line-height: 20px; }
.pv2-districts-count {
    position: absolute; left: 811px; top: 263px; width: 30px; height: 20px;
    font-size: 14px; line-height: 20px; text-align: center;
}
/* ---- 区划列表：城市(主区划)单独上排，其余资源区划下排一排（对应 gui main_districts_grid_box 1x1 + districts_grid_box 3x1）---- */
.pv2-districts-grid {
    position: absolute; left: 4px; top: 293px; width: 845px; height: 372px;
    overflow-y: auto; overflow-x: hidden; padding-right: 4px; box-sizing: border-box;
}
.pv2-districts-grid::-webkit-scrollbar { width: 5px; }
.pv2-districts-grid::-webkit-scrollbar-thumb { background: rgba(120, 200, 180, .35); }
.pv2-districts-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
/* 主区划(城市)=planet_district_entry_width_2(561)；其余=width_1(279) */
.pv2-districts-row-main .pv2-district-card { flex: 0 0 561px; }
.pv2-districts-row-rest .pv2-district-card { flex: 0 0 279px; }
.pv2-district-card {
    position: relative; margin: 0; padding: 6px 8px 8px; box-sizing: border-box;
    background: url('${GFX}tiles/dark_area.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-dc-header { display: flex; align-items: center; gap: 7px; height: 32px; padding-right: 96px; }
.pv2-dc-icon { width: 30px; height: 30px; flex: none; }
.pv2-dc-name {
    flex: 1; font-size: 14px; line-height: 16px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pv2-dc-count { flex: none; font-size: 13px; line-height: 16px; color: #a8d4e6; }
/* 建造按钮：GFX_button_animated_75_24（button_75_24_animated.webp 3帧），orientation=UPPER_RIGHT x=-93 → right:18 */
.pv2-dc-build {
    position: absolute; top: 4px; right: 18px; width: 75px; height: 24px; padding: 0 0 2px; border: 0;
    display: flex; align-items: center; justify-content: center;
    background: url('${GFX}buttons/button_75_24_animated.webp') 0% 0 / 300% 100% no-repeat;
    color: #fff; font-size: 12px; font-family: inherit; cursor: pointer;
}
.pv2-dc-build:hover { background-position: 50% 0; }
.pv2-dc-build:active { background-position: 100% 0; }
/* 已建区划方块：对应 gui district_box_grid（slotsize 22x10，每行10个，最多3行=30）。
   方块用每类区划的 grid_box/<type>_rectangle.webp（60x8=3帧20x8，取第0帧），缺图时以底色兜底 */
.pv2-dc-cubes { display: flex; flex-wrap: wrap; gap: 2px; width: 218px; margin-top: 5px; }
.pv2-dc-cube {
    width: 20px; height: 8px; background-color: rgba(120, 200, 180, .45);
    background-repeat: no-repeat; background-size: 300% 100%; background-position: 0 0;
}
/* 超过30个方块时显示数字框：planet_district_cap_container（GFX_district_any_big 47x28 + num_districts_text） */
.pv2-dc-capbox {
    position: relative; width: 47px; height: 28px; margin-top: 5px;
    background: url('${GFX}icons/districts/grid_box/district_any_big.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-dc-capbox-num {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 13px; line-height: 13px; color: #fff;
}
/* 同类型多个区划实例：zones 块之间加分隔线 */
.pv2-dc-instance + .pv2-dc-instance {
    margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(120, 200, 180, .18);
}
/* 建筑槽网格：基础区 2x3（52px 槽），特化区一行 3 个（40px 槽） */
.pv2-dc-slots { display: grid; gap: 4px; margin-top: 5px; }
.pv2-dc-slots-base { grid-template-columns: repeat(3, 52px); }
.pv2-dc-slots-spec { grid-template-columns: repeat(3, 40px); }
.pv2-slot { position: relative; box-sizing: border-box; }
.pv2-dc-slots-base .pv2-slot { width: 52px; height: 52px; }
.pv2-dc-slots-spec .pv2-slot { width: 40px; height: 40px; }
/* GFX_tiles_frame_extra_light: borderSize 2 */
.pv2-slot.filled {
    border-style: solid; border-width: 2px; border-color: transparent;
    border-image: url('${GFX}tiles/black_bg_green_frame_extra_light_tile.webp') 2 fill;
}
.pv2-slot.filled img { position: absolute; left: 2px; top: 2px; width: calc(100% - 4px); height: calc(100% - 4px); }
.pv2-slot.empty {
    display: flex; align-items: center; justify-content: center;
    border: 1px dashed rgba(120, 200, 180, .35); color: #6f9a8e; font-size: 18px;
}
/* 特化区行：区名 + 3 槽；未解锁时显示 “特化可用” + 一个 + 槽 */
.pv2-dc-zone { display: flex; align-items: flex-start; gap: 8px; margin-top: 6px; }
.pv2-dc-zone-label {
    width: 64px; flex: none; padding-top: 2px;
    font-size: 12px; line-height: 15px; color: #a8d4e6;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pv2-spec-locked { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.pv2-spec-locked .pv2-slot { width: 40px; height: 40px; }
.pv2-spec-locked-label { font-size: 12px; line-height: 15px; color: #c9a86a; }
/* ---- 资源产出/赤字 ---- */
.pv2-resources {
    position: absolute; left: 568px; top: 295px; width: 277px; height: 168px;
    background: url('${GFX}tiles/dark_area.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-res-titlebg {
    position: absolute; left: 0; width: 280px; height: 28px;
    background: url('${GFX}tiles/dark_area.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-res-prod-titlebg { top: 0; }
.pv2-res-cons-titlebg { top: 91px; }
.pv2-res-pos-icon { position: absolute; left: 74px; top: 7px; width: 14px; height: 14px; }
.pv2-res-neg-icon { position: absolute; left: 87px; top: 98px; width: 14px; height: 14px; }
.pv2-res-title { position: absolute; font-size: 14px; line-height: 20px; white-space: nowrap; }
.pv2-res-prod-title { left: 95px; top: 7px; }
.pv2-res-cons-title { left: 109px; top: 96px; }
.pv2-res-amount {
    position: absolute; left: 12px; width: 250px; overflow-y: auto; overflow-x: hidden;
    display: flex; flex-wrap: wrap; align-content: flex-start; justify-content: center; gap: 2px 8px;
}
.pv2-res-prod-amount { top: 35px; height: 54px; }
.pv2-res-cons-amount { top: 125px; height: 40px; }
.pv2-res-amount::-webkit-scrollbar { width: 5px; }
.pv2-res-amount::-webkit-scrollbar-thumb { background: rgba(120, 200, 180, .35); }
.pv2-res-item { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; line-height: 18px; }
.pv2-res-item img { width: 18px; height: 18px; }
.pv2-res-pos { color: #7dffb0; }
.pv2-res-neg { color: #ff8a7a; }
/* ---- 右侧摘要 ---- */
.pv2-summary {
    position: absolute; left: 855px; top: 52px; width: 302px; height: 150px;
    background: url('${GFX}planetview/planet_summary_bg.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-summary-class-icon { position: absolute; left: 190px; top: 15px; width: 76px; height: 76px; }
.pv2-summary-header { position: absolute; left: 10px; top: 5px; font-size: 20px; line-height: 20px; color: #a8d4e6; }
.pv2-summary-class-text { position: absolute; left: 10px; top: 32px; width: 175px; font-size: 14px; line-height: 16px; color: #a8d4e6; white-space: nowrap; overflow: hidden; }
.pv2-summary-line { position: absolute; left: 10px; width: 175px; font-size: 14px; line-height: 16px; white-space: nowrap; overflow: hidden; }
/* GFX_standard_button_dark_116_34: button_116_dark_animated.webp 3帧(140x58)，按逻辑尺寸 116x34 渲染 */
.pv2-btn-dark {
    position: absolute; top: 95px; width: 116px; height: 34px; padding: 0 0 4px; border: 0;
    display: flex; align-items: center; justify-content: center;
    background: url('${GFX}buttons/button_116_dark_animated.webp') 0% 0 / 300% 100% no-repeat;
    color: #fff; font-size: 14px; font-family: inherit; cursor: pointer;
}
.pv2-btn-dark:hover { background-position: 50% 0; }
.pv2-btn-dark:active { background-position: 100% 0; }
.pv2-btn-decisions { left: 15px; }
.pv2-btn-terraform { left: 150px; }
/* designation：GFX_button_dark_job corneredTile borderSize 12 */
.pv2-designation {
    position: absolute; left: 855px; top: 213px; width: 302px; height: 32px; box-sizing: border-box;
    border-style: solid; border-width: 12px; border-color: transparent;
    border-image: url('${GFX}tiles/button_dark_job_tile.webp') 12 fill;
}
.pv2-designation-icon { position: absolute; left: 5px; top: 1px; width: 30px; height: 30px; background: url('${GFX}planetview/colony_type.webp') 0% 0 / 5000% 100% no-repeat; }
.pv2-designation-name {
    position: absolute; left: 37px; top: 5px; width: 200px; height: 22px;
    font-size: 14px; line-height: 22px; white-space: nowrap; overflow: hidden;
}
/* ---- 建造队列 ---- */
.pv2-queue-titlebg {
    position: absolute; left: 855px; top: 253px; width: 300px; height: 41px;
    background: url('${GFX}tiles/dark_area.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-queue-header {
    position: absolute; left: 904px; top: 261px; width: 195px; height: 20px;
    font-size: 20px; line-height: 20px; text-align: center; color: #a8d4e6;
}
/* GFX_tiles_frame: corneredTile borderSize 4 */
.pv2-queue-subwindow {
    position: absolute; left: 855px; top: 294px; width: 300px; height: 342px; box-sizing: border-box;
    border-style: solid; border-width: 4px; border-color: transparent;
    border-image: url('${GFX}tiles/black_bg_green_frame_tile.webp') 4 fill;
}
.pv2-queue-empty {
    position: absolute; left: 858px; top: 298px; width: 294px; height: 334px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: #6f9a8e;
}
/* ---- 破坏度（devastation>0）---- */
.pv2-devastation {
    position: absolute; left: 667px; top: 105px; width: 175px; height: 35px;
    background: url('${GFX}tiles/dark_area_cut.webp') 0 0 / 100% 100% no-repeat;
}
.pv2-devastation-text {
    position: absolute; left: 0; top: 9px; width: 120px; height: 20px;
    font-size: 14px; line-height: 20px; text-align: right;
}
.pv2-devastation-icon { position: absolute; left: 140px; top: 3px; width: 28px; height: 28px; }
`;

const STYLE_ID = 'planet-view-v2-style';
function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

// 与 planet-window.js 相同的导出签名，可直接替换 main.js 的 import
export function renderPlanetWindow(container, data, callbacks) {
    ensureStyle();

    const frame = classFrame(data.planet_class);
    const classText = t(data.planet_class, cleanClass(data.planet_class));
    const colonyText = typeName(data.designation, 'designation_');
    const closeTooltip = t('CLOSE_TITLE', '关闭').replace(/§./g, '');

    // 信息条指标（icon 绝对坐标 / 值文本 left，均取自 gui；icon 路径相对 GFX 根）
    const metrics = [
        { icon: 'icons/stability', size: 31, left: 60, top: 216, valLeft: 91, value: fmtInt(data.stability), label: t('PLANET_STABILITY', '稳定度') },
        { icon: 'icons/pop', size: 25, left: 160, top: 217, valLeft: 187, value: String(data.num_pops ?? 0), label: t('POP', '人口') },
        { icon: 'icons/crime', size: 27, left: 253, top: 219, valLeft: 277, value: fmtInt(data.crime), label: t('PLANET_CRIME', '犯罪率') },
        { icon: 'icons/planet_housing', size: 25, left: 342, top: 219, valLeft: 367, value: fmtInt(data.free_housing), label: t('PLANET_HOUSING', '可用住房') },
        { icon: 'icons/planet_amenities', size: 25, left: 428, top: 220, valLeft: 452, value: fmtInt(data.free_amenities), label: t('PLANET_AMENITIES', '可用舒适度') },
        { icon: 'icons/pop_job', size: 23, left: 517, top: 217, valLeft: 542, value: fmtInt(data.employable_pops), label: t('PLANET_JOBS', '岗位') },
        { icon: 'planetview/unemployed', size: 30, left: 604, top: 216, valLeft: 632, value: '—', label: t('PLANET_UNEMPLOYED', '失业') },
    ];

    const districts = data.districts || [];
    // 已建区划总数 = 所有 District 对象的 level 求和（每种类型只有一个对象）
    const totalDistricts = districts.reduce((s, d) => s + (d.level || 0), 0);
    const produces = resourceEntries(data.produces);
    const upkeep = resourceEntries(data.upkeep);

    container.innerHTML = `
        <div class="pv2-root">
            <div class="pv2-bg-left"></div>
            <div class="pv2-bg-right"></div>

            <img class="pv2-stripes" src="${GFX}planetview/planetview_big_stripes.webp" alt="">
            <img class="pv2-gradient" src="${GFX}planetview/planet_view_gradient.webp" alt="">
            <img class="pv2-banner" src="${GFX}planetview/planet_title_banner.webp" alt="">
            <div class="pv2-flag" title="${esc(data.owner_name || '')}"></div>
            <div class="pv2-name">${esc(data.name)}</div>
            <div class="pv2-colony-icon" title="${esc(colonyText)}"></div>
            <div class="pv2-colony-text">${esc(colonyText)}</div>
            <div class="popup-header"></div>

            <button class="pv2-hbtn pv2-prev" title="${esc(t('PREV', '上一颗').replace(/§./g, ''))}"></button>
            <button class="pv2-hbtn pv2-next" title="${esc(t('NEXT', '下一颗').replace(/§./g, ''))}"></button>
            <button class="pv2-hbtn pv2-zoom" title="${esc(t('ZOOM_TO_PLANET', '定位行星').replace(/§./g, ''))}"></button>
            <button class="pv2-hbtn pv2-close" id="pv2-close" title="${esc(closeTooltip)}" aria-label="${esc(closeTooltip)}"></button>

            <div class="pv2-portrait">
                <div class="pv2-planet-big" style="${bigIconStyle(frame)}" title="${esc(classText)}"></div>
            </div>
            ${governorHtml(data.governor)}

            <img class="pv2-info-bg" src="${GFX}planetview/planet_info_background.webp" alt="">
            ${metrics.map(m => `
                <img class="pv2-metric-icon" style="left:${m.left}px;top:${m.top}px;width:${m.size}px;height:${m.size}px" src="${GFX}${m.icon}.webp" title="${esc(m.label)}" alt="">
                <div class="pv2-metric-val" style="left:${m.valLeft}px" title="${esc(m.label)}">${esc(m.value)}</div>`).join('')}
            ${modifiersHtml(data.modifiers)}

            <div class="pv2-districts-header"></div>
            <div class="pv2-districts-title">${esc(t('DISTRICTS_AND_BUILDINGS_TITLE', '区划和建筑'))}</div>
            <div class="pv2-districts-count">${totalDistricts}</div>
            <div class="pv2-districts-grid">
                ${districtRows(districts, data)}
            </div>

            <div class="pv2-resources">
                <div class="pv2-res-titlebg pv2-res-prod-titlebg"></div>
                <img class="pv2-res-pos-icon" src="${GFX}planetview/population_growing.webp" alt="">
                <div class="pv2-res-title pv2-res-prod-title">${esc(t('PLANETARY_PRODUCTION', '行星产出'))}</div>
                <div class="pv2-res-amount pv2-res-prod-amount">
                    ${produces.map(r => resItem(r, '+')).join('') || emptyRes()}
                </div>
                <div class="pv2-res-titlebg pv2-res-cons-titlebg"></div>
                <img class="pv2-res-neg-icon" src="${GFX}planetview/population_declining.webp" alt="">
                <div class="pv2-res-title pv2-res-cons-title">${esc(t('PLANETARY_DEFICIT', '行星赤字'))}</div>
                <div class="pv2-res-amount pv2-res-cons-amount">
                    ${upkeep.map(r => resItem(r, '-')).join('') || emptyRes()}
                </div>
            </div>

            <div class="pv2-summary">
                <div class="pv2-summary-class-icon" style="${bigIconStyle(frame)}"></div>
                <div class="pv2-summary-header">${esc(t('PLANET_SUMMARY_TITLE', '行星总览'))}</div>
                <div class="pv2-summary-class-text">${esc(classText)}</div>
                <div class="pv2-summary-line" style="top:48px">${esc(t('HABITABILITY', '宜居性'))}: —</div>
                <div class="pv2-summary-line" style="top:64px">${esc(t('COLONIZED', '殖民于'))}: ${esc(formatDate(data.colonize_date))}</div>
                <div class="pv2-summary-line" style="top:80px">${esc(t('SIZE', '规模'))}: ${data.size ?? '—'}</div>
                <button class="pv2-btn-dark pv2-btn-decisions" id="pv2-decisions" type="button">${esc(t('DECISIONS_TITLE', '决议'))}</button>
                <button class="pv2-btn-dark pv2-btn-terraform" id="pv2-terraform" type="button">${esc(t('TERRAFORM_TITLE', '环境改造'))}</button>
            </div>

            <div class="pv2-designation">
                <div class="pv2-designation-icon"></div>
                <div class="pv2-designation-name">${esc(colonyText)}</div>
            </div>

            <div class="pv2-queue-titlebg"></div>
            <div class="pv2-queue-header">${esc(t('QUEUE', '建造队列'))}</div>
            <div class="pv2-queue-subwindow"></div>
            <div class="pv2-queue-empty">${esc(t('NO_QUEUED_CONSTRUCTION', '无建造任务'))}</div>

            ${data.devastation > 0 ? `
            <div class="pv2-devastation">
                <div class="pv2-devastation-text">${esc(t('DEVASTATION', '破坏度'))}: ${fmtInt(data.devastation)}%</div>
                <img class="pv2-devastation-icon" src="${GFX}planetview/devastation.webp" alt="">
            </div>` : ''}
        </div>
    `;

    container.querySelector('#pv2-close').onclick = callbacks.onClose;
    const decisions = container.querySelector('#pv2-decisions');
    if (decisions) decisions.onclick = callbacks.onDecisions || (() => {});
    const terraform = container.querySelector('#pv2-terraform');
    if (terraform) terraform.onclick = callbacks.onTerraform || (() => {});

    // gui: shortcut = "ESCAPE"
    if (container._pv2Esc) document.removeEventListener('keydown', container._pv2Esc);
    container._pv2Esc = event => {
        if (event.key === 'Escape' && !container.classList.contains('hidden')) callbacks.onClose();
    };
    document.addEventListener('keydown', container._pv2Esc);

    for (const img of container.querySelectorAll('img[data-ph]')) {
        img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    }
}

// ---- 区划卡片：按类型分组（对应游戏 UI——每种区划一张卡，进度条 = 已建/上限）----
// 上限规则（common/districts + 00_defines）：
//   住房类 = NUM_DISTRICTS_BASE(0) + size*NUM_DISTRICTS_FROM_PLANET_SIZE(1) - 1 = size-1
//   资源类 = 对应矿床数 clamp 到 [min_for_deposits_on_planet=3, max_for_deposits_on_planet=15]
//   其余（工业/科研/贸易等）无 is_uncapped 字段 → 无上限，不显示进度条
const DISTRICT_ORDER = ['city', 'generator', 'mining', 'farming'];

function districtCategory(type) {
    if (!type) return 'other';
    if (/^district_(city|arcology_housing|hab_housing|rw_city)/.test(type)) return 'city';
    if (type.startsWith('district_generator')) return 'generator';
    if (type.startsWith('district_mining')) return 'mining';
    if (type.startsWith('district_farming')) return 'farming';
    return 'other';
}

function districtCap(category, data) {
    if (category === 'city') return Math.max(0, (data.size || 0) - 1);
    const rd = data.resource_deposits || {};
    const dep = category === 'generator' ? rd.generator
        : category === 'mining' ? rd.mining
        : category === 'farming' ? rd.farming : null;
    if (dep == null) return null;
    return Math.max(3, Math.min(dep, 15));
}

function groupDistricts(districts) {
    const groups = new Map();
    for (const d of districts) {
        const key = d.district_type || 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(d);
    }
    return [...groups.entries()].sort((a, b) => {
        const oa = DISTRICT_ORDER.indexOf(districtCategory(a[0]));
        const ob = DISTRICT_ORDER.indexOf(districtCategory(b[0]));
        return (oa < 0 ? 99 : oa) - (ob < 0 ? 99 : ob) || a[0].localeCompare(b[0]);
    });
}

// 两行布局（对应原版 planet_view）：城市类区划单独上排（宽卡），
// 其余资源类区划下排（窄卡 ×3）
function districtRows(districts, data) {
    const groups = groupDistricts(districts);
    if (!groups.length) return emptyDistricts();
    const main = groups.filter(([type]) => districtCategory(type) === 'city');
    const rest = groups.filter(([type]) => districtCategory(type) !== 'city');
    let html = '';
    if (main.length) {
        html += `<div class="pv2-districts-row pv2-districts-row-main">${main.map(([type, list]) => districtTypeCard(type, list, data)).join('')}</div>`;
    }
    if (rest.length) {
        html += `<div class="pv2-districts-row pv2-districts-row-rest">${rest.map(([type, list]) => districtTypeCard(type, list, data)).join('')}</div>`;
    }
    return html;
}

function districtTypeCard(type, list, data) {
    const name = typeName(type, 'district_');
    const icon = assetUrl(`/gfx/interface/icons/districts/${type}.webp`);
    const cap = districtCap(districtCategory(type), data);
    // 存档中每种区划类型只有一个 District 对象，已建数量存在 level 字段里
    const built = list.reduce((s, d) => s + (d.level || 0), 0);

    let html = `
        <div class="pv2-district-card">
            <div class="pv2-dc-header">
                <img class="pv2-dc-icon" data-ph src="${icon}" alt="">
                <div class="pv2-dc-name" title="${esc(name)}">${esc(name)}</div>
                <div class="pv2-dc-count">${built}${cap != null ? `/${cap}` : ''}</div>
            </div>
            <button class="pv2-dc-build" type="button" title="${esc(t('BUILD_DISTRICT', '建造区划'))}">${esc(t('BUILD_DISTRICT_BUTTON', '建造'))}</button>
            ${cap != null ? districtCubes(type, built) : ''}`;

    // 同类型各区划实例的 zones 结构一致，逐个列出建筑槽
    for (const d of list) html += instanceZones(d);

    html += `</div>`;
    return html;
}

// 已建区划方块（游戏原版形式）：每块 20x8，用 grid_box/<type>_rectangle.webp 第0帧，
// 每行10个、最多3行（对应 district_box_grid slotsize 22x10 / max 10x3）；超过30个改用数字框
function districtCubes(type, built) {
    if (built > 30) {
        return `<div class="pv2-dc-capbox"><span class="pv2-dc-capbox-num">${built}</span></div>`;
    }
    const sprite = `${ICON}districts/grid_box/${type}_rectangle.webp`;
    let cubes = '';
    for (let i = 0; i < built; i++) {
        cubes += `<span class="pv2-dc-cube" style="background-image:url('${sprite}')"></span>`;
    }
    return `<div class="pv2-dc-cubes">${cubes}</div>`;
}

// 单个区划实例：基础区建筑槽（2x3）+ 特化区（各 3 槽，未解锁显示“特化可用”）
function instanceZones(d) {
    const zones = d.zones || [];
    const base = zones.find(z => !z.locked && z.zone_type === 'zone_default');
    const specs = zones.filter(z => z !== base);

    let html = `<div class="pv2-dc-instance">`;
    if (base) {
        html += `<div class="pv2-dc-slots pv2-dc-slots-base">${zoneSlots(base)}</div>`;
    }
    for (const z of specs) {
        if (z.locked) {
            html += `
            <div class="pv2-spec-locked">
                <div class="pv2-slot empty">+</div>
                <span class="pv2-spec-locked-label">${esc(t('ZONE_SPECIALIZE_AVAILABLE', '特化可用'))}</span>
            </div>`;
        } else {
            const zname = typeName(z.zone_type, 'zone_');
            html += `
            <div class="pv2-dc-zone">
                <div class="pv2-dc-zone-label" title="${esc(zname)}">${esc(zname)}</div>
                <div class="pv2-dc-slots pv2-dc-slots-spec">${zoneSlots(z)}</div>
            </div>`;
        }
    }
    html += `</div>`;
    return html;
}

// 按 position 将建筑放入槽位；空槽显示 +
function zoneSlots(zone) {
    const slots = zone.slots || 0;
    const byPos = new Map();
    for (const b of zone.buildings || []) byPos.set(b.position, b);
    let html = '';
    for (let i = 0; i < slots; i++) {
        const b = byPos.get(i);
        if (b) {
            const bname = typeName(b.building_type, 'building_');
            html += `<div class="pv2-slot filled" title="${esc(bname)}">` +
                `<img data-ph src="${assetUrl(`/gfx/interface/icons/buildings/${b.building_type}.webp`)}" alt=""></div>`;
        } else {
            html += `<div class="pv2-slot empty">+</div>`;
        }
    }
    return html;
}

function emptyDistricts() {
    return `<div class="pv2-district-card"><div class="pv2-dc-name" style="color:#6f9a8e">${esc(t('NO_DISTRICTS', '无区划'))}</div></div>`;
}

function resItem(r, sign) {
    return `<span class="pv2-res-item ${sign === '+' ? 'pv2-res-pos' : 'pv2-res-neg'}" title="${esc(r.label)}">
        <img src="${ICON}resources/${r.icon}.webp" alt="">${sign}${fmtRes(r.value)}</span>`;
}

function emptyRes() {
    return `<span class="pv2-res-item" style="color:#6f9a8e">—</span>`;
}

function cleanClass(planetClass) {
    return String(planetClass || '').replace(/^pc_/, '').replace(/_/g, ' ');
}

// 存档日期 "YYYY.MM.DD" → 游戏内 "DD.MM.YYYY"
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const parts = String(dateStr).split('.');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dateStr;
}

function fmtInt(value) {
    return Number.isFinite(value) ? String(Math.round(value)) : '—';
}

function fmtRes(value) {
    const abs = Math.abs(value);
    if (abs >= 1000) return `${(value / 1000).toFixed(abs >= 100000 ? 0 : 1)}K`;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function esc(value) {
    const d = document.createElement('div');
    d.textContent = value ?? '';
    return d.innerHTML;
}

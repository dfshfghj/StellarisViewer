// planet-view-v2.smoke.test.js
// SSR 冒烟测试：用 vite ssrLoadModule 加载真实 planet-view-v2.js，
// 桩 fetch 返回本地化，提供最小 DOM shim，渲染含 zones 的模拟 PlanetDetail，
// 断言区划卡片 / 建筑槽 / 特化区（含“特化可用”）的渲染标记。
import { createServer } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLocalization } from './vite.config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 最小 DOM shim ----
function makeEl(tag) {
    return {
        tagName: String(tag).toUpperCase(),
        _text: '',
        _html: '',
        style: {},
        classList: { add() {}, remove() {}, contains() { return false; } },
        set textContent(v) {
            this._text = String(v);
            this._html = String(v)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        get textContent() { return this._text; },
        set innerHTML(v) { this._html = v; },
        get innerHTML() { return this._html; },
        setAttribute() {},
        appendChild(c) { return c; },
        addEventListener() {},
    };
}

globalThis.document = {
    createElement: tag => makeEl(tag),
    getElementById: () => null,
    head: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
};

function makeContainer() {
    return {
        _html: '',
        set innerHTML(v) { this._html = v; },
        get innerHTML() { return this._html; },
        querySelector: () => ({}),
        querySelectorAll: () => [],
        classList: { contains() { return false; } },
    };
}

// ---- 本地化（供 fetch 桩返回）----
const localized = parseLocalization(resolve(__dirname, 'assets/localisation/simp_chinese'));
globalThis.fetch = async () => ({ ok: true, json: async () => localized });

// ---- 启动 vite SSR 并加载被测模块 ----
const server = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
});
const mod = await server.ssrLoadModule('/planet-view-v2.js');
await new Promise(r => setTimeout(r, 80)); // 等模块级 loadLocalization().then 填充 strings

// ---- 模拟 PlanetDetail（含 zones 层级 + resource_deposits；同类型多实例验证分组）----
const LOCKED = { id: 4294967295, zone_type: '', locked: true, slots: 0, buildings: [] };
const data = {
    id: 0, name: '地球', planet_class: 'pc_continental', size: 18,
    owner: 0, owner_name: '联合国',
    governor: { name: '娜雅·波帝', class: 'official', level: 3, portrait: 'human', age: 30, experience: 575, traits: [] },
    stability: 90, crime: 0, devastation: 0,
    amenities: 10, amenities_usage: 5, free_amenities: 5,
    free_housing: 10, total_housing: 20, housing_usage: 10,
    employable_pops: 17, civilian: 0, num_pops: 17,
    ascension_tier: 0, colonize_date: '2200.01.01',
    designation: 'designation_default',
    produces: { energy: 35, minerals: 62, food: 40 },
    upkeep: { energy: 8 },
    resource_deposits: { generator: 5, mining: 2, farming: 4 },
    modifiers: [
        { key: 'prosp_uni_mod', days: 306 },
        { key: 'pm_carbon_world', days: -1 },
        { key: 'pm_mineral_poor', days: -1 },
    ],
    districts: [
        {
            id: 0, district_type: 'district_city', level: 3,
            zones: [
                {
                    id: 0, zone_type: 'zone_default', locked: false, slots: 6,
                    buildings: [
                        { id: 0, building_type: 'building_capital', position: 0 },
                        { id: 1, building_type: 'building_factory_1', position: 1 },
                        { id: 2, building_type: 'building_luxury_residence', position: 2 },
                    ],
                },
                {
                    id: 33, zone_type: 'zone_research_unity', locked: false, slots: 3,
                    buildings: [{ id: 3, building_type: 'building_research_lab_1', position: 0 }],
                },
                { ...LOCKED },
            ],
        },
        {
            id: 1, district_type: 'district_city', level: 1,
            zones: [
                {
                    id: 1, zone_type: 'zone_default', locked: false, slots: 6,
                    buildings: [{ id: 4, building_type: 'building_housing_1', position: 0 }],
                },
                { ...LOCKED },
                { ...LOCKED },
            ],
        },
        {
            id: 33, district_type: 'district_generator', level: 2,
            zones: [{ ...LOCKED }],
        },
    ],
    buildings: [], armies: 0, deposits_count: 0,
};

const container = makeContainer();
mod.renderPlanetWindow(container, data, { onClose() {}, onDecisions() {}, onTerraform() {} });
const html = container.innerHTML;

function count(needle) { return html.split(needle).length - 1; }
let failures = 0;
function assert(cond, msg) {
    if (cond) console.log(`✓ ${msg}`);
    else { failures++; console.error(`✗ ${msg}`); }
}

// 按类型分组：2 个城市实例 + 1 个发电 → 2 张卡片
assert(count('pv2-district-card') === 2, 'groups districts by type into 2 cards');
// 已建数 = level 求和。城市 3+1=4/上限17(size-1)；发电 2/上限5(矿床贡献和)
assert(html.includes('pv2-dc-count">4/17<'), 'city card shows built/cap 4/17 (sum of level)');
assert(html.includes('pv2-dc-count">2/5<'), 'generator card shows built/cap 2/5');
// 已建方块（游戏原版形式）：城市 4 块 + 发电 2 块 = 6，贴图用各类型 rectangle 条图
assert(count('class="pv2-dc-cube"') === 6, 'renders one cube per built district (6)');
assert(html.includes('grid_box/district_city_rectangle.png'), 'city cubes use city rectangle sprite');
assert(html.includes('grid_box/district_generator_rectangle.png'), 'generator cubes use generator rectangle sprite');
// 布局：城市类单独上排（main），其余下排（rest）
assert(count('pv2-districts-row-main') === 1, 'city districts on main row');
assert(count('pv2-districts-row-rest') === 1, 'resource districts on rest row');
// 建造按钮（仅外观）：每卡一个
assert(count('pv2-dc-build') === 2, 'renders a build button per card');
// 实例块：城市 2 + 发电 1 = 3
assert(count('pv2-dc-instance') === 3, 'renders one instance block per district (3)');
// 基础区网格：两个城市实例各一个 → 2
assert(count('pv2-dc-slots-base') === 2, 'renders a base-zone grid per city instance');
// 建筑槽：filled = 3(城市1基础) + 1(城市1研究) + 1(城市2基础) = 5
//         empty = 3+2+1(城市1) + 5+1+1(城市2) + 1(发电锁定) = 14
assert(count('pv2-slot filled') === 5, 'places 5 buildings into slots');
assert(count('pv2-slot empty') === 14, 'renders 14 empty/locked slots as +');
// 建筑图标按 type 生成
assert(html.includes('icons/buildings/building_capital.png'), 'base slot shows building_capital icon');
assert(html.includes('icons/buildings/building_research_lab_1.png'), 'spec slot shows building_research_lab_1 icon');
// 已解锁特化区：显示区名标签行
assert(count('pv2-dc-zone-label') === 1, 'renders one unlocked specialization zone label');
// 锁定特化：城市1(1) + 城市2(2) + 发电(1) = 4 处“特化可用”
assert(count('特化可用') === 4, 'shows 特化可用 for all locked specialization slots');
// 区划图标
assert(html.includes('icons/districts/district_city.png'), 'city district icon path');
assert(html.includes('icons/districts/district_generator.png'), 'generator district icon path');
// 区划计数 = level 求和 3+1+2 = 6
assert(html.includes('pv2-districts-count">6<'), 'district count header shows 6 (sum of level)');
// ---- 总督 ----
assert(count('class="pv2-governor"') === 1, 'renders governor widget');
assert(html.includes('娜雅·波帝'), 'governor name shown');
assert(html.includes('星域总督'), 'governor title shown');
assert(html.includes('pv2-gov-skill') && html.includes('30% 0'), 'governor skill icon at level-3 frame (30%)');
assert(html.includes('fleet_view/unknown_leader.png'), 'governor portrait placeholder');
// ---- 行星修正 ----
assert(count('class="pv2-mod"') === 3, 'renders 3 modifier items');
assert(html.includes('planet_modifiers/pm_planet_from_space.png'), 'prosp_uni_mod resolves to pm_planet_from_space icon');
assert(html.includes('planet_modifiers/pm_carbon_world.png'), 'pm_carbon_world resolves via static modifier carbon_world');
assert(html.includes('planet_modifiers/pm_mineral_poor.png'), 'pm_mineral_poor icon');
assert(html.includes('繁荣一统'), 'modifier name localized (prosp_uni_mod)');
assert(html.includes('306'), 'timed modifier shows remaining days');
assert(html.includes('background-position:100% 0'), 'negative modifier uses red frame (frame 3)');

await server.close();
if (failures) {
    console.error(`\n${failures} assertion(s) failed`);
    process.exit(1);
}
console.log('\nplanet-view-v2 smoke: all assertions passed');

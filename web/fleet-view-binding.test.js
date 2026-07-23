import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';
import { mountGui } from './gui-runtime.js';
import {
    averageFleetStat,
    bindFleetViewData,
    fleetMovementLabel,
    navalUsage,
    shipSizeLabel,
} from './fleet-view-binding.js';

const ships = [
    { ship_size: 'corvette', hp_pct: 100, armor_pct: 80, shield_pct: 60 },
    { ship_size: 'destroyer', hp_pct: 50, armor_pct: 20, shield_pct: 0 },
];
assert.equal(averageFleetStat(ships, 'hp_pct'), 75);
assert.equal(averageFleetStat([], 'hp_pct'), null);
assert.equal(navalUsage(ships), 3);
assert.equal(shipSizeLabel('science'), '科研船');
assert.equal(fleetMovementLabel({ movement_state: 'idle' }), '待命中');
assert.equal(fleetMovementLabel({ movement_state: 'move_system', destination: '太阳系' }), '正在移动 → 太阳系');

class FakeElement {
    constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.style = { setProperty: (key, value) => { this.style[key] = value; } };
        this.classList = { add: (...names) => { this.className = [this.className, ...names].filter(Boolean).join(' '); } };
    }

    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    querySelectorAll() {
        return this.children.flatMap(child => [child, ...child.querySelectorAll()])
            .filter(child => child.dataset.guiName);
    }
}

globalThis.document = {
    head: new FakeElement('head'),
    createElement: tag => new FakeElement(tag),
    getElementById: () => null,
};

const assetsDirectory = resolve('assets');
const definition = compileGuiView({
    guiPath: resolve(assetsDirectory, 'interface/fleet_view.gui'),
    assetsDirectory,
    rootName: 'fleet_view',
});
const container = new FakeElement('main');
const view = mountGui(container, definition, { baseUrl: '/', applyRootPosition: false, localize: key => key });
let openedShip = null;
const result = bindFleetViewData(view, {
    id: 7,
    name: '第一舰队',
    military_power: 1234.4,
    civilian: false,
    station: false,
    stance: 'fleet_stance_aggressive',
    movement_state: 'move_system',
    destination: '太阳系',
    commander: { name: '测试司令', class: 'commander', level: 3, age: 42, traits: ['leader_trait_cautious'] },
    ships: [
        { id: 11, name: '长矛号', ship_size: 'corvette', hp_pct: 75, armor_pct: 50, shield_pct: 25 },
        { id: 12, name: '坚盾号', ship_size: 'destroyer', hp_pct: 100, armor_pct: 100, shield_pct: 0 },
    ],
}, { onShipClick: id => { openedShip = id; } });

assert.equal(view.findIn(result.entry, 'fleet_name', 'instanttextboxtype').textContent, '第一舰队');
assert.equal(view.findIn(result.entry, 'fleet_power', 'instanttextboxtype').textContent, '1234');
assert.equal(view.findIn(result.entry, 'hull_points', 'instanttextboxtype').children[0].src, '/gfx/interface/icons/ship_stats/hit_points.png');
assert.equal(view.findIn(result.entry, 'armor_points', 'instanttextboxtype').children[0].src, '/gfx/interface/icons/ship_stats/armor.png');
assert.equal(view.findIn(result.entry, 'shield_points', 'instanttextboxtype').children[0].src, '/gfx/interface/icons/ship_stats/shield.png');
assert.equal(view.findIn(result.entry, 'size_limit', 'instanttextboxtype').children[0].src, '/gfx/interface/icons/navy_size_icon.png');
assert.equal(view.findIn(result.entry, 'fleet_power', 'instanttextboxtype').children[0].src, '/gfx/interface/system/offensive_value.png');
assert.equal(view.findIn(result.entry, 'fleet_power', 'instanttextboxtype').children[1].textContent, '1234');
assert.equal(view.findIn(result.entry, 'activity', 'instanttextboxtype').textContent, '正在移动 → 太阳系');
assert.equal(view.findIn(result.entry, 'growth_interface').style.display, 'none');
assert.equal(view.findIn(result.entry, 'cloaking_values').style.display, 'none');
assert.equal(view.find('fleets').style.height, '345px');
assert.equal(view.find('fleets').style.width, '510px');
assert.equal(view.find('fleets').style.overflowX, 'hidden');
assert.equal(view.root.style.height, '368px');

const fleetName = view.findIn(result.entry, 'fleet_name', 'instanttextboxtype');
assert.equal(fleetName.style.height, '20px');
assert.equal(fleetName.style.lineHeight, '20px');

const shipList = view.findIn(result.entry, 'ships', 'smoothlistboxtype');
assert.equal(shipList.style.width, '510px');
assert.equal(shipList.style.overflowX, 'hidden');
const rows = view.findAll('fleet_view_subentry', shipList, 'containerwindowtype');
assert.equal(rows.length, 2);
assert.equal(view.findIn(rows[0], 'name', 'instanttextboxtype').textContent, '长矛号 · 护卫舰');
assert.equal(view.findIn(rows[0], 'health', 'icontype').attributes['aria-valuenow'], '75');
assert.equal(view.findIn(rows[0], 'health', 'icontype').style.width, '7px');
assert.equal(view.findIn(rows[0], 'health', 'icontype').style.height, '40px');
assert.equal(view.findIn(rows[0], 'armor', 'icontype').children[0].style.clipPath, 'inset(50% 0 0 0)');
assert.equal(view.findIn(rows[0], 'armor', 'icontype').children[0].children[0].style.transform, 'rotate(90deg) translateY(-100%)');
assert.equal(view.findIn(rows[0], 'icon', 'icontype').dataset.guiDynamicFrame, '2');
view.findIn(rows[0], 'inspect', 'buttontype').onclick({ stopPropagation() {} });
assert.equal(openedShip, 11);

console.log('fleet view binding tests passed');

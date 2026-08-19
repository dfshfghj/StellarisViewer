import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';
import { mountGui } from './gui-runtime.js';
import {
    bindOverviewPanelData,
    civilianFleetType,
    normalizeOverviewSectors,
    planetClassShort,
} from './overview-panel-binding.js';

assert.equal(planetClassShort('pc_continental'), 'Continental');
assert.equal(planetClassShort('pc_custom'), 'custom');
assert.equal(civilianFleetType('ISS Science Explorer'), 'Science ship');
assert.equal(civilianFleetType('Unnamed'), 'Civilian ship');

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
    guiPath: resolve(assetsDirectory, 'interface/outliner.gui'),
    assetsDirectory,
    rootName: 'outliner_tab_window',
});
const container = new FakeElement('main');
const view = mountGui(container, definition, { baseUrl: '/', applyRootPosition: false, localize: key => key });
let openedFleet = null;
let openedPlanet = null;
const result = bindOverviewPanelData(view, {
    planets: [{ id: 3, name: '新地球', planet_class: 'pc_continental', num_pops: 42 }],
    sectors: [{
        id: 1,
        name: '太阳星域',
        local_capital: 3,
        sector_type: 'core_sector',
        planets: [{ id: 3, name: '新地球', planet_class: 'pc_continental', num_pops: 42 }],
    }],
    fleets: [
        { id: 7, name: '第一舰队', military_power: 1234, ship_count: 5, civilian: false, station: false },
        { id: 8, name: 'Science Explorer', military_power: 0, ship_count: 1, civilian: true, station: false },
        { id: 9, name: '太阳星港', military_power: 800, ship_count: 0, civilian: true, station: true },
    ],
    military_power: 2034,
    empire_size: 88,
    num_pops: 42,
}, {
    onFleetClick: id => { openedFleet = id; },
    onPlanetClick: id => { openedPlanet = id; },
});

assert.equal(view.find('tab_name').textContent, 'Overview');
assert.equal(view.find('options').style.display, undefined);
assert.equal(result.sections.length, 5);
assert.equal(result.sectors.length, 1);
assert.equal(result.military.length, 1);
assert.equal(result.civilian.length, 1);
assert.equal(result.stations.length, 1);
assert.equal(result.sections[0].style.left, 'auto');
assert.equal(result.sections[0].style.height, '119px');

const planetList = view.findIn(result.sections[0], 'list', 'smoothlistboxtype');
const sectorRow = view.findAll('outliner_member_sector_entry_window', planetList, 'containerwindowtype')[0];
assert.equal(view.findIn(sectorRow, 'name', 'instanttextboxtype').textContent, '太阳星域');
assert.equal(view.findIn(sectorRow, 'colony_count', 'instanttextboxtype').textContent, '1');
const planetRow = view.findAll('outliner_member_planet_entry_window', planetList, 'containerwindowtype')[0];
assert.equal(view.findIn(planetRow, 'name', 'instanttextboxtype').textContent, '新地球');
assert.equal(view.findIn(planetRow, 'colony_type', 'instanttextboxtype').textContent, 'Continental · 42 Population');
assert.equal(view.findIn(planetRow, 'planet_type_icon', 'icontype').dataset.overviewIcon, '/gfx/interface/icons/planet.webp');
planetRow.onclick();
assert.equal(openedPlanet, 3);

const militaryList = view.findIn(result.sections[1], 'list', 'smoothlistboxtype');
const militaryRow = view.findAll('outliner_member_fleet_entry_window', militaryList, 'containerwindowtype')[0];
assert.equal(view.findIn(militaryRow, 'name', 'instanttextboxtype').textContent, '第一舰队');
assert.equal(view.findIn(militaryRow, 'size_limit', 'instanttextboxtype').textContent, '5 ships');
assert.equal(view.findIn(militaryRow, 'offensive_power', 'instanttextboxtype').children[0].src, '/gfx/interface/system/offensive_value.webp');
militaryRow.onclick();
assert.equal(openedFleet, 7);

const civilianList = view.findIn(result.sections[2], 'list', 'smoothlistboxtype');
const civilianRow = view.findAll('outliner_member_fleet_civilian_entry_window', civilianList, 'containerwindowtype')[0];
assert.equal(view.findIn(civilianRow, 'type', 'instanttextboxtype').textContent, 'Science ship');

const stationList = view.findIn(result.sections[3], 'list', 'smoothlistboxtype');
const stationRow = view.findAll('outliner_member_starbase_entry_window', stationList, 'containerwindowtype')[0];
assert.equal(view.findIn(stationRow, 'name', 'instanttextboxtype').textContent, '太阳星港');
assert.equal(view.findIn(stationRow, 'military_power', 'instanttextboxtype').children[1].textContent, '800');

assert.equal(view.root.style.width, '260px');
assert.equal(view.root.style.height, '20px');

assert.equal(normalizeOverviewSectors({
    planets: [{ id: 5, name: '边境星' }],
    sectors: [],
})[0].name, 'Frontier Sector');

console.log('overview panel binding tests passed');

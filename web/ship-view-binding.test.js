import assert from 'node:assert/strict';
import {
    COMPONENT_PLACEHOLDER,
    bindShipViewData,
    formatShipNumber,
    slotFrameIndex,
} from './ship-view-binding.js';

assert.equal(formatShipNumber(undefined), '—');
assert.equal(formatShipNumber(999), '999');
assert.equal(formatShipNumber(1200), '1.2K');
assert.equal(formatShipNumber(125000), '125K');
assert.equal(formatShipNumber(3.25, 1), '3.3');
assert.equal(slotFrameIndex('PD_01', 'weapon'), 3);
assert.equal(slotFrameIndex('EXTRA_LARGE_01', 'weapon'), 8);
assert.equal(slotFrameIndex('STRIKE_CRAFT_01', 'weapon'), 13);
assert.equal(slotFrameIndex('SMALL_GUN_01', 'weapon'), 4);
assert.equal(slotFrameIndex('SMALL_UTILITY_01', 'utility'), 0);
assert.equal(slotFrameIndex('AUX_UTILITY_01', 'utility'), 11);

function element(name, type, backgroundImage = '') {
    return {
        dataset: { guiName: name, guiType: type },
        style: { backgroundImage },
        scoped: [],
        children: [],
        setAttribute(key, value) { this[key] = String(value); },
    };
}

function fakeView() {
    const root = element('ship_view', 'containerwindowtype');
    const nodes = new Map();
    const add = node => { nodes.set(node.dataset.guiName, node); return node; };
    add(element('name', 'instanttextboxtype'));
    add(element('type', 'instanttextboxtype'));
    const stats = add(element('stats', 'containerwindowtype'));
    for (const name of [
        'hitpoints_value', 'armor_value', 'shields_value', 'speed_value',
        'evasion_value', 'damage_value', 'rank_value', 'cloaking',
        'cloaking_level', 'growth',
    ]) stats.scoped.push(element(name, name === 'cloaking_level' ? 'icontype' : 'instanttextboxtype'));
    add(element('rename_button', 'buttontype'));
    const components = add(element('components', 'containerwindowtype'));
    components.scoped.push(element('components', 'gridboxtype'));
    add(element('component_sets', 'smoothlistboxtype'));

    const instances = [];
    const view = {
        root,
        instances,
        find: name => nodes.get(name) || null,
        findAll: (name, _scope, type) => [...nodes.values()].filter(node =>
            node.dataset.guiName === name && (!type || node.dataset.guiType === type)),
        findIn: (scope, name, type = null) => scope.scoped.find(node =>
            node.dataset.guiName === name && (!type || node.dataset.guiType === type)) || null,
        instantiate(templateName, parent, overrides) {
            const instance = element(templateName, 'containerwindowtype');
            instance.dataset.guiInstance = overrides.name;
            if (templateName === 'ship_view_required_component_entry') {
                instance.scoped.push(element('icon', 'icontype', 'url("/ship-part-bg.webp")'));
            } else if (templateName === 'ship_view_component_entry') {
                instance.scoped.push(element('icon', 'icontype', 'url("/ship-part-bg.webp")'));
                instance.scoped.push(element('icon_bg', 'icontype', 'url("/slot.webp")'));
            } else if (templateName === 'ship_view_armaments') {
                instance.scoped.push(element('armaments', 'gridboxtype'));
            } else if (templateName === 'ship_view_utilities') {
                instance.scoped.push(element('utilities', 'gridboxtype'));
            }
            parent.children.push(instance);
            instances.push(instance);
            return instance;
        },
    };
    return view;
}

const view = fakeView();
bindShipViewData(view, {
    name: '测试舰',
    design_name: '长剑级',
    max_hitpoints: 100,
    max_armor: 80,
    max_shield: 50,
    speed: 3.25,
    core_components: ['FISSION_REACTOR', 'UNKNOWN_CORE'],
    weapons: [
        { slot: 'PD_01', template: 'POINT_DEFENCE' },
        { slot: 'EXTRA_LARGE_01', template: 'XL_CANNON' },
    ],
    utilities: [{ slot: 'AUX_UTILITY_01', template: 'AUX_FIRE_CONTROL' }],
}, {
    FISSION_REACTOR: '/reactor.webp',
    POINT_DEFENCE: '/pd.webp',
    XL_CANNON: '/xl.webp',
    AUX_FIRE_CONTROL: '/aux.webp',
});

assert.equal(view.find('name').textContent, '测试舰');
assert.equal(view.find('name').dataset.guiText, '测试舰');
assert.equal(view.find('type').textContent, '长剑级');
assert.equal(view.findIn(view.find('stats'), 'hitpoints_value').textContent, '100');
assert.equal(view.findIn(view.find('stats'), 'speed_value').textContent, '3.3');
assert.equal(view.findIn(view.find('stats'), 'evasion_value').textContent, '—');
assert.equal(view.findIn(view.find('stats'), 'rank_value').textContent, '—');
assert.equal(view.findIn(view.find('stats'), 'growth').style.display, 'none');
assert.equal(view.findIn(view.find('stats'), 'cloaking_level').style.display, 'none');
assert.equal(view.find('rename_button').disabled, true);

const cores = view.instances.filter(instance => /^core-\d+$/.test(instance.dataset.guiInstance));
const weapons = view.instances.filter(instance => /^weapon-\d+$/.test(instance.dataset.guiInstance));
const utilities = view.instances.filter(instance => /^utility-\d+$/.test(instance.dataset.guiInstance));
assert.equal(cores.length, 2);
assert.equal(weapons.length, 2);
assert.equal(utilities.length, 1);
assert.equal(view.findIn(cores[0], 'icon').dataset.componentIcon, '/reactor.webp');
assert.equal(view.findIn(cores[1], 'icon').dataset.componentIcon, COMPONENT_PLACEHOLDER);
assert.equal(view.findIn(weapons[0], 'icon_bg').dataset.componentSlotFrame, '3');
assert.equal(view.findIn(weapons[1], 'icon_bg').dataset.componentSlotFrame, '8');
assert.equal(view.findIn(utilities[0], 'icon_bg').dataset.componentSlotFrame, '11');

console.log('ship view binding tests passed');

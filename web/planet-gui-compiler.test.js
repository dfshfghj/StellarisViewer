import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';

const assetsDirectory = resolve('assets');
const definition = compileGuiView({
    guiPath: resolve(assetsDirectory, 'interface/planet_view.gui'),
    assetsDirectory,
    rootName: 'planet_view',
});

assert.ok(definition.templates.planet_view);
assert.ok(definition.templates.planet_district_entry_width_1);
assert.ok(definition.templates.planet_district_entry_width_2);
assert.deepEqual(definition.templates.planet_view.props.size, { width: 1162, height: 680 });
assert.deepEqual(definition.unresolvedSprites, []);
assert.equal(definition.resources.GFX_tiles_dark_area_cut_8.type, 'corneredtilespritetype');

const runtimeResources = Object.values(definition.resources)
    .filter(resource => !resource.texture)
    .map(resource => resource.name)
    .sort();
assert.deepEqual(runtimeResources, [
    'GFX_portrait_planet',
    'GFX_species_piechart_default',
    'GFX_species_piechart_hover_colored',
]);

function find(node, name, type = null) {
    if (node.name === name && (!type || node.type === type)) return node;
    for (const child of node.children) {
        const result = find(child, name, type);
        if (result) return result;
    }
    return null;
}

const root = definition.templates.planet_view;
assert.deepEqual(find(root, 'planet_view_bg').props.size, { width: 850, height: 613 });
assert.deepEqual(find(root, 'side_bar_window_always_open').props.size, { width: 312, height: 631 });
assert.deepEqual(find(root, 'districts_grid_box', 'gridboxtype').props.slotsize, { width: 281, height: 155 });
assert.equal(find(root, 'modifiers', 'overlappingelementsboxtype').type, 'overlappingelementsboxtype');

console.log('planet gui compiler tests passed');

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';

const definition = compileGuiView({
    guiPath: resolve('assets/interface/main.gui'),
    assetsDirectory: resolve('assets'),
    rootName: 'maingui',
});

function find(node, name, type = null) {
    if (node.name === name && (!type || node.type === type)) return node;
    for (const child of node.children) {
        const result = find(child, name, type);
        if (result) return result;
    }
    return null;
}

const root = definition.templates.maingui;
const resourceBar = find(root, 'topbar_static', 'containerwindowtype');
assert.ok(resourceBar);
assert.deepEqual(resourceBar.props.position, { x: 57, y: 0 });
assert.deepEqual(find(resourceBar, 'tb_energy_group').props.position, { x: 2, y: 0 });
assert.deepEqual(find(resourceBar, 'tb_research_group', 'dropdownboxtype').props.position, { x: 640, y: 0 });
assert.deepEqual(find(resourceBar, 'navy_group').props.position, { x: 924, y: 0 });
assert.ok(definition.templates.single_resource_entry);
assert.equal(definition.resources.GFX_topbar_button_narrow_hover.frames, 2);
assert.equal(definition.resources.GFX_subwindow_tile_plain_solid.type, 'corneredtilespritetype');
assert.deepEqual(definition.unresolvedSprites, []);
assert.deepEqual(definition.diagnostics.unresolvedVariables, []);

console.log('main GUI compiler tests passed');

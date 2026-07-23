import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';

const assetsDirectory = resolve('assets');
const definition = compileGuiView({
    guiPath: resolve(assetsDirectory, 'interface/fleet_view.gui'),
    assetsDirectory,
    rootName: 'fleet_view',
});

for (const name of ['fleet_view', 'fleet_view_entry', 'fleet_view_subentry', 'fleet_view_summary']) {
    assert.ok(definition.templates[name], `missing ${name}`);
}
assert.deepEqual(definition.templates.fleet_view.props.size, { width: 510, height: 45 });
assert.deepEqual(definition.templates.fleet_view_entry.props.size, { width: 510, height: 259 });
assert.deepEqual(definition.templates.fleet_view_subentry.props.size, { width: 510, height: 42 });
assert.deepEqual(definition.unresolvedSprites, []);

for (const name of ['GFX_fleet_view_health', 'GFX_fleet_view_armor', 'GFX_fleet_view_shields']) {
    const resource = definition.resources[name];
    assert.equal(resource.type, 'progressbartype');
    assert.deepEqual(resource.properties.size, { x: 7, y: 40 });
    assert.equal(resource.properties.horizontal, false);
}

// These variables are referenced only by the unused shipyard copy of the
// ordinary entry. Keep the known limitation scoped so it cannot silently grow.
assert.equal(definition.diagnostics.unresolvedVariables.length, 26);
assert.ok(definition.diagnostics.unresolvedVariables.every(item =>
    item.path.startsWith('fleet_view_shipyard_entry/')));

console.log('fleet gui compiler tests passed');

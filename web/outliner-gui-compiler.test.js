import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGuiView } from './gui-compiler.js';

const assetsDirectory = resolve('assets');
const definition = compileGuiView({
    guiPath: resolve(assetsDirectory, 'interface/outliner.gui'),
    assetsDirectory,
    rootName: 'outliner_tab_window',
});

for (const name of [
    'tabs_gridbox_entry',
    'tabs_outliner_window',
    'outliner_tab_window',
    'outliner_controller_window',
    'outliner_options_window',
    'outliner_rearrange_window',
    'outliner_title_entry_window',
    'outliner_member_planet_entry_window',
    'outliner_member_fleet_entry_window',
    'outliner_member_fleet_civilian_entry_window',
    'outliner_member_starbase_entry_window',
]) assert.ok(definition.templates[name], `missing ${name}`);

assert.deepEqual(definition.templates.tabs_outliner_window.props.size, { width: 260, height: 50 });
assert.deepEqual(definition.templates.tabs_outliner_window.props.position, { x: -260, y: 159 });
assert.deepEqual(definition.templates.outliner_tab_window.props.size, { width: 260, height: 20 });
assert.deepEqual(definition.templates.outliner_tab_window.props.position, { x: -260, y: 186 });
assert.deepEqual(definition.templates.outliner_controller_window.props.size, { width: 260, height: 100 });
assert.deepEqual(definition.templates.outliner_controller_window.props.position, { x: -260, y: 150 });
assert.deepEqual(definition.templates.outliner_options_window.props.size, { width: 300, height: 625 });
assert.deepEqual(definition.templates.outliner_rearrange_window.props.size, { width: 300, height: 580 });
assert.deepEqual(definition.templates.outliner_title_entry_window.props.size, { width: 320, height: 38 });
assert.deepEqual(definition.templates.outliner_member_planet_entry_window.props.size, { width: 318, height: 41 });
for (const name of [
    'outliner_button',
    'observer_outliner_button',
    'scrollbar_leftbutton',
    'scrollbar_rightbutton',
    'gfx_transparency_button',
]) assert.ok(definition.resources[name], `missing non-GFX resource ${name}`);
assert.deepEqual(definition.unresolvedSprites, []);

assert.equal(definition.diagnostics.unresolvedVariables.length, 6);
assert.ok(definition.diagnostics.unresolvedVariables.every(item =>
    item.path.startsWith('outliner_member_megastructure_entry_window/')
        || item.path.startsWith('outliner_member_shipyard_entry_window/')));
assert.deepEqual(
    definition.diagnostics.missingTextures.map(item => item.resource).sort(),
    ['GFX_line_horizontal', 'GFX_situation_middle_indicator', 'GFX_situation_progress_directions', 'GFX_situation_start_indicator'],
);

console.log('outliner gui compiler tests passed');

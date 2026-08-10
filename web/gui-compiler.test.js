import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { compileGfxRegistry, compileGui, compileGuiView } from './gui-compiler.js';

const assetsDirectory = resolve('assets');
const definition = compileGuiView({
    guiPath: resolve(assetsDirectory, 'interface/ship_view.gui'),
    assetsDirectory,
    rootName: 'ship_view',
});

assert.equal(definition.variables['@view_w'], 650);
assert.equal(definition.variables['@component_h'], 78);
assert.ok(definition.templates.ship_view);
assert.ok(definition.templates.ship_view_component_entry);
assert.ok(definition.templates.ship_view_required_component_entry);

const root = definition.templates.ship_view;
assert.deepEqual(root.props.size, { width: 650, height: 650 });

function find(node, name) {
    if (node.name === name) return node;
    for (const child of node.children) {
        const result = find(child, name);
        if (result) return result;
    }
    return null;
}

assert.deepEqual(find(root, 'ship_model').props.position, { x: 15, y: 65 });
assert.deepEqual(find(root, 'stats').props.position, { x: -15, y: 65 });
assert.deepEqual(find(root, 'components').props.size, { width: 358, height: 78 });
assert.deepEqual(find(root, 'component_sets').props.size, { x: 630, y: 320 });
assert.deepEqual(find(root, 'buttons').props.position, { x: 0, y: 588 });

assert.equal(definition.resources.GFX_tile_outliner_bg.type, 'corneredtilespritetype');
assert.deepEqual(definition.resources.GFX_tile_outliner_bg.border, { x: 80, y: 30 });
assert.equal(definition.resources.GFX_close_square.frames, 3);
assert.deepEqual(definition.resources.GFX_close_square.dimensions, { width: 114, height: 38 });
assert.equal(definition.resources.GFX_ship_designer_slot.frames, 16);
assert.equal(definition.resources.GFX_standard_button_240_34_button.frames, 3);
assert.equal(definition.resources.GFX_dummy_3d_ship_details.type, 'spritetype');
assert.deepEqual(definition.unresolvedSprites, []);
assert.deepEqual(definition.diagnostics.unresolvedVariables, []);

const semantics = compileGui(`
    @global = 10
    guiTypes = {
        containerWindowType = {
            name = "semantic_root"
            @local = 20
            size = { width = @local height = @global }
            orientation = upper_left
            orientation = upper_right
            if_resolution = {
                min_width = 1280
                @conditional_x = 42
                position = { x = @conditional_x y = 3 }
                iconType = { name = "conditional_icon" spriteType = "GFX_conditional" }
            }
            if_scaled_resolution = { max_height = 720 size = { width = "100%" height = -20 } }
            windowType = { name = "window" }
            effectButtonType = { name = "effect_button" }
            extendedScrollbarType = { name = "extended_scrollbar" }
            spinnerType = { name = "spinner" }
            guiButtonType = { name = "gui_button" }
            positionType = { name = "position" position = { x = 1 y = 2 } }
            listboxType = { name = "listbox" }
            dropDownBoxType = { name = "dropdown" }
            expandButton = { name = "expand" }
            expandedWindow = { name = "expanded" }
            textBoxType = { name = "legacy_text" text = "TEXT" }
            slider = { name = "slider" }
            track = { name = "track" }
            overlay = { name = "overlay" spriteType = "GFX_overlay" }
            decreaseButton = { name = "decrease" }
            increaseButton = { name = "increase" }
        }
        containerWindowType = {
            name = "diagnostic_root"
            @global = 30
            size = { width = @missing height = @global }
        }
    }
`);

const semanticRoot = semantics.templates.semantic_root;
assert.deepEqual(semanticRoot.props.size, { width: 20, height: 10 });
assert.equal(semanticRoot.props.orientation, 'upper_right');
assert.equal(semanticRoot.variables['@local'], 20);
assert.deepEqual(semanticRoot.children.map(child => child.type), [
    'windowtype',
    'effectbuttontype',
    'extendedscrollbartype',
    'spinnertype',
    'guibuttontype',
    'positiontype',
    'listboxtype',
    'dropdownboxtype',
    'expandbutton',
    'expandedwindow',
    'textboxtype',
    'slider',
    'track',
    'overlay',
    'decreasebutton',
    'increasebutton',
]);
assert.equal(semanticRoot.conditions[0].type, 'if_resolution');
assert.equal(semanticRoot.conditions[0].childIndex, 0);
assert.equal(semanticRoot.conditions[0].minWidth, 1280);
assert.deepEqual(semanticRoot.conditions[0].props.position, { x: 42, y: 3 });
assert.equal(semanticRoot.conditions[0].children[0].name, 'conditional_icon');
assert.equal(semanticRoot.conditions[1].type, 'if_scaled_resolution');
assert.deepEqual(semanticRoot.conditions[1].props.size, { width: '100%', height: -20 });
assert.deepEqual(semantics.diagnostics.duplicateVariables, [{ name: '@global', path: 'diagnostic_root' }]);
assert.deepEqual(semantics.diagnostics.unresolvedVariables, [{ name: '@missing', path: 'diagnostic_root/size/width' }]);

const gfx = compileGfxRegistry(assetsDirectory);
assert.equal(gfx.GFX_ncp_scroll_bg.texture, 'gfx/interface/sliders/ncp_scroll_bg.webp');
assert.equal(gfx.GFX_tutorial_entry_animation_1.effectFile, 'gfx/FX/buttonstate_onlydisable.shader');
assert.equal(gfx.GFX_tutorial_entry_animation_1.animations[0].animationrotation, 180);
assert.deepEqual(gfx.GFX_fleet_combat_progressbar.textures, [
    'gfx/interface/progressbars/fleet_combat_progeress_bar_green.webp',
    'gfx/interface/progressbars/fleet_combat_progeress_bar_red.webp',
]);
assert.equal(gfx.GFX_evt_archaeological_site_in_progress.maskingTexture, 'gfx/interface/situation_log/event_mask.webp');
assert.equal(gfx.GFX_evt_archaeological_site_in_progress.alwaysTransparent, true);
assert.equal(gfx.GFX_ship_designer_slot_indicator.fps, 10);

console.log('gui-compiler tests passed');

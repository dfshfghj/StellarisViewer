import assert from 'node:assert/strict';
import { guiLength, guiPositionLength, guiTransform, matchesGuiCondition, mountGui } from './gui-runtime.js';

assert.equal(guiLength(42), '42px');
assert.equal(guiLength('100%'), '100%');
assert.equal(guiLength('100%%', 24), 'calc(100% - (24px))');
assert.equal(guiLength(-8, 24), 'calc(100% - (24px) - (8px))');
assert.equal(guiLength('50%', 0, 10, 10), 'calc(50% - 10px)');
assert.equal(guiPositionLength(-8), '-8px');
assert.equal(guiPositionLength('25%'), '25%');

assert.equal(guiTransform({}), '');
assert.equal(guiTransform({ origo: 'center', scale: 0.5, rotation: 1.5708 }),
    'translate(-50%, -50%) scale(0.5) rotate(1.5708rad)');
assert.equal(guiTransform({ centerposition: true }), 'translate(-50%, -50%)');
assert.equal(guiTransform({ mirror: true }), 'scaleX(-1)');

const physical = { width: 2560, height: 1440 };
const scaled = { width: 1707, height: 960 };
assert.equal(matchesGuiCondition({ type: 'if_resolution', props: { min_width: 1920 } }, physical, scaled), true);
assert.equal(matchesGuiCondition({ type: 'if_resolution', props: { max_height: 1080 } }, physical, scaled), false);
assert.equal(matchesGuiCondition({ type: 'if_scaled_resolution', props: { max_height: 1080 } }, physical, scaled), true);

class FakeElement {
    constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.style = { setProperty: (key, value) => { this.style[key] = value; } };
        this.classList = { add: () => {} };
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

const rootNode = {
    type: 'containerwindowtype', name: 'root', path: 'root',
    props: { orientation: 'center', origo: 'center', size: { width: '100%', height: -5 } },
    conditions: [{
        type: 'if_scaled_resolution', childIndex: 0, props: { max_width: 1500, clipping: true },
        children: [{
            type: 'textboxtype', name: 'conditional_text', path: 'root/conditional_text[0]',
            props: {
                text: 'SMALL', pdx_tooltip: 'TIP', bordersize: { x: 4, y: 2 },
                texturefile: 'gfx/interface/tiles/tooltip.dds',
            }, children: [],
        }],
        conditions: [{
            type: 'if_resolution', childIndex: 1, props: { min_width: 2000, alwaystransparent: true },
            children: [{
                type: 'textboxtype', name: 'nested_text', path: 'root/nested_text[0]',
                props: { text: 'NESTED' }, children: [],
            }],
        }],
    }],
    children: [
        {
            type: 'buttontype', name: 'default_button', path: 'root/default_button[0]',
            props: { buttontext: 'BUTTON', buttonfont: 'malgun_goth_24' }, children: [],
        },
        {
            type: 'instanttextboxtype', name: 'default_text', path: 'root/default_text[0]',
            props: { text: 'TEXT', font: 'cg_16b', text_color_code: 'G' }, children: [],
        },
        {
            type: 'instanttextboxtype', name: 'muted_text', path: 'root/muted_text[0]',
            props: { text: 'MUTED', text_color_code: 'g' }, children: [],
        },
        {
            type: 'editboxtype', name: 'name', path: 'root/name[0]',
            props: { size: { x: 120, y: 20 }, max_characters: 12, font: 'large_title_font' }, children: [],
        },
        {
            type: 'smoothlistboxtype', name: 'list', path: 'root/list[0]',
            props: { background: 'GFX_masked', size: { x: 80, y: 40 } }, children: [{
                type: 'containerwindowtype', name: 'right_anchored_list_item', path: 'root/list[0]/right_anchored_list_item[0]',
                props: { orientation: 'upper_right', size: { x: 20, y: 10 } }, children: [],
            }],
        },
        {
            type: 'progressbartype', name: 'progress', path: 'root/progress[0]',
            props: { position: { x: -8, y: 0 }, size: { x: 100, y: 10 }, spritetype: 'GFX_progress' }, children: [],
        },
        {
            type: 'icontype', name: 'vertical_progress', path: 'root/vertical_progress[0]',
            props: { spritetype: 'GFX_vertical_progress' }, children: [],
        },
        {
            type: 'icontype', name: 'vertical_progress_flipped', path: 'root/vertical_progress_flipped[0]',
            props: { spritetype: 'GFX_vertical_progress_flipped' }, children: [],
        },
        {
            type: 'icontype', name: 'animated', path: 'root/animated[0]',
            props: { spritetype: 'GFX_animated' }, children: [],
        },
        {
            type: 'spinnertype', name: 'spinner', path: 'root/spinner[0]',
            props: { minvalue: 1, maxvalue: 5, stepsize: 1, startvalue: 2 }, children: [],
        },
        {
            type: 'scrollbartype', name: 'scroll', path: 'root/scroll[0]',
            props: { minvalue: 0, maxvalue: 10, startvalue: 5, horizontal: 1, slider: 'thumb' },
            children: [{
                type: 'guibuttontype', name: 'thumb', path: 'root/scroll[0]/thumb[0]',
                props: { position: { x: 2, y: 0 } }, children: [],
            }],
        },
        {
            type: 'containerwindowtype', name: 'inset_parent', path: 'root/inset_parent[0]',
            props: {
                size: { width: 200, height: 100 }, bordersize: { x: 10, y: 5 },
                margin: { left: 2, right: 4, top: 3, bottom: 1 },
            },
            children: [{
                type: 'icontype', name: 'inset_child', path: 'root/inset_parent[0]/inset_child[0]',
                props: { position: { x: 0, y: 0 }, size: { width: '100%', height: '100%' } }, children: [],
            }],
        },
        {
            type: 'containerwindowtype', name: 'line_parent', path: 'root/line_parent[0]',
            props: { size: { width: 8, height: 30 } }, children: [
                {
                    type: 'background', name: 'vertical_line_background',
                    path: 'root/line_parent[0]/vertical_line_background[0]',
                    props: { spritetype: 'GFX_vertical_line' }, children: [],
                },
                {
                    type: 'background', name: 'horizontal_line_background',
                    path: 'root/line_parent[0]/horizontal_line_background[0]',
                    props: { spritetype: 'GFX_horizontal_line' }, children: [],
                },
            ],
        },
        {
            type: 'gridboxtype', name: 'vertical_grid', path: 'root/vertical_grid[0]',
            props: { slotsize: { width: 20, height: 10 }, max_slots_vertical: 3 }, children: [],
        },
        {
            type: 'gridboxtype', name: 'horizontal_grid', path: 'root/horizontal_grid[0]',
            props: {
                slotsize: { width: 20, height: 10 }, max_slots_horizontal: 2,
                add_horizontal: true, format: 'UPPER_RIGHT',
            }, children: [],
        },
        {
            type: 'gridboxtype', name: 'inferred_horizontal_grid', path: 'root/inferred_horizontal_grid[0]',
            props: { slotsize: { width: 20, height: 10 }, max_slots_horizontal: 11 }, children: [],
        },
        {
            type: 'overlappingelementsboxtype', name: 'overlap', path: 'root/overlap[0]',
            props: { direction: 'horizontal', spacing: 4, first_on_top: true },
            children: [
                { type: 'icontype', name: 'overlap_a', path: 'root/overlap[0]/a[0]', props: {}, children: [] },
                { type: 'icontype', name: 'overlap_b', path: 'root/overlap[0]/b[0]', props: {}, children: [] },
            ],
        },
        {
            type: 'dropdownboxtype', name: 'choice', path: 'root/choice[0]', props: {}, children: [
                { type: 'expandbutton', name: 'expand_button', path: 'root/choice[0]/expand_button[0]', props: {}, children: [] },
                {
                    type: 'expandedwindow', name: 'expanded_window', path: 'root/choice[0]/expanded_window[0]',
                    props: { hide_position: { x: -12, y: 2 }, show_position: { x: 3, y: 40 } }, children: [],
                },
            ],
        },
    ],
};
const container = new FakeElement('main');
const resources = {
    GFX_masked: {
        type: 'spritetype', texture: 'gfx/base.webp', textures: ['gfx/base.webp'], frames: 1,
        maskingTexture: 'gfx/mask.webp', alwaysTransparent: true,
    },
    GFX_progress: {
        type: 'progressbartype', texture: 'gfx/fill.webp', textures: ['gfx/fill.webp', 'gfx/empty.webp'], frames: 1,
    },
    GFX_vertical_progress: {
        type: 'progressbartype', texture: 'gfx/vertical-fill.webp',
        textures: ['gfx/vertical-fill.webp', 'gfx/vertical-empty.webp'], frames: 1,
        dimensions: { width: 40, height: 10 },
        properties: { size: { x: 7, y: 40 }, horizontal: false, flipdirection: false },
    },
    GFX_vertical_progress_flipped: {
        type: 'progressbartype', texture: 'gfx/vertical-fill.webp',
        textures: ['gfx/vertical-fill.webp', 'gfx/vertical-empty.webp'], frames: 1,
        dimensions: { width: 40, height: 10 },
        properties: { size: { x: 7, y: 40 }, horizontal: false, flipdirection: true },
    },
    GFX_animated: {
        type: 'frameanimatedspritetype', texture: 'gfx/animated.webp', textures: ['gfx/animated.webp'],
        frames: 4, fps: 8, looping: true, playOnShow: true,
    },
    GFX_vertical_line: {
        type: 'spritetype', texture: 'gfx/vertical-line.webp', textures: ['gfx/vertical-line.webp'],
        frames: 1, dimensions: { width: 1, height: 30 },
    },
    GFX_horizontal_line: {
        type: 'spritetype', texture: 'gfx/horizontal-line.webp', textures: ['gfx/horizontal-line.webp'],
        frames: 1, dimensions: { width: 30, height: 1 },
    },
};
const textColors = {
    G: { red: 41, green: 225, blue: 38, alpha: 255 },
    g: { red: 128, green: 128, blue: 128, alpha: 128 },
};
const view = mountGui(container, { rootName: 'root', templates: { root: rootNode }, resources, textColors }, {
    baseUrl: '/', resolution: physical, uiScale: 0.5, localize: key => key === 'TIP' ? 'loc:TIP' : key,
});
assert.equal(view.root.style.width, '100%');
assert.equal(view.root.style.height, 'calc(100% - (5px))');
assert.equal(view.root.style.overflow, 'hidden');
assert.equal(view.root.style.pointerEvents, 'none');
assert.equal(view.find('conditional_text').textContent, 'SMALL');
assert.equal(view.find('conditional_text').attributes.title, 'loc:TIP');
assert.equal(view.find('conditional_text').style.padding, '2px 4px');
assert.equal(view.find('conditional_text').style.backgroundImage, 'url("/gfx/interface/tiles/tooltip.webp")');
assert.equal(view.root.children[0].dataset.guiName, 'conditional_text');
assert.equal(view.root.children[1].dataset.guiName, 'nested_text');
assert.equal(view.find('default_button').style.textAlign, 'center');
assert.equal(view.find('default_button').style.fontFamily, '"Malgun Gothic", "Noto Sans", Arial, sans-serif');
assert.equal(view.find('default_button').style.fontWeight, undefined);
assert.equal(view.find('default_text').style.textAlign, 'left');
assert.equal(view.find('default_text').style.fontFamily, '"Century Gothic", "Noto Sans", Arial, sans-serif');
assert.equal(view.find('default_text').style.fontWeight, '700');
assert.equal(view.find('default_text').style.color, 'rgb(41, 225, 38)');
assert.equal(view.find('muted_text').style.color, 'rgba(128, 128, 128, 0.502)');
assert.equal(view.find('vertical_line_background').style.backgroundSize, '');
assert.equal(view.find('vertical_line_background').style.backgroundPosition, undefined);
assert.equal(view.find('horizontal_line_background').style.backgroundSize, '');
assert.equal(view.find('horizontal_line_background').style.backgroundPosition, undefined);
assert.equal(view.find('name').tagName, 'INPUT');
assert.equal(view.find('name').maxLength, 12);
assert.equal(view.find('name').style.fontFamily, 'Orbitron, "Noto Sans", Arial, sans-serif');
assert.equal(view.find('list').dataset.guiSprite, 'GFX_masked');
assert.equal(view.find('list').style.maskImage, 'url("/gfx/mask.webp")');
assert.equal(view.find('list').style.pointerEvents, 'none');
assert.equal(view.find('right_anchored_list_item').style.left, 'auto');
assert.equal(view.find('right_anchored_list_item').style.top, 'auto');
assert.equal(view.find('progress').style.left, 'calc(0% + -8px)');
assert.equal(view.find('progress').style.backgroundImage, 'url("/gfx/empty.webp")');
assert.equal(view.find('progress').children[0].style.backgroundImage, 'url("/gfx/fill.webp")');
assert.equal(view.setProgress('progress', 3, 4), true);
assert.equal(view.find('progress').children[0].style.width, '100%');
assert.equal(view.find('progress').children[0].style.clipPath, 'inset(0 25% 0 0)');
assert.equal(view.find('progress').attributes['aria-valuenow'], '3');
assert.equal(view.find('vertical_progress').style.width, '7px');
assert.equal(view.find('vertical_progress').style.height, '40px');
assert.equal(view.find('vertical_progress').dataset.guiProgressOrientation, 'vertical');
assert.equal(view.setProgress('vertical_progress', 1, 4), true);
assert.equal(view.find('vertical_progress').children[0].style.clipPath, 'inset(75% 0 0 0)');
assert.equal(view.find('vertical_progress').children[0].style.background, 'transparent');
assert.equal(view.find('vertical_progress').style.backgroundImage, 'none');
assert.equal(view.find('vertical_progress').children[0].children[0].style.width, '40px');
assert.equal(view.find('vertical_progress').children[0].children[0].style.height, '7px');
assert.equal(view.find('vertical_progress').children[0].children[0].style.transform, 'rotate(90deg) translateY(-100%)');
assert.equal(view.find('vertical_progress').children[1].style.backgroundImage, 'url("/gfx/vertical-empty.webp")');
assert.equal(view.find('vertical_progress').children[1].style.transform, 'rotate(90deg) translateY(-100%)');
assert.equal(view.setProgress('vertical_progress_flipped', 1, 4), true);
assert.equal(view.find('vertical_progress_flipped').children[0].style.clipPath, 'inset(0 0 75% 0)');
assert.equal(view.find('animated').style.animation, 'cw-frame-animation 0.5s steps(3, end) infinite');
assert.equal(view.find('spinner').attributes['aria-valuenow'], '2');
assert.equal(view.setControlValue('spinner', 99), true);
assert.equal(view.find('spinner').value, 5);
assert.equal(view.find('thumb').style.left, 'calc(calc(0% + 2px) + 50%)');
assert.equal(view.setControlValue('scroll', 10), true);
assert.equal(view.find('thumb').style.left, 'calc(calc(0% + 2px) + 100%)');
assert.equal(view.find('inset_child').style.left, 'calc(0% + 0px + 12px)');
assert.equal(view.find('inset_child').style.top, 'calc(0% + 0px + 8px)');
assert.equal(view.find('inset_child').style.width, 'calc(100% - 26px)');
assert.equal(view.find('inset_child').style.height, 'calc(100% - 14px)');
assert.equal(view.find('vertical_grid').style.gridAutoFlow, 'column');
assert.equal(view.find('vertical_grid').style.gridTemplateRows, 'repeat(3, 10px)');
assert.equal(view.find('horizontal_grid').style.gridAutoFlow, 'row');
assert.equal(view.find('horizontal_grid').style.gridTemplateColumns, 'repeat(2, 20px)');
assert.equal(view.find('horizontal_grid').style.justifyContent, 'end');
assert.equal(view.find('inferred_horizontal_grid').style.gridAutoFlow, 'row');
assert.equal(view.find('inferred_horizontal_grid').style.gridTemplateColumns, 'repeat(11, 20px)');
const overlap = view.find('overlap');
overlap.clientWidth = 60;
overlap.children[0].offsetWidth = 40;
overlap.children[1].offsetWidth = 40;
overlap.layoutOverlaps();
assert.equal(overlap.children[1].style.marginLeft, '-20px');
assert.equal(overlap.children[0].style.zIndex, '2');
assert.equal(view.find('expanded_window').hidden, true);
assert.equal(view.find('expanded_window').style.left, '-12px');
assert.equal(view.setDropdownExpanded('choice', true), true);
assert.equal(view.find('expanded_window').hidden, false);
assert.equal(view.find('expanded_window').style.top, '40px');

const embeddedContainer = new FakeElement('main');
const embedded = mountGui(embeddedContainer, { rootName: 'root', templates: { root: rootNode }, resources }, {
    baseUrl: '/', resolution: physical, applyRootPosition: false,
});
assert.equal(embedded.root.style.left, undefined);
assert.equal(embedded.root.style.transform, '');

console.log('gui runtime tests passed');

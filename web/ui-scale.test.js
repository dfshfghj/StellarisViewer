import assert from 'node:assert/strict';
import { configureGameUiScale, screenToUi, UI_SCALE } from './ui-scale.js';

const properties = {};
const layer = {
    dataset: {},
    style: { setProperty: (name, value) => { properties[name] = value; } },
};

configureGameUiScale(layer);
assert.equal(UI_SCALE, 0.67);
assert.equal(properties['--ui-scale'], '0.67');
assert.equal(properties['--ui-coordinate-size'], `${100 / 0.67}%`);
assert.equal(layer.dataset.uiScale, '0.67');
assert.equal(screenToUi(67), 100);

console.log('UI scale tests passed');

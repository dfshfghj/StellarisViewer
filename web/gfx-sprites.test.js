import assert from 'node:assert/strict';
import { SHIP_SIZE_FRAME_COUNT, shipSizeFrame, spriteFrame } from './gfx-sprites.js';

assert.equal(SHIP_SIZE_FRAME_COUNT, 27);
assert.equal(shipSizeFrame('science'), 8);
assert.equal(shipSizeFrame('constructor'), 9);
assert.equal(shipSizeFrame('colonizer'), 10);
assert.equal(shipSizeFrame('transport'), 11);
assert.equal(shipSizeFrame('corvette'), 2);
assert.equal(shipSizeFrame('battleship'), 5);
assert.equal(shipSizeFrame('not_a_ship_size'), 12);

const middleFrame = spriteFrame('/sheet.webp', 3, 1, 'test-sprite');
assert.match(middleFrame, /--frames:3/);
assert.match(middleFrame, /--frame-position:50%/);

const clampedFrame = spriteFrame('/sheet.webp', 3, 99);
assert.match(clampedFrame, /--frame-position:100%/);

console.log('✓ crops GFX sprite sheets and clamps semantic frame mappings');

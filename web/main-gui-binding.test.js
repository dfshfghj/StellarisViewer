import assert from 'node:assert/strict';
import {
    RESOURCE_GROUPS,
    STRATEGIC_CATEGORIES,
    computeResourceGroup,
    formatResourceNumber,
    formatResourceRow,
    visibleResourceCategories,
} from './main-gui-binding.js';

assert.equal(formatResourceNumber(12_345), '12.3K');
assert.equal(formatResourceNumber(1_234), '1.23K');
assert.equal(formatResourceNumber(-12.345), '-12.3');

const energy = RESOURCE_GROUPS.find(group => group.key === 'energy');
assert.deepEqual(
    computeResourceGroup(energy, {}, { energy: 1234 }, { energy: -2.5 }),
    { text: '1.23K', delta: -2.5, className: 'negative', tooltip: 'Energy credits: 1.23K (-2.5)' },
);

const strategic = RESOURCE_GROUPS.find(group => group.name === 'tb_others_group');
const composite = computeResourceGroup(
    strategic,
    {},
    { volatile_motes: 10, exotic_gases: 5 },
    { volatile_motes: 1, exotic_gases: -0.5 },
);
assert.equal(composite.text, '15');
assert.equal(composite.delta, 0.5);
assert.equal(composite.className, 'positive');

assert.equal(visibleResourceCategories(STRATEGIC_CATEGORIES, {}).length, 1);
assert.equal(visibleResourceCategories(STRATEGIC_CATEGORIES, { minor_artifacts: 1 }).length, 2);
assert.deepEqual(formatResourceRow('default', 50, -2), { text: '50 -2', className: 'negative' });
assert.deepEqual(formatResourceRow('balance_only', 0, 12), { text: '+12', className: '' });

console.log('main GUI binding tests passed');

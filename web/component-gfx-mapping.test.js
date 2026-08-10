import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildComponentIconMap } from './component-gfx-mapping.js';

const { icons, stats } = buildComponentIconMap(fileURLToPath(new URL('./assets', import.meta.url)));

assert.equal(
    icons.SMALL_MASS_DRIVER_2,
    '/gfx/interface/icons/ship_parts/ship_part_mass_driver_2.webp',
);
assert.equal(
    icons.SMALL_ARMOR_1,
    '/gfx/interface/icons/ship_parts/ship_part_armor_1.webp',
);
for (const component of [
    'CORVETTE_FISSION_REACTOR',
    'HYPER_DRIVE_1',
    'SHIP_THRUSTER_1',
    'SENSOR_1',
    'COMBAT_COMPUTER_DEFAULT',
    'MISSILE_1',
    'SMALL_SHIELD_1',
    'REACTOR_BOOSTER_1',
]) {
    assert.ok(icons[component], `missing icon mapping for ${component}`);
}
assert.equal(stats.missingSprites.length, 0, 'every referenced component GFX should resolve');
assert.ok(stats.mappedComponents > 500, `expected broad component coverage, got ${stats.mappedComponents}`);

console.log(`✓ maps ${stats.mappedComponents} component keys through component_templates and interface GFX`);

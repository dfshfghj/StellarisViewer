import assert from 'node:assert/strict';
import viteConfig from './vite.config.js';

const plugin = viteConfig.plugins.find(candidate => candidate.name === 'stellaris-localization');
plugin.configResolved({ root: process.cwd(), command: 'serve' });

const moduleId = plugin.resolveId('virtual:stellaris-localization');
const source = plugin.load(moduleId);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: loadLocalization } = await import(moduleUrl);

const localized = { NAME: '星联' };
let fetchCount = 0;
globalThis.fetch = async () => {
    fetchCount += 1;
    return { ok: true, json: async () => localized };
};

const first = loadLocalization();
const second = loadLocalization();

assert.strictEqual(first, second, 'concurrent callers should share the same localization promise');
assert.deepEqual(await first, localized);
assert.deepEqual(await loadLocalization(), localized);
assert.equal(fetchCount, 1, 'localization JSON should only be fetched once');

console.log('✓ loads localization JSON once across repeated callers');

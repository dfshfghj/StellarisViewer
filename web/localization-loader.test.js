import assert from 'node:assert/strict';
import viteConfig from './vite.config.js';

const plugin = viteConfig.plugins.find(candidate => candidate.name === 'stellaris-localization');
plugin.configResolved({ root: process.cwd(), command: 'serve' });

const moduleId = plugin.resolveId('virtual:stellaris-localization');
const source = plugin.load(moduleId);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: loadLocalization } = await import(moduleUrl);

const localized = { NAME: '星联' };
const english = { NAME: 'Star Union' };
const fetches = [];
globalThis.fetch = async (url) => {
    fetches.push(url);
    return { ok: true, json: async () => url.endsWith('/zh') ? localized : english };
};

assert.deepEqual(fetches, [], 'importing the loader must not fetch localization data');
const first = loadLocalization('zh');
const second = loadLocalization('zh');

assert.strictEqual(first, second, 'concurrent callers should share the same localization promise');
assert.deepEqual(await first, localized);
assert.deepEqual(await loadLocalization('zh'), localized);
assert.deepEqual(await loadLocalization(), english, 'English is the default game language');
assert.deepEqual(fetches, ['/@stellaris-localization/zh', '/@stellaris-localization/en']);

console.log('✓ lazily loads and caches localization JSON per language');

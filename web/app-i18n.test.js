import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, getLanguage, setLanguage, t } from './app-i18n.js';

assert.equal(DEFAULT_LANGUAGE, 'en');
assert.equal(getLanguage(), 'en');
assert.equal(t('app.title'), 'Stellaris Save Viewer');
assert.equal(t('loading.reading', { file: 'gamestate' }), 'Reading gamestate...');

setLanguage('zh');
assert.equal(getLanguage(), 'zh');
assert.equal(t('app.title'), 'Stellaris 存档查看器');
assert.equal(t('loading.reading', { file: 'gamestate' }), '正在读取 gamestate...');

setLanguage('unsupported');
assert.equal(getLanguage(), 'en', 'unsupported languages fall back to English');
assert.equal(t('missing.key'), 'missing.key', 'missing messages fall back to their key');

console.log('✓ supports English-by-default app messages and Chinese switching');

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildComponentIconMap } from '../component-gfx-mapping.js';
import { compileGfxRegistry, compileGuiView } from '../gui-compiler.js';

const root = resolve(import.meta.dirname, '..');
const assets = resolve(root, 'assets');
const generated = resolve(root, 'generated');
const views = [
    ['main.gui', 'maingui'],
    ['outliner.gui', 'outliner_tab_window'],
    ['fleet_view.gui', 'fleet_view'],
    ['ship_view.gui', 'ship_view'],
    ['planet_view.gui', 'planet_view'],
];

function writeJson(path, value) {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value)}\n`);
}

for (const [gui, rootName] of views) {
    writeJson(resolve(generated, 'gui', `${rootName}.json`), compileGuiView({
        guiPath: resolve(assets, 'interface', gui),
        assetsDirectory: assets,
        rootName,
        gfxRegistry: compileGfxRegistry(assets),
    }));
}

writeJson(resolve(generated, 'component-icons.json'), buildComponentIconMap(assets).icons);

const linePattern = /^\s*([^\s:#]+):(?:\d+)?\s+"((?:[^"\\]|\\.)*)"/;
function parseLocalization(directory) {
    const strings = {};
    for (const file of readDirRecursive(directory).sort()) {
        for (const line of readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
            const match = line.match(linePattern);
            if (!match) continue;
            strings[match[1]] = match[2]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
        }
    }
    return strings;
}

function readDirRecursive(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? readDirRecursive(path) : [path];
    });
}

for (const [language, directory] of [['en', 'english'], ['zh', 'simp_chinese']]) {
    writeJson(resolve(generated, 'localization', `${language}.json`), parseLocalization(resolve(assets, 'localisation', directory)));
}

console.log(`Generated Pages build data in ${generated}`);

import { cpSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { buildComponentIconMap } from './component-gfx-mapping.js';

const LOCALIZATION_MODULE_ID = 'virtual:stellaris-localization';
const RESOLVED_LOCALIZATION_MODULE_ID = `\0${LOCALIZATION_MODULE_ID}`;
const COMPONENT_ICONS_MODULE_ID = 'virtual:stellaris-component-icons';
const RESOLVED_COMPONENT_ICONS_MODULE_ID = `\0${COMPONENT_ICONS_MODULE_ID}`;

function collectFiles(directory) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...collectFiles(path));
        else if (extname(entry.name) === '.yml') files.push(path);
    }
    return files;
}

export function parseLocalization(directory) {
    const strings = {};
    const linePattern = /^\s*([^\s:#]+):(?:\d+)?\s+"((?:[^"\\]|\\.)*)"/;
    for (const file of collectFiles(directory).sort()) {
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

function localizationPlugin() {
    let root;
    let command;
    let serializedStrings;
    return {
        name: 'stellaris-localization',
        configResolved(config) {
            root = config.root;
            command = config.command;
        },
        configureServer(server) {
            server.middlewares.use('/@stellaris-localization', (_request, response) => {
                serializedStrings ??= JSON.stringify(
                    parseLocalization(resolve(root, 'assets/localisation/simp_chinese')),
                );
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                response.end(serializedStrings);
            });
        },
        resolveId(id) {
            return id === LOCALIZATION_MODULE_ID ? RESOLVED_LOCALIZATION_MODULE_ID : null;
        },
        load(id) {
            if (id !== RESOLVED_LOCALIZATION_MODULE_ID) return null;
            if (command === 'serve') {
                return `export default async function loadLocalization() {
                    const response = await fetch('/@stellaris-localization');
                    if (!response.ok) throw new Error('Failed to load localization');
                    return response.json();
                }`;
            }

            serializedStrings ??= JSON.stringify(
                parseLocalization(resolve(root, 'assets/localisation/simp_chinese')),
            );
            const reference = this.emitFile({
                type: 'asset',
                name: 'localization-simp-chinese.json',
                source: serializedStrings,
            });
            return `export default async function loadLocalization() {
                const response = await fetch(import.meta.ROLLUP_FILE_URL_${reference});
                if (!response.ok) throw new Error('Failed to load localization');
                return response.json();
            }`;
        },
    };
}

function copyImagesPlugin() {
    let root;
    let outDir;
    return {
        name: 'copy-stellaris-gfx',
        configResolved(config) {
            root = config.root;
            outDir = resolve(root, config.build.outDir);
        },
        closeBundle() {
            cpSync(resolve(root, 'assets/gfx'), resolve(outDir, 'gfx'), { recursive: true });
        },
    };
}

function componentIconsPlugin() {
    let root;
    let icons;
    return {
        name: 'stellaris-component-icons',
        configResolved(config) {
            root = config.root;
        },
        resolveId(id) {
            return id === COMPONENT_ICONS_MODULE_ID ? RESOLVED_COMPONENT_ICONS_MODULE_ID : null;
        },
        load(id) {
            if (id !== RESOLVED_COMPONENT_ICONS_MODULE_ID) return null;
            icons ??= buildComponentIconMap(resolve(root, 'assets')).icons;
            return `export default ${JSON.stringify(icons)};`;
        },
    };
}

export default defineConfig({
    publicDir: 'assets',
    plugins: [localizationPlugin(), componentIconsPlugin(), copyImagesPlugin()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: false,
    },
});

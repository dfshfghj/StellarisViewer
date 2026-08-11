import { cpSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { buildComponentIconMap } from './component-gfx-mapping.js';
import { compileGfxRegistry, compileGuiView } from './gui-compiler.js';

const LOCALIZATION_MODULE_ID = 'virtual:stellaris-localization';
const RESOLVED_LOCALIZATION_MODULE_ID = `\0${LOCALIZATION_MODULE_ID}`;
const COMPONENT_ICONS_MODULE_ID = 'virtual:stellaris-component-icons';
const RESOLVED_COMPONENT_ICONS_MODULE_ID = `\0${COMPONENT_ICONS_MODULE_ID}`;
const LOCALIZATION_DIRECTORIES = { en: 'english', zh: 'simp_chinese' };

const GUI_VIEWS = [
    {
        id: 'virtual:stellaris-outliner-ui',
        gui: 'outliner.gui',
        rootName: 'outliner_tab_window',
    },
    {
        id: 'virtual:stellaris-fleet-view-ui',
        gui: 'fleet_view.gui',
        rootName: 'fleet_view',
    },
    {
        id: 'virtual:stellaris-ship-view-ui',
        gui: 'ship_view.gui',
        rootName: 'ship_view',
    },
    {
        id: 'virtual:stellaris-planet-view-ui',
        gui: 'planet_view.gui',
        rootName: 'planet_view',
    },
];

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

function localizationModuleSource(urls) {
    return `const urls = ${JSON.stringify(urls)};
const localizationPromises = new Map();

export default function loadLocalization(language = 'en') {
    const locale = Object.hasOwn(urls, language) ? language : 'en';
    if (!localizationPromises.has(locale)) {
        const promise = (async () => {
            const response = await fetch(urls[locale]);
            if (!response.ok) throw new Error('Failed to load localization');
            return response.json();
        })().catch(error => {
            localizationPromises.delete(locale);
            throw error;
        });
        localizationPromises.set(locale, promise);
    }
    return localizationPromises.get(locale);
}`;
}

function localizationPlugin() {
    let root;
    let command;
    const serializedStrings = new Map();
    function serialize(root, language) {
        if (!serializedStrings.has(language)) {
            serializedStrings.set(language, JSON.stringify(
                parseLocalization(resolve(root, 'assets/localisation', LOCALIZATION_DIRECTORIES[language])),
            ));
        }
        return serializedStrings.get(language);
    }
    return {
        name: 'stellaris-localization',
        configResolved(config) {
            root = config.root;
            command = config.command;
        },
        configureServer(server) {
            server.middlewares.use('/@stellaris-localization', (request, response, next) => {
                const language = request.url?.split(/[/?#]/).filter(Boolean)[0];
                if (!Object.hasOwn(LOCALIZATION_DIRECTORIES, language)) return next();
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/json; charset=utf-8');
                response.end(serialize(root, language));
            });
        },
        resolveId(id) {
            return id === LOCALIZATION_MODULE_ID ? RESOLVED_LOCALIZATION_MODULE_ID : null;
        },
        load(id) {
            if (id !== RESOLVED_LOCALIZATION_MODULE_ID) return null;
            if (command === 'serve') {
                return localizationModuleSource({
                    en: '/@stellaris-localization/en',
                    zh: '/@stellaris-localization/zh',
                });
            }

            const urls = {};
            for (const [language, directory] of Object.entries(LOCALIZATION_DIRECTORIES)) {
                const reference = this.emitFile({
                    type: 'asset',
                    name: `localization-${directory}.json`,
                    source: serialize(root, language),
                });
                urls[language] = `__ROLLUP_URL_${reference}__`;
            }
            const source = localizationModuleSource(urls);
            return source.replace(/"__ROLLUP_URL_(\w+)__"/g, 'import.meta.ROLLUP_FILE_URL_$1');
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

function guiViewsPlugin(viewConfigs) {
    let root;
    let gfxRegistry;
    const definitions = new Map();
    const configs = new Map(viewConfigs.map(config => [config.id, config]));
    const resolvedIds = new Map(viewConfigs.map(config => [`\0${config.id}`, config]));
    return {
        name: 'stellaris-gui-views',
        configResolved(config) {
            root = config.root;
        },
        resolveId(id) {
            return configs.has(id) ? `\0${id}` : null;
        },
        load(id) {
            const config = resolvedIds.get(id);
            if (!config) return null;
            gfxRegistry ??= compileGfxRegistry(resolve(root, 'assets'));
            if (!definitions.has(config.id)) definitions.set(config.id, compileGuiView({
                guiPath: resolve(root, 'assets/interface', config.gui),
                assetsDirectory: resolve(root, 'assets'),
                rootName: config.rootName,
                gfxRegistry,
            }));
            const definition = definitions.get(config.id);
            return `export default ${JSON.stringify(definition)};`;
        },
    };
}

export default defineConfig({
    publicDir: 'assets',
    plugins: [localizationPlugin(), componentIconsPlugin(), guiViewsPlugin(GUI_VIEWS), copyImagesPlugin()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: false,
    },
});

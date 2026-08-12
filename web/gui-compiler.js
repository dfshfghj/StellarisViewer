import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const RESOURCE_TYPES = new Set([
    'spritetype',
    'corneredtilespritetype',
    'frameanimatedspritetype',
    'progressbartype',
    'flagspritetype',
    'piecharttype',
    'portraittype',
    'textspritetype',
]);

function tokenize(source) {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
        const char = source[index];
        if (/\s/.test(char)) {
            index += 1;
            continue;
        }
        if (char === '#') {
            while (index < source.length && source[index] !== '\n') index += 1;
            continue;
        }
        if (char === '"') {
            let value = '';
            index += 1;
            while (index < source.length) {
                if (source[index] === '"') {
                    index += 1;
                    break;
                }
                if (source[index] === '\\' && index + 1 < source.length) {
                    value += source[index + 1];
                    index += 2;
                    continue;
                }
                value += source[index];
                index += 1;
            }
            tokens.push({ type: 'scalar', value });
            continue;
        }
        if ('{}='.includes(char)) {
            tokens.push({ type: char, value: char });
            index += 1;
            continue;
        }
        let end = index;
        while (end < source.length && !/[\s{}=#"]/.test(source[end])) end += 1;
        tokens.push({ type: 'scalar', value: source.slice(index, end) });
        index = end;
    }
    return tokens;
}

function scalar(value) {
    if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return Number(value);
    if (value.toLowerCase() === 'yes') return true;
    if (value.toLowerCase() === 'no') return false;
    return value;
}

export function parseClausewitz(source) {
    const tokens = tokenize(source);
    let cursor = 0;

    function parseValue() {
        const token = tokens[cursor];
        if (!token) return null;
        if (token.type !== '{') {
            cursor += 1;
            return scalar(token.value);
        }
        cursor += 1;
        const entries = [];
        const values = [];
        while (cursor < tokens.length && tokens[cursor].type !== '}') {
            const key = tokens[cursor];
            if (key.type === 'scalar' && tokens[cursor + 1]?.type === '=') {
                cursor += 2;
                entries.push({ key: key.value, value: parseValue() });
            } else {
                values.push(parseValue());
            }
        }
        if (tokens[cursor]?.type === '}') cursor += 1;
        return { entries, values };
    }

    const entries = [];
    while (cursor < tokens.length) {
        const key = tokens[cursor];
        if (key.type !== 'scalar' || tokens[cursor + 1]?.type !== '=') {
            cursor += 1;
            continue;
        }
        cursor += 2;
        entries.push({ key: key.value, value: parseValue() });
    }
    return { entries, values: [] };
}

function entriesOf(block, key) {
    if (!block?.entries) return [];
    const lower = key.toLowerCase();
    return block.entries.filter(entry => entry.key.toLowerCase() === lower).map(entry => entry.value);
}

function first(block, key, fallback = undefined) {
    return entriesOf(block, key)[0] ?? fallback;
}

function addDiagnostic(diagnostics, kind, detail) {
    if (!diagnostics) return;
    const values = diagnostics[kind];
    if (!values.some(value => JSON.stringify(value) === JSON.stringify(detail))) values.push(detail);
}

function extendVariables(block, parentVariables, diagnostics, path) {
    const variables = { ...parentVariables };
    const localVariables = {};
    for (const entry of block?.entries || []) {
        if (!entry.key.startsWith('@')) continue;
        if (Object.hasOwn(variables, entry.key)) {
            addDiagnostic(diagnostics, 'duplicateVariables', { name: entry.key, path });
        }
        const value = blockToObject(entry.value, variables, diagnostics, `${path}/${entry.key}`);
        variables[entry.key] = value;
        localVariables[entry.key] = value;
    }
    return { variables, localVariables };
}

function blockToObject(block, parentVariables = {}, diagnostics = null, path = '') {
    if (!block?.entries) return resolveScalar(block, parentVariables, diagnostics, path);
    const { variables } = extendVariables(block, parentVariables, diagnostics, path);
    const result = {};
    for (const entry of block.entries) {
        if (entry.key.startsWith('@')) continue;
        const key = entry.key.toLowerCase();
        const value = blockToObject(entry.value, variables, diagnostics, `${path}/${key}`);
        if (key === 'animation' && Object.hasOwn(result, key)) {
            result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
        } else {
            result[key] = value;
        }
    }
    if (block.values.length) {
        result.$values = block.values.map((value, index) => resolveScalar(value, variables, diagnostics, `${path}/$values[${index}]`));
    }
    return result;
}

function resolveScalar(value, variables, diagnostics = null, path = '') {
    if (typeof value === 'string' && value.startsWith('@') && Object.hasOwn(variables, value)) {
        return variables[value];
    }
    if (typeof value === 'string' && value.startsWith('@')) {
        addDiagnostic(diagnostics, 'unresolvedVariables', { name: value, path });
    }
    return value;
}

const GUI_NODE_TYPES = new Set([
    'containerwindowtype',
    'windowtype',
    'icontype',
    'buttontype',
    'effectbuttontype',
    'guibuttontype',
    'instanttextboxtype',
    'textboxtype',
    'gridboxtype',
    'listboxtype',
    'smoothlistboxtype',
    'editboxtype',
    'progressbartype',
    'checkboxtype',
    'spinnertype',
    'dropdownboxtype',
    'overlappingelementsboxtype',
    'scrollbartype',
    'extendedscrollbartype',
    'positiontype',
    'expandbutton',
    'expandedwindow',
    'slider',
    'track',
    'overlay',
    'increasebutton',
    'decreasebutton',
    'background',
]);

function compileGuiBody(block, parentVariables, path, diagnostics) {
    const { variables, localVariables } = extendVariables(block, parentVariables, diagnostics, path);
    const props = {};
    const children = [];
    const conditions = [];
    const occurrence = new Map();
    for (const entry of block.entries || []) {
        if (entry.key.startsWith('@')) continue;
        const key = entry.key.toLowerCase();
        if (GUI_NODE_TYPES.has(key) && entry.value?.entries) {
            const childName = String(resolveScalar(first(entry.value, 'name', key), variables, diagnostics, `${path}/${key}/name`));
            const count = occurrence.get(childName) || 0;
            occurrence.set(childName, count + 1);
            children.push(compileGuiNode(key, entry.value, variables, `${path}/${childName}[${count}]`, diagnostics));
            continue;
        }
        if ((key === 'if_resolution' || key === 'if_scaled_resolution') && entry.value?.entries) {
            const conditionPath = `${path}/${key}[${conditions.filter(condition => condition.type === key).length}]`;
            const body = compileGuiBody(entry.value, variables, conditionPath, diagnostics);
            conditions.push({
                type: key,
                childIndex: children.length,
                minWidth: body.props.min_width ?? null,
                minHeight: body.props.min_height ?? null,
                maxWidth: body.props.max_width ?? null,
                maxHeight: body.props.max_height ?? null,
                props: body.props,
                children: body.children,
                conditions: body.conditions,
                variables: body.localVariables,
            });
            continue;
        }
        const value = blockToObject(entry.value, variables, diagnostics, `${path}/${key}`);
        props[key] = value;
    }
    return { props, children, conditions, localVariables };
}

function compileGuiNode(type, block, variables, path, diagnostics) {
    const body = compileGuiBody(block, variables, path, diagnostics);
    return {
        type,
        name: String(body.props.name || type),
        path,
        props: body.props,
        children: body.children,
        conditions: body.conditions,
        variables: body.localVariables,
    };
}

export function compileGui(source) {
    const ast = parseClausewitz(source);
    const diagnostics = { unresolvedVariables: [], duplicateVariables: [] };
    const { variables } = extendVariables(ast, {}, diagnostics, '$');
    const guiTypes = first(ast, 'guiTypes');
    if (!guiTypes?.entries) throw new Error('GUI source has no guiTypes block');
    const guiScope = extendVariables(guiTypes, variables, diagnostics, '$/guiTypes').variables;
    const templates = {};
    for (const entry of guiTypes.entries) {
        if (!GUI_NODE_TYPES.has(entry.key.toLowerCase()) || !entry.value?.entries) continue;
        const name = String(resolveScalar(first(entry.value, 'name', entry.key), guiScope, diagnostics, '$/guiTypes/name'));
        templates[name] = compileGuiNode(entry.key.toLowerCase(), entry.value, guiScope, name, diagnostics);
    }
    return { variables, templates, diagnostics };
}

function walkBlocks(block, visit) {
    for (const entry of block?.entries || []) {
        if (!entry.value?.entries) continue;
        visit(entry.key.toLowerCase(), entry.value);
        walkBlocks(entry.value, visit);
    }
}

function listFiles(directory, extension) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...listFiles(path, extension));
        else if (extname(entry.name).toLowerCase() === extension) files.push(path);
    }
    return files;
}

function imageDimensions(path) {
    if (!existsSync(path)) return null;
    const header = readFileSync(path).subarray(0, 30);
    if (header.length >= 24 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
    }
    if (header.length < 25 || header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
        return null;
    }

    const format = header.toString('ascii', 12, 16);
    if (format === 'VP8X' && header.length >= 30) {
        return {
            width: 1 + header.readUIntLE(24, 3),
            height: 1 + header.readUIntLE(27, 3),
        };
    }
    if (format === 'VP8 ' && header.length >= 30 && header.subarray(23, 26).equals(Buffer.from([157, 1, 42]))) {
        return {
            width: header.readUInt16LE(26) & 0x3fff,
            height: header.readUInt16LE(28) & 0x3fff,
        };
    }
    if (format === 'VP8L' && header[20] === 0x2f) {
        return {
            width: 1 + header[21] + ((header[22] & 0x3f) << 8),
            height: 1 + (header[22] >> 6) + (header[23] << 2) + ((header[24] & 0x0f) << 10),
        };
    }
    return null;
}

function webTexturePath(texture) {
    return typeof texture === 'string'
        ? texture.replace(/\\/g, '/').replace(/\.(?:dds|tga)$/i, '.webp')
        : null;
}

function textureValues(props) {
    return Object.entries(props)
        .filter(([key, value]) => /^texturefile\d*$/.test(key) && typeof value === 'string')
        .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
        .map(([, value]) => webTexturePath(value));
}

function referencedTextureValues(value, key = '', textures = new Set()) {
    if (typeof value === 'string') {
        if (key === 'masking_texture' || /texture.*file|animationmaskfile/.test(key)) {
            textures.add(webTexturePath(value));
        }
        return textures;
    }
    if (Array.isArray(value)) {
        for (const item of value) referencedTextureValues(item, key, textures);
        return textures;
    }
    if (!value || typeof value !== 'object') return textures;
    for (const [childKey, childValue] of Object.entries(value)) {
        referencedTextureValues(childValue, childKey, textures);
    }
    return textures;
}

export function compileTextColors(assetsDirectory) {
    const fontsPath = resolve(assetsDirectory, 'interface/fonts.gfx');
    if (!existsSync(fontsPath)) return {};
    const ast = parseClausewitz(readFileSync(fontsPath, 'utf8'));
    const bitmapFonts = first(ast, 'bitmapfonts');
    const textColors = first(bitmapFonts, 'textcolors');
    const colors = {};
    for (const entry of textColors?.entries || []) {
        const components = (entry.value?.values || []).map(Number);
        if (components.length < 3 || components.some(value => !Number.isFinite(value))) continue;
        const [red, green, blue, alpha = 255] = components;
        colors[entry.key] = { red, green, blue, alpha };
    }
    return colors;
}

export function compileGfxRegistry(assetsDirectory) {
    const interfaceDirectory = resolve(assetsDirectory, 'interface');
    const registry = {};
    for (const file of listFiles(interfaceDirectory, '.gfx').sort()) {
        const ast = parseClausewitz(readFileSync(file, 'utf8'));
        walkBlocks(ast, (type, block) => {
            if (!RESOURCE_TYPES.has(type)) return;
            const props = blockToObject(block);
            if (typeof props.name !== 'string' || !props.name.startsWith('GFX_')) return;
            const textures = textureValues(props);
            const referencedTextures = [...referencedTextureValues(props)];
            const webTexture = textures[0] || null;
            const dimensions = webTexture ? imageDimensions(resolve(assetsDirectory, webTexture)) : null;
            const missingTextures = referencedTextures.filter(texture => !existsSync(resolve(assetsDirectory, texture)));
            registry[props.name] = {
                name: props.name,
                type,
                texture: webTexture,
                textures,
                referencedTextures,
                maskingTexture: webTexturePath(props.masking_texture),
                frames: Number(props.noofframes || 1),
                defaultFrame: Number(props.default_frame || 1),
                spriteSheet: props.sprite_sheet_sprite_type || null,
                border: props.bordersize || null,
                dimensions,
                effectFile: props.effectfile || null,
                animations: props.animation
                    ? (Array.isArray(props.animation) ? props.animation : [props.animation])
                    : [],
                alwaysTransparent: props.alwaystransparent ?? false,
                fps: props.animation_rate_fps ?? props.fps ?? null,
                looping: props.looping ?? null,
                playOnShow: props.playonshow ?? props.play_on_show ?? null,
                color: props.color ?? null,
                properties: props,
                missingTextures,
                source: file.slice(interfaceDirectory.length + 1).replace(/\\/g, '/'),
            };
        });
    }

    for (const resource of Object.values(registry)) {
        if (!resource.spriteSheet) continue;
        const sheet = registry[resource.spriteSheet];
        if (!sheet) continue;
        resource.texture = sheet.texture;
        resource.textures = sheet.textures;
        resource.frames = sheet.frames;
        resource.dimensions = sheet.dimensions;
    }
    return registry;
}

export function compileGuiView({ guiPath, assetsDirectory, rootName, gfxRegistry = null }) {
    const gui = compileGui(readFileSync(guiPath, 'utf8'));
    if (!gui.templates[rootName]) throw new Error(`GUI template not found: ${rootName}`);
    const gfx = gfxRegistry || compileGfxRegistry(assetsDirectory);
    const usedSprites = new Set();
    for (const template of Object.values(gui.templates)) {
        walkGui(template, node => {
            collectGfxReferences(node.props, usedSprites);
            collectConditionGfxReferences(node.conditions, usedSprites);
        });
    }
    const resources = {};
    const unresolvedSprites = [];
    const pendingSprites = [...usedSprites];
    for (let index = 0; index < pendingSprites.length; index += 1) {
        const name = pendingSprites[index];
        if (!gfx[name]) {
            unresolvedSprites.push(name);
            continue;
        }
        resources[name] = gfx[name];
        const dependencies = new Set();
        collectGfxReferences(gfx[name].properties, dependencies);
        for (const dependency of dependencies) {
            if (usedSprites.has(dependency)) continue;
            usedSprites.add(dependency);
            pendingSprites.push(dependency);
        }
    }
    const missingTextures = Object.values(resources)
        .flatMap(resource => resource.missingTextures.map(texture => ({ resource: resource.name, texture })));
    return {
        rootName,
        variables: gui.variables,
        templates: gui.templates,
        resources,
        textColors: compileTextColors(assetsDirectory),
        unresolvedSprites,
        diagnostics: { ...gui.diagnostics, missingTextures },
    };
}

function collectGfxReferences(value, references, key = '') {
    if (typeof value === 'string') {
        if (key !== 'name' && value.startsWith('GFX_')) references.add(value);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) collectGfxReferences(item, references, key);
        return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [childKey, childValue] of Object.entries(value)) {
        collectGfxReferences(childValue, references, childKey);
    }
}

function collectConditionGfxReferences(conditions = [], references) {
    for (const condition of conditions) {
        collectGfxReferences(condition.props, references);
        collectConditionGfxReferences(condition.conditions, references);
    }
}

function walkGui(node, visit) {
    visit(node);
    for (const child of node.children) walkGui(child, visit);
    walkConditionChildren(node.conditions, visit);
}

function walkConditionChildren(conditions = [], visit) {
    for (const condition of conditions) {
        for (const child of condition.children) walkGui(child, visit);
        walkConditionChildren(condition.conditions, visit);
    }
}

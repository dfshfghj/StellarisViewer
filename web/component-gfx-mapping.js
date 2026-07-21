import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

function collectFiles(directory, extensions) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...collectFiles(path, extensions));
        else if (extensions.has(extname(entry.name).toLowerCase())) files.push(path);
    }
    return files.sort();
}

function stripComment(line) {
    let quoted = false;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (escaped) {
            escaped = false;
        } else if (char === '\\' && quoted) {
            escaped = true;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === '#' && !quoted) {
            return line.slice(0, index);
        }
    }
    return line;
}

function braceDelta(line) {
    let quoted = false;
    let escaped = false;
    let delta = 0;
    for (const char of line) {
        if (escaped) {
            escaped = false;
        } else if (char === '\\' && quoted) {
            escaped = true;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (!quoted && char === '{') {
            delta += 1;
        } else if (!quoted && char === '}') {
            delta -= 1;
        }
    }
    return delta;
}

function readField(line) {
    const match = line.match(/^\s*([A-Za-z_][\w]*)\s*=\s*(?:"([^"]*)"|([^\s#}]+))/);
    if (!match) return null;
    return [match[1].toLowerCase(), match[2] ?? match[3]];
}

function parseBlocks(files, acceptsBlock) {
    const blocks = [];
    for (const file of files) {
        let current = null;
        let depth = 0;
        for (const rawLine of readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
            const line = stripComment(rawLine);
            if (!current) {
                const start = line.match(/^\s*([A-Za-z_][\w]*)\s*=\s*\{/);
                if (!start || !acceptsBlock(start[1])) continue;
                current = { type: start[1], fields: {}, file };
                depth = braceDelta(line);
                continue;
            }

            if (depth === 1) {
                const field = readField(line);
                if (field) current.fields[field[0]] = field[1];
            }
            depth += braceDelta(line);
            if (depth <= 0) {
                blocks.push(current);
                current = null;
            }
        }
    }
    return blocks;
}

function textureToWebPath(textureFile) {
    return `/${textureFile.replace(/\\/g, '/').replace(/^\/?gfx\//i, 'gfx/').replace(/\.dds$/i, '.png')}`;
}

export function buildComponentIconMap(assetsDirectory) {
    const templateDirectory = resolve(assetsDirectory, 'common/component_templates');
    const interfaceDirectory = resolve(assetsDirectory, 'interface');
    const componentBlocks = parseBlocks(
        collectFiles(templateDirectory, new Set(['.txt'])),
        type => type.endsWith('_component_template'),
    );
    const spriteBlocks = parseBlocks(
        collectFiles(interfaceDirectory, new Set(['.gfx'])),
        type => /spriteType$/i.test(type),
    );

    const sprites = new Map();
    for (const { fields } of spriteBlocks) {
        if (!fields.name) continue;
        sprites.set(fields.name, {
            textureFile: fields.texturefile,
            sheet: fields.sprite_sheet_sprite_type,
        });
    }

    function resolveTexture(spriteName, seen = new Set()) {
        if (!spriteName || seen.has(spriteName)) return null;
        seen.add(spriteName);
        const sprite = sprites.get(spriteName);
        if (!sprite) return null;
        if (sprite.textureFile) return sprite.textureFile;
        return resolveTexture(sprite.sheet, seen);
    }

    const icons = {};
    const missingSprites = new Set();
    const missingTextures = new Set();
    for (const { fields } of componentBlocks) {
        if (!fields.key || !fields.icon) continue;
        const textureFile = resolveTexture(fields.icon);
        if (!textureFile) {
            missingSprites.add(fields.icon);
            continue;
        }
        const webPath = textureToWebPath(textureFile);
        const localPath = resolve(assetsDirectory, webPath.slice(1).split('/').join(sep));
        if (!existsSync(localPath)) missingTextures.add(webPath);
        icons[fields.key] = webPath;
    }

    return {
        icons,
        stats: {
            componentTemplates: componentBlocks.length,
            mappedComponents: Object.keys(icons).length,
            sprites: sprites.size,
            missingSprites: [...missingSprites].sort(),
            missingTextures: [...missingTextures].sort(),
        },
    };
}

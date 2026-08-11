let strings = {};

export function setGameLocalization(value) {
    strings = value || {};
}

export function resolveGameLocalization(key) {
    let text = strings[key] ?? key;
    for (let depth = 0; depth < 4 && /\$[^$]+\$/.test(text); depth += 1) {
        text = text.replace(/\$([^$]+)\$/g, (_match, nestedKey) => strings[nestedKey] ?? '—');
    }
    return text;
}

export function localizeGameText(key) {
    return resolveGameLocalization(key).replace(/£[^£]+£/g, '').replace(/§./g, '');
}

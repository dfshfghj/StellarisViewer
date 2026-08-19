const BASE_URL = import.meta.env?.BASE_URL ?? '/';

export function assetUrl(path) {
    const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    return `${base}${String(path).replace(/^\/+/, '')}`;
}

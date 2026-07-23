// GFX files declare frame counts and GUI files may select fixed frames. Dynamic
// semantic frames are assigned by Stellaris runtime code, so the viewer keeps
// the subset it renders in one explicit mapping.
export const SHIP_SIZE_FRAME_COUNT = 27;

export function shipSizeFrame(size) {
    const frames = {
        military_station_small: 1,
        military_station_medium: 1,
        military_station_large: 1,
        starbase: 1,
        corvette: 2,
        destroyer: 3,
        cruiser: 4,
        battleship: 5,
        titan: 6,
        juggernaut: 7,
        science: 8,
        constructor: 9,
        colonizer: 10,
        transport: 11,
    };
    return frames[size] ?? 12;
}

export function spriteFrame(path, frames, frame, className = '') {
    const clamped = Math.max(0, Math.min(frames - 1, Number(frame) || 0));
    const position = frames <= 1 ? 0 : (clamped / (frames - 1)) * 100;
    return `<span class="gfx-frame ${className}" style="--sprite:url('${path}');--frames:${frames};--frame-position:${position}%"></span>`;
}

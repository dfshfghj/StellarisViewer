// Galaxy Map Canvas Renderer
import { computeTerritoryBorders } from './territory-borders.js';

// Star class → texture filename mapping
const STAR_TEXTURES = {
    'sc_a': 'a_star.png',
    'sc_b': 'b_star.png',
    'sc_f': 'f_star.png',
    'sc_g': 'g_star.png',
    'sc_k': 'k_star.png',
    'sc_m': 'm_star.png',
    'sc_m_giant': 'sc_m_giant.png',
    'sc_t': 't_star.png',
    'sc_x': 'x_star.png',
    'sc_black_hole': 'black_hole.png',
    'sc_neutron_star': 'neutron_star.png',
    'sc_pulsar': 'pulsar.png',
};
const BINARY_TEXTURES = ['a_binary_star.png', 'b_binary_star.png', 'c_binary_star.png', 'd_binary_star.png', 'e_binary_star.png'];
const TRINARY_TEXTURE = 'a_trinary_star.png';
const STAR_TEX_PATH = `${import.meta.env.BASE_URL}gfx/map/star_classes/`;
const ICON_TEX_PATH = `${import.meta.env.BASE_URL}gfx/interface/icons/`;
const RELATION_FRAME = { own: 0, neutral: 1, friendly: 2, hostile: 3 };
const FLEET_POWER_THRESHOLDS = [1, 2_000, 10_000, 20_000, 50_000, 100_000, 250_000];

export class GalaxyMap {
    constructor(canvas, data, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = data;
        this.callbacks = callbacks;

        // Preload star textures
        this.starImages = new Map();
        this.loadStarTextures();
        this.fleetImages = new Map();
        this.loadFleetTextures();

        // Camera
        this.cam = { x: 0, y: 0, zoom: 1 };
        this.dragging = false;
        this.moved = false;
        this.lastMouse = { x: 0, y: 0 };
        this.active = false;
        this.selectedFleetMarkerKey = null;

        // Build lookup
        this.systemMap = new Map();
        for (const s of data.systems) this.systemMap.set(s.id, s);

        // Country colors
        this.countryColors = new Map();
        for (const c of data.countries) this.countryColors.set(c.id, c.color);

        // System ownership
        this.systemOwner = new Map();
        for (const t of data.territory) {
            for (const sid of t.systems) this.systemOwner.set(sid, t.country_id);
        }

        this.fleetMarkers = this.buildFleetMarkers();

        // Compute Voronoi borders (world space, done once)
        this.borderLoops = this.computeBorders();

        this.setupEvents();
        this.resize();
        this.centerCamera();
    }

    loadStarTextures() {
        const allFiles = new Set(Object.values(STAR_TEXTURES));
        BINARY_TEXTURES.forEach(f => allFiles.add(f));
        allFiles.add(TRINARY_TEXTURE);
        for (const file of allFiles) {
            const img = new Image();
            img.src = STAR_TEX_PATH + file;
            this.starImages.set(file, img);
        }
    }

    loadFleetTextures() {
        for (const file of ['ship_icons_type.png', 'ship_overlay_icons.png']) {
            const img = new Image();
            img.onload = () => this.active && this.render();
            img.src = ICON_TEX_PATH + file;
            this.fleetImages.set(file, img);
        }
    }

    buildFleetMarkers() {
        const groups = new Map();
        for (const fleet of this.data.fleets) {
            if (fleet.station || !this.systemMap.has(fleet.system_id)) continue;
            const relation = fleet.owner === this.data.player_country_id
                ? 'own' : (fleet.relation || 'neutral');
            const moving = Boolean(fleet.moving);
            const overlayBase = fleetOverlayBase(fleet);
            const overlayKey = overlayBase ?? 'none';
            const key = `${fleet.system_id}:${relation}:${moving ? 'moving' : 'idle'}:${overlayKey}`;
            let marker = groups.get(key);
            if (!marker) {
                marker = {
                    systemId: fleet.system_id,
                    relation,
                    owner: fleet.owner,
                    power: 0,
                    count: 0,
                    representativeId: fleet.id,
                    representativePower: -1,
                    moving,
                    overlayBase,
                    key,
                };
                groups.set(key, marker);
            }
            const power = Math.max(0, Number(fleet.military_power) || 0);
            marker.power += power;
            marker.count++;
            if (power > marker.representativePower) {
                marker.representativePower = power;
                marker.representativeId = fleet.id;
                marker.owner = fleet.owner;
            }
        }

        const markers = [...groups.values()];
        const perSystem = new Map();
        for (const marker of markers) {
            const systemMarkers = perSystem.get(marker.systemId) || [];
            systemMarkers.push(marker);
            perSystem.set(marker.systemId, systemMarkers);
        }
        const relationOrder = { own: 0, friendly: 1, neutral: 2, hostile: 3 };
        for (const systemMarkers of perSystem.values()) {
            systemMarkers.sort((a, b) =>
                (relationOrder[a.relation] - relationOrder[b.relation])
                || Number(a.moving) - Number(b.moving)
                || (a.overlayBase ?? -1) - (b.overlayBase ?? -1));
            systemMarkers.forEach((marker, index) => {
                marker.stackIndex = index;
                marker.stackCount = systemMarkers.length;
            });
        }
        return markers;
    }

    fleetMarkerPosition(marker) {
        const system = this.systemMap.get(marker.systemId);
        const position = this.worldToScreen(system.x, system.y);
        const spread = 34;
        position.x += (marker.stackIndex - (marker.stackCount - 1) / 2) * spread;
        position.y -= 25;
        return position;
    }

    getStarImage(starClass) {
        if (!starClass) return null;
        // Direct match
        if (STAR_TEXTURES[starClass]) {
            const img = this.starImages.get(STAR_TEXTURES[starClass]);
            return (img && img.complete && img.naturalWidth > 0) ? img : null;
        }
        // Binary: sc_binary_N
        if (starClass.startsWith('sc_binary_')) {
            const num = parseInt(starClass.slice('sc_binary_'.length)) || 1;
            const file = BINARY_TEXTURES[(num - 1) % BINARY_TEXTURES.length];
            const img = this.starImages.get(file);
            return (img && img.complete && img.naturalWidth > 0) ? img : null;
        }
        // Trinary: sc_trinary_N
        if (starClass.startsWith('sc_trinary_')) {
            const img = this.starImages.get(TRINARY_TEXTURE);
            return (img && img.complete && img.naturalWidth > 0) ? img : null;
        }
        return null;
    }

    // ============ Voronoi Border Computation ============

    computeBorders() {
        const systems = this.data.systems;
        const points = systems.map(s => [s.x, s.y]);
        const ownerOfIdx = systems.map(s => this.systemOwner.get(s.id) ?? -1);
        return computeTerritoryBorders(points, ownerOfIdx);
    }

    // ============ Events ============

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.active) return;
            this.dragging = true;
            this.moved = false;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.active) return;
            if (this.dragging) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.moved = true;
                this.cam.x += dx / this.cam.zoom;
                this.cam.y += dy / this.cam.zoom;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                this.render();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.dragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.dragging = false; });
        this.canvas.addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            this.cam.zoom = Math.max(0.1, Math.min(10, this.cam.zoom * factor));
            this.render();
        });
        this.canvas.addEventListener('click', (e) => {
            if (!this.active) return;
            if (this.moved) return;
            const hit = this.hitTest(e.clientX, e.clientY);
            if (hit) {
                if (hit.type === 'fleet') {
                    this.selectedFleetMarkerKey = hit.markerKey;
                    this.render();
                    this.callbacks.onFleetClick(hit.id);
                } else if (hit.type === 'system') {
                    this.selectedFleetMarkerKey = null;
                    this.render();
                    this.callbacks.onSystemClick(hit.id);
                }
            } else if (this.selectedFleetMarkerKey !== null) {
                this.selectedFleetMarkerKey = null;
                this.render();
            }
        });
    }

    // ============ Camera ============

    centerCamera() {
        if (this.data.systems.length === 0) return;
        let cx = 0, cy = 0;
        for (const s of this.data.systems) { cx += s.x; cy += s.y; }
        cx /= this.data.systems.length;
        cy /= this.data.systems.length;
        this.cam.x = -cx;
        this.cam.y = -cy;
        this.cam.zoom = Math.min(this.canvas.width, this.canvas.height) / 1000;
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    show() { this.active = true; this.canvas.style.display = 'block'; this.resize(); }
    hide() { this.active = false; this.canvas.style.display = 'none'; }

    worldToScreen(x, y) {
        return {
            x: (x + this.cam.x) * this.cam.zoom + this.canvas.width / 2,
            y: (y + this.cam.y) * this.cam.zoom + this.canvas.height / 2,
        };
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.canvas.width / 2) / this.cam.zoom - this.cam.x,
            y: (sy - this.canvas.height / 2) / this.cam.zoom - this.cam.y,
        };
    }

    hitTest(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = clientX - rect.left;
        const sy = clientY - rect.top;

        for (const marker of this.fleetMarkers) {
            const pos = this.fleetMarkerPosition(marker);
            const dist = Math.hypot(pos.x - sx, pos.y - sy);
            if (dist < 18) {
                return { type: 'fleet', id: marker.representativeId, markerKey: marker.key };
            }
        }

        for (const s of this.data.systems) {
            const pos = this.worldToScreen(s.x, s.y);
            const dist = Math.hypot(pos.x - sx, pos.y - sy);
            if (dist < Math.max(6, 4 * this.cam.zoom)) return { type: 'system', id: s.id };
        }
        return null;
    }

    // ============ Rendering ============

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;

        ctx.fillStyle = '#050810';
        ctx.fillRect(0, 0, w, h);
        this.drawStars(ctx, w, h);

        // Territory (Voronoi borders)
        this.drawTerritory(ctx);

        // Hyperlanes
        ctx.strokeStyle = 'rgba(100, 160, 220, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of this.data.hyperlanes) {
            const sa = this.systemMap.get(a);
            const sb = this.systemMap.get(b);
            if (!sa || !sb) continue;
            const pa = this.worldToScreen(sa.x, sa.y);
            const pb = this.worldToScreen(sb.x, sb.y);
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
        }
        ctx.stroke();

        // Systems
        for (const s of this.data.systems) {
            const pos = this.worldToScreen(s.x, s.y);
            if (pos.x < -30 || pos.x > w + 30 || pos.y < -30 || pos.y > h + 30) continue;

            const baseSize = s.has_colony ? 10 : 7;
            const size = baseSize * Math.min(this.cam.zoom, 2.5);
            const img = this.getStarImage(s.star_class);
            
            if (img) {
                ctx.globalCompositeOperation = 'screen';
                ctx.drawImage(img, pos.x - size / 2, pos.y - size / 2, size, size);
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // Fallback: colored circle
                const color = this.getStarColor(s.star_class);
                const radius = s.has_colony ? 4 : 2.5;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius * Math.min(this.cam.zoom, 2), 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }

            // Owner ring
            // const owner = this.systemOwner.get(s.id);
            // if (owner !== undefined) {
            //     const ringR = (size / 2 + 2);
            //     ctx.beginPath();
            //     ctx.arc(pos.x, pos.y, ringR, 0, Math.PI * 2);
            //     ctx.strokeStyle = this.countryColors.get(owner) || '#888';
            //     ctx.lineWidth = 1;
            //     ctx.stroke();
            // }

            // Label
            if (this.cam.zoom > 1.2 && s.has_colony) {
                ctx.fillStyle = 'rgba(200, 220, 240, 0.7)';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(s.name, pos.x, pos.y + size / 2 + 10);
            }
        }

        this.drawFleetMarkers(ctx, w, h);
    }

    drawFleetMarkers(ctx, w, h) {
        const base = this.fleetImages.get('ship_icons_type.png');
        const powerOverlay = this.fleetImages.get('ship_overlay_icons.png');
        if (!base?.complete || !powerOverlay?.complete) return;

        for (const marker of this.fleetMarkers) {
            const pos = this.fleetMarkerPosition(marker);
            if (pos.x < -40 || pos.x > w + 40 || pos.y < -50 || pos.y > h + 40) continue;

            const relationFrame = RELATION_FRAME[marker.relation] ?? 1;
            const selected = marker.key === this.selectedFleetMarkerKey;
            const shapeGroup = (marker.moving ? 4 : 0) + (selected ? 8 : 0);
            const size = 32;
            const left = pos.x - size / 2;
            const top = pos.y - size / 2;

            ctx.drawImage(base, (shapeGroup + relationFrame) * 32, 0, 32, 32, left, top, size, size);

            if (marker.overlayBase !== null) {
                const overlayFrame = marker.overlayBase + relationFrame + (selected ? 64 : 0);
                ctx.drawImage(powerOverlay, overlayFrame * 16, 0, 16, 16,
                    pos.x + 8, pos.y - 16, 16, 16);
            }
        }
    }

    drawStars(ctx, w, h) {
        if (!this._stars) {
            this._stars = [];
            let seed = 12345;
            const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
            for (let i = 0; i < 200; i++) {
                this._stars.push({ x: rng() * 2000, y: rng() * 2000, r: rng() * 1.2 + 0.3, a: rng() * 0.4 + 0.1 });
            }
        }
        for (const star of this._stars) {
            const sx = ((star.x + this.cam.x * 0.1) % w + w) % w;
            const sy = ((star.y + this.cam.y * 0.1) % h + h) % h;
            ctx.beginPath();
            ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${star.a})`;
            ctx.fill();
        }
    }

    drawTerritory(ctx) {
        for (const [cid, loops] of this.borderLoops) {
            const color = this.countryColors.get(cid) || '#888';

            ctx.beginPath();
            for (const loop of loops) {
                if (loop.length < 3) continue;

                // Transform world → screen and draw smooth closed curve
                const pts = loop.map(p => this.worldToScreen(p.x, p.y));
                traceSmoothClosed(ctx, pts);
                ctx.closePath();
            }
            // One compound path preserves holes and disconnected components.
            ctx.fillStyle = color + '14';
            ctx.fill('evenodd');
            ctx.strokeStyle = color + '40';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }

    getStarColor(starClass) {
        if (!starClass) return '#aaa';
        if (starClass.includes('_g_') || starClass.includes('_g')) return '#ffdd44';
        if (starClass.includes('_m_') || starClass.includes('_m')) return '#ff8844';
        if (starClass.includes('_b_') || starClass.includes('_b')) return '#6688ff';
        if (starClass.includes('_a_') || starClass.includes('_a')) return '#ccddff';
        if (starClass.includes('_f_') || starClass.includes('_f')) return '#aaccff';
        if (starClass.includes('_k_') || starClass.includes('_k')) return '#ffaa44';
        if (starClass.includes('black_hole')) return '#442266';
        if (starClass.includes('neutron')) return '#88ccff';
        if (starClass.includes('pulsar')) return '#44ddff';
        return '#ccccaa';
    }
}

function fleetPowerStars(power) {
    let stars = 0;
    for (const threshold of FLEET_POWER_THRESHOLDS) {
        if (power < threshold) break;
        stars++;
    }
    return stars;
}

function fleetOverlayBase(fleet) {
    const sizes = fleet.ship_sizes?.length ? fleet.ship_sizes : [fleet.ship_size];
    const normalizedSizes = sizes.filter(Boolean).map(size => size.toLowerCase());
    if (normalizedSizes.some(isJuggernautSize)) return 56;
    if (normalizedSizes.some(isColossusSize)) return 52;
    if (normalizedSizes.some(isSpaceFaunaSize)) return 48;

    switch (fleet.fleet_type) {
        case 'science': return 32;
        case 'constructor': return 36;
        case 'transport': return 40;
        case 'colonizer': return 44;
        case 'military': {
            const stars = fleetPowerStars(Number(fleet.military_power) || 0);
            return stars > 0 ? stars * 4 : null;
        }
        default:
            return null;
    }
}

function isJuggernautSize(size) {
    return size.includes('juggernaut');
}

function isColossusSize(size) {
    return size.includes('colossus')
        || size.includes('star_eater')
        || size.includes('world_destroyer');
}

function isSpaceFaunaSize(size) {
    return [
        'amoeba', 'tiyanki', 'crystal', 'void_cloud', 'mining_drone',
        'space_cloud', 'space_whale', 'space_dragon', 'ether_drake', 'leviathan', 'guardian',
        'dimensional_horror', 'stellarite', 'wraith', 'scavenger_bot',
        'space_fauna', 'space_monster', 'lost_swarm', 'corrupted_avatar',
    ].some(keyword => size.includes(keyword));
}

// ============ Smooth Curve Drawing ============

function traceSmoothClosed(ctx, pts) {
    const n = pts.length;
    if (n < 3) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
        return;
    }
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        // ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.lineTo(p2.x, p2.y);
    }
}

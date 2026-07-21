import { Delaunay } from 'd3-delaunay';

// Maximum distance that one system may project its territory into empty space.
export const MAX_SYSTEM_BORDER_RADIUS = 32;

const CIRCLE_SEGMENTS = 64;
const POINT_KEY_PRECISION = 1e6;
const GEOMETRY_EPSILON = 1e-7;
const TAU = Math.PI * 2;

const pointKey = (point) =>
    `${Math.round(point[0] * POINT_KEY_PRECISION)},${Math.round(point[1] * POINT_KEY_PRECISION)}`;

function edgeKey(a, b) {
    const ka = pointKey(a);
    const kb = pointKey(b);
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

function signedArea(polygon) {
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
        const next = (i + 1) % polygon.length;
        area += polygon[i][0] * polygon[next][1] - polygon[next][0] * polygon[i][1];
    }
    return area / 2;
}

function pointInsideConvexPolygon(point, polygon) {
    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        const cross = (b[0] - a[0]) * (point[1] - a[1])
            - (b[1] - a[1]) * (point[0] - a[0]);
        if (cross < -GEOMETRY_EPSILON) return false;
    }
    return true;
}

function segmentCircleIntersections(start, end, center, radius) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const fx = start[0] - center[0];
    const fy = start[1] - center[1];
    const a = dx * dx + dy * dy;
    if (a < GEOMETRY_EPSILON) return [];

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < -GEOMETRY_EPSILON) return [];

    const root = Math.sqrt(Math.max(0, discriminant));
    const intersections = [];
    for (const t of [(-b - root) / (2 * a), (-b + root) / (2 * a)]) {
        if (t >= -GEOMETRY_EPSILON && t <= 1 + GEOMETRY_EPSILON) {
            intersections.push([start[0] + dx * t, start[1] + dy * t]);
        }
    }
    return intersections;
}

/**
 * Intersect a convex Voronoi cell with an exact circle, sampling only the
 * circular arcs for rendering. Exact edge/circle intersections ensure that
 * adjacent cells still share identical Voronoi edge endpoints.
 */
function limitCellToRadius(cell, center, radius) {
    const candidates = [];
    const radiusSquared = radius * radius;

    for (let i = 0; i < cell.length; i++) {
        const point = cell[i];
        const dx = point[0] - center[0];
        const dy = point[1] - center[1];
        if (dx * dx + dy * dy <= radiusSquared + GEOMETRY_EPSILON) {
            candidates.push(point);
        }

        const next = cell[(i + 1) % cell.length];
        candidates.push(...segmentCircleIntersections(point, next, center, radius));
    }

    for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
        const angle = i / CIRCLE_SEGMENTS * TAU;
        const point = [
            center[0] + Math.cos(angle) * radius,
            center[1] + Math.sin(angle) * radius,
        ];
        if (pointInsideConvexPolygon(point, cell)) candidates.push(point);
    }

    const unique = new Map();
    for (const point of candidates) unique.set(pointKey(point), point);
    return [...unique.values()].sort((a, b) =>
        Math.atan2(a[1] - center[1], a[0] - center[0])
        - Math.atan2(b[1] - center[1], b[0] - center[0]));
}

function chooseNextSegment(candidates, segments, used, previous, current) {
    const incomingAngle = Math.atan2(current.y - previous.y, current.x - previous.x);
    let best = -1;
    let bestTurn = Infinity;

    for (const index of candidates ?? []) {
        if (used[index]) continue;
        const segment = segments[index];
        const outgoingAngle = Math.atan2(segment.y2 - current.y, segment.x2 - current.x);
        const turn = (outgoingAngle - incomingAngle + TAU) % TAU;
        if (turn < bestTurn) {
            bestTurn = turn;
            best = index;
        }
    }
    return best;
}

function chainClosedLoops(segments) {
    const outgoing = new Map();
    for (let i = 0; i < segments.length; i++) {
        const startKey = pointKey([segments[i].x1, segments[i].y1]);
        if (!outgoing.has(startKey)) outgoing.set(startKey, []);
        outgoing.get(startKey).push(i);
    }

    const used = new Uint8Array(segments.length);
    const loops = [];

    for (let startIndex = 0; startIndex < segments.length; startIndex++) {
        if (used[startIndex]) continue;

        const startSegment = segments[startIndex];
        const start = { x: startSegment.x1, y: startSegment.y1 };
        const startKey = pointKey([start.x, start.y]);
        const loop = [start];
        let previous = start;
        let current = { x: startSegment.x2, y: startSegment.y2 };
        let currentIndex = startIndex;
        let closed = false;

        for (let guard = 0; guard <= segments.length; guard++) {
            used[currentIndex] = 1;
            const currentKey = pointKey([current.x, current.y]);
            if (currentKey === startKey) {
                closed = true;
                break;
            }

            loop.push(current);
            const nextIndex = chooseNextSegment(
                outgoing.get(currentKey), segments, used, previous, current,
            );
            if (nextIndex === -1) break;

            const next = segments[nextIndex];
            previous = current;
            current = { x: next.x2, y: next.y2 };
            currentIndex = nextIndex;
        }

        if (closed && loop.length >= 3) loops.push(loop);
    }

    return loops;
}

/**
 * Each country's territory is the union of its systems' Voronoi cells, with
 * every individual cell capped by a local radius. Nearby systems still meet
 * on their Voronoi bisector, while empty regions close with rounded caps.
 */
export function computeTerritoryBorders(points, owners, options = {}) {
    if (points.length < 3 || points.length !== owners.length) return new Map();

    const radius = options.maxRadius ?? MAX_SYSTEM_BORDER_RADIUS;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    // The box only makes the Voronoi diagram finite. It sits beyond every
    // local radius, so it can no longer become a visible territory edge.
    const bounds = [
        minX - radius * 1.1,
        minY - radius * 1.1,
        maxX + radius * 1.1,
        maxY + radius * 1.1,
    ];
    const voronoi = Delaunay.from(points).voronoi(bounds);
    const countryEdges = new Map();

    for (let i = 0; i < points.length; i++) {
        const countryId = owners[i];
        if (countryId === -1) continue;

        const rawCell = voronoi.cellPolygon(i);
        if (!rawCell || rawCell.length < 4) continue;
        let cell = rawCell.slice(0, -1);
        if (signedArea(cell) < 0) cell = cell.reverse();

        const polygon = limitCellToRadius(cell, points[i], radius);
        if (polygon.length < 3) continue;
        if (!countryEdges.has(countryId)) countryEdges.set(countryId, new Map());
        const edges = countryEdges.get(countryId);

        for (let p = 0; p < polygon.length; p++) {
            const a = polygon[p];
            const b = polygon[(p + 1) % polygon.length];
            if (pointKey(a) === pointKey(b)) continue;

            const key = edgeKey(a, b);
            if (edges.has(key)) {
                // Same-country cells share this exact Voronoi edge portion.
                edges.delete(key);
            } else {
                edges.set(key, { x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
            }
        }
    }

    const result = new Map();
    for (const [countryId, edges] of countryEdges) {
        const loops = chainClosedLoops([...edges.values()]);
        if (loops.length > 0) result.set(countryId, loops);
    }
    return result;
}

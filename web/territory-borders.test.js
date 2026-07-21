import assert from 'node:assert/strict';
import { computeTerritoryBorders } from './territory-borders.js';

function test(name, fn) {
    fn();
    console.log(`✓ ${name}`);
}

function grid(width, height, ownerAt) {
    const points = [];
    const owners = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            points.push([x * 10, y * 10]);
            owners.push(ownerAt(x, y));
        }
    }
    return { points, owners };
}

test('keeps disconnected territory components as separate closed loops', () => {
    const { points, owners } = grid(5, 3, (x) => x === 2 ? 2 : 1);
    const borders = computeTerritoryBorders(points, owners);

    assert.equal(borders.get(1).length, 2);
    assert.equal(borders.get(2).length, 1);
});

test('keeps an enclave as a separate hole ring', () => {
    const { points, owners } = grid(3, 3, (x, y) => x === 1 && y === 1 ? 2 : 1);
    const borders = computeTerritoryBorders(points, owners);

    assert.equal(borders.get(1).length, 2);
    assert.equal(borders.get(2).length, 1);
});

test('limits every border point by the nearest owned system radius', () => {
    const points = [[0, 0], [1000, 0.001], [500, 0.002], [500, 500]];
    const owners = [1, 2, 1, 2];
    const maxRadius = 25;
    const borders = computeTerritoryBorders(points, owners, { maxRadius });

    for (const [countryId, loops] of borders) {
        const ownedPoints = points.filter((_, index) => owners[index] === countryId);
        for (const loop of loops) {
            for (const point of loop) {
                const nearestOwnedSystem = Math.min(...ownedPoints.map(system =>
                    Math.hypot(point.x - system[0], point.y - system[1])));
                assert.ok(nearestOwnedSystem <= maxRadius + 1e-6);
            }
        }
    }
});

test('closes an edge system with a rounded local cap instead of the map box', () => {
    const points = [[0, 0], [100, 0], [50, 100]];
    const owners = [1, 2, 2];
    const maxRadius = 20;
    const borders = computeTerritoryBorders(points, owners, { maxRadius });
    const countryLoop = borders.get(1)[0];

    assert.ok(countryLoop.length > 12, 'outer edge should contain a sampled arc');
    assert.ok(countryLoop.every(point => Math.hypot(point.x, point.y) <= maxRadius + 1e-6));
});

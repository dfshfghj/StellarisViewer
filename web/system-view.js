// System Orbital View Canvas Renderer
export class SystemView {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;
        this.data = null;
        this.planetPositions = [];
        this.fleetPositions = [];
        this.active = false;

        // Camera for zoom/pan
        this.cam = { zoom: 1, ox: 0, oy: 0 };
        this.dragging = false;
        this.moved = false;
        this.lastMouse = { x: 0, y: 0 };

        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.active) return;
            this.dragging = true;
            this.moved = false;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.active || !this.dragging) return;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.moved = true;
            this.cam.ox += dx;
            this.cam.oy += dy;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.render();
        });
        this.canvas.addEventListener('mouseup', () => { this.dragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.dragging = false; });
        this.canvas.addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            this.cam.zoom = Math.max(0.3, Math.min(5, this.cam.zoom * factor));
            this.render();
        });
    }

    setData(data) {
        this.data = data;
        this.cam = { zoom: 1, ox: 0, oy: 0 };
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (this.data) this.render();
    }

    show() { this.active = true; this.canvas.style.display = 'block'; this.resize(); }
    hide() { this.active = false; this.canvas.style.display = 'none'; }

    render() {
        if (!this.data) return;
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;
        const cx = w / 2, cy = h / 2;

        // Background (no transform)
        ctx.fillStyle = '#050810';
        ctx.fillRect(0, 0, w, h);
        this.drawStars(ctx, w, h);

        // Apply camera transform
        ctx.save();
        ctx.translate(this.cam.ox, this.cam.oy);
        ctx.translate(cx, cy);
        ctx.scale(this.cam.zoom, this.cam.zoom);
        ctx.translate(-cx, -cy);

        // Determine scale based on max orbit
        const maxOrbit = Math.max(...this.data.planets.map(p => p.orbit), 100);
        const scale = Math.min(w, h) * 0.4 / maxOrbit;

        // Draw orbital rings
        const orbits = [...new Set(this.data.planets.map(p => p.orbit))].sort((a, b) => a - b);
        ctx.strokeStyle = 'rgba(60, 140, 80, 0.3)';
        ctx.lineWidth = 1;
        for (const orbit of orbits) {
            if (orbit === 0) continue;
            ctx.beginPath();
            ctx.arc(cx, cy, orbit * scale, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw central star
        const starRadius = 20;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, starRadius * 2);
        gradient.addColorStop(0, '#fff8e0');
        gradient.addColorStop(0.3, '#ffcc33');
        gradient.addColorStop(0.7, '#ff8800');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, starRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd44';
        ctx.fill();

        // Star label
        ctx.fillStyle = 'rgba(255, 220, 100, 0.8)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.name, cx, cy + starRadius + 16);

        // Draw planets
        this.planetPositions = [];
        const angleStep = (Math.PI * 2) / Math.max(this.data.planets.filter(p => p.orbit > 0).length, 1);
        let angleIdx = 0;

        for (const planet of this.data.planets) {
            if (planet.orbit === 0) continue; // Star itself
            const angle = angleIdx * angleStep + 0.5;
            angleIdx++;
            const r = planet.orbit * scale;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            const size = Math.max(4, planet.size * 0.6);

            // Planet body
            const color = this.getPlanetColor(planet.planet_class);
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Colonized indicator
            if (planet.colonized) {
                ctx.beginPath();
                ctx.arc(px, py, size + 3, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 200, 100, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Label
            ctx.fillStyle = 'rgba(200, 220, 240, 0.8)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(planet.name, px, py + size + 12);

            this.planetPositions.push({ id: planet.id, x: px, y: py, r: size + 5 });
        }

        // Draw fleets
        this.fleetPositions = [];
        for (const fleet of this.data.fleets) {
            if (fleet.station) continue;
            const fx = cx + fleet.x * scale * 0.3;
            const fy = cy + fleet.y * scale * 0.3;

            ctx.beginPath();
            if (fleet.civilian) {
                ctx.arc(fx, fy, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#4c8';
            } else {
                ctx.moveTo(fx, fy - 5);
                ctx.lineTo(fx - 4, fy + 4);
                ctx.lineTo(fx + 4, fy + 4);
                ctx.closePath();
                ctx.fillStyle = '#f84';
            }
            ctx.fill();
            this.fleetPositions.push({ id: fleet.id, x: fx, y: fy, r: 8 });
        }

        ctx.restore();

        // Setup click handler (screen space → world space)
        this.canvas.onclick = (e) => {
            if (!this.active || this.moved) return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            // Invert camera transform
            const mx = (sx - this.cam.ox - cx) / this.cam.zoom + cx;
            const my = (sy - this.cam.oy - cy) / this.cam.zoom + cy;

            for (const f of this.fleetPositions) {
                if (Math.hypot(f.x - mx, f.y - my) < f.r) {
                    this.callbacks.onFleetClick(f.id);
                    return;
                }
            }
            for (const p of this.planetPositions) {
                if (Math.hypot(p.x - mx, p.y - my) < p.r) {
                    this.callbacks.onPlanetClick(p.id);
                    return;
                }
            }
        };
    }

    drawStars(ctx, w, h) {
        if (!this._stars) {
            this._stars = [];
            let seed = 54321;
            const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
            for (let i = 0; i < 150; i++) {
                this._stars.push({ x: rng() * 2000, y: rng() * 2000, r: rng() * 1 + 0.3, a: rng() * 0.3 + 0.1 });
            }
        }
        for (const star of this._stars) {
            const sx = star.x % w;
            const sy = star.y % h;
            ctx.beginPath();
            ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${star.a})`;
            ctx.fill();
        }
    }

    getPlanetColor(pc) {
        if (!pc) return '#888';
        if (pc.includes('continental')) return '#4488aa';
        if (pc.includes('ocean')) return '#2266cc';
        if (pc.includes('desert')) return '#cc9944';
        if (pc.includes('arid')) return '#bb8844';
        if (pc.includes('tundra')) return '#8899aa';
        if (pc.includes('arctic')) return '#aaccee';
        if (pc.includes('tropical')) return '#44aa66';
        if (pc.includes('alpine')) return '#88aacc';
        if (pc.includes('savannah')) return '#aa8844';
        if (pc.includes('molten')) return '#cc4422';
        if (pc.includes('frozen')) return '#aaddff';
        if (pc.includes('barren')) return '#887766';
        if (pc.includes('gas_giant')) return '#cc8844';
        if (pc.includes('toxic')) return '#88aa22';
        if (pc.includes('machine')) return '#668888';
        if (pc.includes('hive')) return '#886644';
        if (pc.includes('city')) return '#6688aa';
        if (pc.includes('star')) return '#ffcc44';
        return '#888888';
    }
}

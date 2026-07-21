// Fleet Window DOM Renderer
export function renderFleetWindow(container, data, callbacks) {
    const shipType = data.ships.length > 0 ? data.ships[0].ship_size : 'unknown';
    const typeLabel = getShipSizeLabel(shipType);
    const fleetType = data.civilian ? '民用舰船' : data.station ? '空间站' : '军用舰队';

    container.innerHTML = `
        <div class="popup-header">
            <div>
                <div class="popup-title">${esc(data.name)}</div>
                <div class="popup-subtitle">${typeLabel} · ${fleetType} · ${data.ships.length} 艘</div>
            </div>
            <button class="popup-close" id="fleet-close">×</button>
        </div>
        <div class="popup-body">
            <div class="stat-bars">
                <div class="stat-bar">
                    <div class="stat-bar-fill hull" style="width:${avgStat(data.ships, 'hp_pct')}%"></div>
                    <div class="stat-bar-label">船体 ${avgStat(data.ships, 'hp_pct').toFixed(0)}%</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill shield" style="width:${avgStat(data.ships, 'shield_pct')}%"></div>
                    <div class="stat-bar-label">护盾 ${avgStat(data.ships, 'shield_pct').toFixed(0)}%</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill armor" style="width:${avgStat(data.ships, 'armor_pct')}%"></div>
                    <div class="stat-bar-label">装甲 ${avgStat(data.ships, 'armor_pct').toFixed(0)}%</div>
                </div>
            </div>

            ${data.commander ? `
            <div class="commander-section">
                <div class="commander-portrait">👤</div>
                <div class="commander-info">
                    <div class="commander-name">${esc(data.commander.name)}</div>
                    <div class="commander-role">${getLeaderClassLabel(data.commander.class)}</div>
                    <div class="commander-level">等级 ${data.commander.level}</div>
                </div>
            </div>` : ''}

            <div style="font-size:0.75rem;color:var(--text-secondary);margin:6px 0;">
                ${data.movement_state === 'move_idle' ? '待命中' :
                  data.movement_state === 'move_system' ? `正在移动${data.destination ? ' → ' + esc(data.destination) : ''}` :
                  data.movement_state}
                ${data.military_power > 0 ? ` · 军事力量 ${data.military_power.toFixed(0)}` : ''}
            </div>

            <div class="ship-grid">
                ${data.ships.map(s => `
                    <div class="ship-grid-item" data-ship-id="${s.id}">
                        <div class="ship-icon">${getShipIcon(s.ship_size)}</div>
                        <div class="ship-class">${esc(s.name)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="popup-actions">
            <div class="action-btn">舰队管理</div>
            <div class="action-btn">解散舰队</div>
        </div>
    `;

    container.querySelector('#fleet-close').onclick = callbacks.onClose;
    container.querySelectorAll('.ship-grid-item').forEach(el => {
        el.onclick = () => callbacks.onShipClick(parseInt(el.dataset.shipId));
    });
}

function avgStat(ships, field) {
    if (ships.length === 0) return 100;
    return ships.reduce((sum, s) => sum + (s[field] || 0), 0) / ships.length;
}

function getShipSizeLabel(size) {
    const map = {
        corvette: '护卫舰', destroyer: '驱逐舰', cruiser: '巡洋舰',
        battleship: '战列舰', titan: '泰坦', juggernaut: '主宰',
        science: '科研船', constructor: '工程船', colonizer: '殖民船',
        transport: '运输船', military_station_small: '小型防御平台',
        military_station_medium: '中型防御平台', military_station_large: '大型防御平台',
        starbase: '星港', ion_cannon: '离子炮',
    };
    return map[size] || size;
}

function getLeaderClassLabel(cls) {
    const map = { commander: '指挥官', scientist: '科学家', governor: '总督', general: '将军' };
    return map[cls] || cls;
}

function getShipIcon(size) {
    if (size === 'corvette') return '🔹';
    if (size === 'destroyer') return '🔷';
    if (size === 'cruiser') return '⬡';
    if (size === 'battleship') return '⬢';
    if (size === 'science') return '🔬';
    if (size === 'constructor') return '🔧';
    if (size === 'colonizer') return '🌍';
    return '🚀';
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

// Planet Window DOM Renderer (full-screen panel with tabs)
export function renderPlanetWindow(container, data, callbacks) {
    const classLabel = getPlanetClassLabel(data.planet_class);
    const govLabel = data.governor ? `${esc(data.governor.name)} · ${getLeaderClassLabel(data.governor.class)}` : '无总督';

    container.innerHTML = `
        <div class="planet-header">
            <div class="planet-governor-portrait"><img src="${import.meta.env.BASE_URL}gfx/interface/fleet_view/unknown_leader.webp" alt=""></div>
            <div class="planet-title-block">
                <div class="planet-name">${esc(data.name)}</div>
                <div class="planet-class-label">${classLabel} · ${esc(data.designation || '')}</div>
                <div class="planet-governor-name">${govLabel}</div>
            </div>
            <button class="planet-close" id="planet-close" title="关闭" aria-label="关闭"></button>
        </div>
        <div class="planet-resources">
            ${planetMetric('pop.webp', data.num_pops, '人口')}
            ${planetMetric('stability.webp', `${data.stability.toFixed(0)}%`, '稳定度')}
            ${planetMetric('planet_housing.webp', data.total_housing.toFixed(0), '住房')}
            ${planetMetric('planet_amenities.webp', `${data.amenities.toFixed(0)}/${data.amenities_usage.toFixed(0)}`, '舒适度')}
            ${planetMetric('text_icons/text_icon_defense_army.webp', `${data.armies}`, '陆军')}
        </div>
        <div class="planet-tabs">
            <div class="planet-tab active" data-tab="surface">地表</div>
            <div class="planet-tab" data-tab="manage">管理</div>
            <div class="planet-tab" data-tab="economy">经济</div>
            <div class="planet-tab" data-tab="army">陆军</div>
            <div class="planet-tab" data-tab="property">地产</div>
        </div>
        <div class="planet-body">
            <div class="planet-main" id="planet-tab-content"></div>
            <div class="planet-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-section-title">行星总览</div>
                    <div class="sidebar-stat"><span class="label">类型</span><span class="value">${classLabel}</span></div>
                    <div class="sidebar-stat"><span class="label">规模</span><span class="value icon-value"><img src="${import.meta.env.BASE_URL}gfx/interface/icons/planet_size.webp" alt="">${data.size}</span></div>
                    <div class="sidebar-stat"><span class="label">殖民时间</span><span class="value">${esc(data.colonize_date || '未殖民')}</span></div>
                    <div class="sidebar-stat"><span class="label">所有者</span><span class="value">${esc(data.owner_name || '无')}</span></div>
                    <div class="sidebar-stat"><span class="label">稳定度</span><span class="value">${data.stability.toFixed(1)}%</span></div>
                    <div class="sidebar-stat"><span class="label">犯罪率</span><span class="value">${data.crime.toFixed(1)}</span></div>
                    <div class="sidebar-stat"><span class="label">住房</span><span class="value">${data.free_housing.toFixed(0)} 空闲</span></div>
                    <div class="sidebar-stat"><span class="label">矿藏</span><span class="value">${data.deposits_count} 个</span></div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#planet-close').onclick = callbacks.onClose;

    // Tab switching
    const tabs = container.querySelectorAll('.planet-tab');
    const content = container.querySelector('#planet-tab-content');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTabContent(content, tab.dataset.tab, data);
        };
    });

    // Default tab
    renderTabContent(content, 'surface', data);
}

function planetMetric(icon, value, label) {
    return `<span class="planet-res-item" title="${label}"><img src="${import.meta.env.BASE_URL}gfx/interface/icons/${icon}" alt="">${value}</span>`;
}

function renderTabContent(container, tab, data) {
    switch (tab) {
        case 'surface': renderSurfaceTab(container, data); break;
        case 'manage': renderManageTab(container, data); break;
        case 'economy': renderEconomyTab(container, data); break;
        case 'army': renderArmyTab(container, data); break;
        case 'property': renderPropertyTab(container, data); break;
    }
}

function renderSurfaceTab(container, data) {
    // Group districts by type
    const byType = {};
    for (const d of data.districts) {
        const type = d.district_type || 'unknown';
        if (!byType[type]) byType[type] = [];
        byType[type].push(d);
    }

    const districtTypes = [
        { key: 'district_city', label: '城市区划', icon: '城' },
        { key: 'district_generator', label: '发电区划', icon: '能' },
        { key: 'district_mining', label: '采矿区划', icon: '矿' },
        { key: 'district_farming', label: '农业区划', icon: '农' },
        { key: 'district_industrial', label: '工业区划', icon: '工' },
        { key: 'district_hive', label: '蜂巢区划', icon: '巢' },
        { key: 'district_nexus', label: '节点区划', icon: '节' },
    ];

    let html = '<h3 style="font-size:0.85rem;margin-bottom:12px;color:var(--text-gold);">区划和建筑</h3>';

    for (const dt of districtTypes) {
        const districts = byType[dt.key];
        if (!districts || districts.length === 0) continue;
        const maxLevel = Math.max(...districts.map(d => d.level));
        html += `
            <div class="district-section">
                <div class="district-title">
                    <span>${dt.icon} ${dt.label}</span>
                    <span class="district-progress">${districts.length} 个 · 最高等级 ${maxLevel}</span>
                </div>
                <div class="district-grid">
                    ${districts.map(d => `
                        <div class="district-slot filled">
                            <div class="slot-icon">${dt.icon}</div>
                            <div class="slot-level">Lv.${d.level}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Show remaining district types not in the predefined list
    for (const [type, districts] of Object.entries(byType)) {
        if (districtTypes.some(dt => dt.key === type)) continue;
        html += `
            <div class="district-section">
                <div class="district-title">
                    <span><i class="district-glyph">?</i> ${esc(type)}</span>
                    <span class="district-progress">${districts.length} 个</span>
                </div>
                <div class="district-grid">
                    ${districts.map(d => `
                        <div class="district-slot filled">
                            <div class="slot-icon">?</div>
                            <div class="slot-level">Lv.${d.level}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (data.districts.length === 0) {
        html += '<p style="color:var(--text-secondary);font-size:0.8rem;">无区划数据（未殖民或无数据）</p>';
    }

    container.innerHTML = html;
}

function renderManageTab(container, data) {
    container.innerHTML = `
        <h3 style="font-size:0.85rem;margin-bottom:12px;color:var(--text-gold);">行星管理</h3>
        <div class="sidebar-section">
            <div class="sidebar-section-title">人口概要</div>
            <div class="pop-group">
                <div class="pop-icon"><img src="${import.meta.env.BASE_URL}gfx/interface/icons/pop.webp" alt=""></div>
                <div class="pop-info">
                    <div class="pop-name">总人口</div>
                    <div class="pop-count">${data.num_pops}</div>
                </div>
            </div>
        </div>
        <div class="sidebar-section">
            <div class="sidebar-section-title">行星状态</div>
            <div class="sidebar-stat"><span class="label">稳定度</span><span class="value">${data.stability.toFixed(1)}%</span></div>
            <div class="sidebar-stat"><span class="label">犯罪率</span><span class="value">${data.crime.toFixed(1)}</span></div>
            <div class="sidebar-stat"><span class="label">设施</span><span class="value">${data.amenities.toFixed(0)} / ${data.amenities_usage.toFixed(0)}</span></div>
            <div class="sidebar-stat"><span class="label">住房</span><span class="value">${data.total_housing.toFixed(0)} (空闲 ${data.free_housing.toFixed(0)})</span></div>
        </div>
        <div class="sidebar-section">
            <div class="sidebar-section-title">总督</div>
            ${data.governor ? `
            <div class="pop-group">
                <div class="pop-icon"><img src="${import.meta.env.BASE_URL}gfx/interface/fleet_view/unknown_leader.webp" alt=""></div>
                <div class="pop-info">
                    <div class="pop-name">${esc(data.governor.name)}</div>
                    <div class="pop-count">${getLeaderClassLabel(data.governor.class)} · 等级 ${data.governor.level}</div>
                </div>
            </div>` : '<p style="color:var(--text-secondary);font-size:0.8rem;">无总督</p>'}
        </div>
    `;
}

function renderEconomyTab(container, data) {
    container.innerHTML = `
        <h3 style="font-size:0.85rem;margin-bottom:12px;color:var(--text-gold);">经济概览</h3>
        <div class="sidebar-section">
            <div class="sidebar-section-title">行星产出</div>
            <p style="color:var(--text-secondary);font-size:0.8rem;margin:8px 0;">
                区划数量: ${data.districts.length}<br>
                矿藏数量: ${data.deposits_count}<br>
                人口: ${data.num_pops}
            </p>
        </div>
        <div class="sidebar-section">
            <div class="sidebar-section-title">区划分布</div>
            ${getDistrictSummary(data.districts)}
        </div>
    `;
}

function renderArmyTab(container, data) {
    container.innerHTML = `
        <h3 style="font-size:0.85rem;margin-bottom:12px;color:var(--text-gold);">陆军</h3>
        <div class="sidebar-section">
            <div class="sidebar-section-title">当前部队: ${data.armies}</div>
            ${data.armies > 0 ? `
                <p style="color:var(--text-secondary);font-size:0.8rem;margin:8px 0;">
                    该行星有 ${data.armies} 支陆军部队驻守。
                </p>
            ` : '<p style="color:var(--text-secondary);font-size:0.8rem;">无驻军</p>'}
        </div>
    `;
}

function renderPropertyTab(container, data) {
    container.innerHTML = `
        <h3 style="font-size:0.85rem;margin-bottom:12px;color:var(--text-gold);">地产</h3>
        <div class="sidebar-section">
            <div class="sidebar-section-title">企业政府</div>
            <p style="color:var(--text-secondary);font-size:0.8rem;margin:8px 0;">没有企业地产</p>
        </div>
        <div class="sidebar-section">
            <div class="sidebar-section-title">宗主国</div>
            <p style="color:var(--text-secondary);font-size:0.8rem;margin:8px 0;">没有宗主地产</p>
        </div>
    `;
}

function getDistrictSummary(districts) {
    const byType = {};
    for (const d of districts) {
        const t = d.district_type || 'unknown';
        byType[t] = (byType[t] || 0) + 1;
    }
    return Object.entries(byType).map(([type, count]) =>
        `<div class="sidebar-stat"><span class="label">${esc(getDistrictLabel(type))}</span><span class="value">${count}</span></div>`
    ).join('');
}

function getDistrictLabel(type) {
    const map = {
        district_city: '城市', district_generator: '发电', district_mining: '采矿',
        district_farming: '农业', district_industrial: '工业', district_hive: '蜂巢',
        district_nexus: '节点',
    };
    return map[type] || type;
}

function getPlanetClassLabel(pc) {
    const map = {
        pc_continental: '陆地星球', pc_ocean: '海洋星球', pc_desert: '沙漠星球',
        pc_arid: '干旱星球', pc_tundra: '冻原星球', pc_arctic: '极地星球',
        pc_tropical: '热带星球', pc_alpine: '高山星球', pc_savannah: '草原星球',
        pc_molten: '熔融星球', pc_frozen: '冰冻星球', pc_barren: '荒芜星球',
        pc_gas_giant: '气态巨行星', pc_toxic: '有毒星球', pc_machine: '机械星球',
        pc_hive: '蜂巢星球', pc_city: '城市星球', pc_g_star: 'G型恒星',
        pc_m_star: 'M型恒星', pc_k_star: 'K型恒星', pc_b_star: 'B型恒星',
        pc_a_star: 'A型恒星', pc_f_star: 'F型恒星', pc_m_giant_star: 'M型巨星',
        pc_black_hole: '黑洞', pc_neutron_star: '中子星', pc_pulsar: '脉冲星',
        pc_asteroid: '小行星', pc_ringworld_habitable: '环形世界',
        pc_habitat: '栖息地', pc_shattered_ring_habitable: '破碎环形世界',
    };
    return map[pc] || pc || '未知';
}

function getLeaderClassLabel(cls) {
    const map = { commander: '指挥官', scientist: '科学家', governor: '总督', general: '将军' };
    return map[cls] || cls || '';
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

import planetViewDefinition from 'virtual:stellaris-planet-view-ui';
import loadLocalization from 'virtual:stellaris-localization';
import { mountGui } from './gui-runtime.js';

let strings = {};
const localizationReady = loadLocalization().then(value => {
    strings = value;
    return value;
});

function localize(key) {
    let text = strings[key] ?? key;
    for (let depth = 0; depth < 4 && /\$[^$]+\$/.test(text); depth += 1) {
        text = text.replace(/\$([^$]+)\$/g, (_match, nestedKey) => strings[nestedKey] ?? '—');
    }
    return text.replace(/£[^£]+£/g, '').replace(/§./g, '');
}

function ensureStyle() {
    if (document.getElementById('generated-planet-view-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-planet-view-style';
    style.textContent = `
        #planet-window:has(> [data-gui-name="planet_view"]),
        #planet-view-preview:has(> [data-gui-name="planet_view"]) {
            display:block; width:1162px; height:680px; min-width:1162px;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
        }
        #planet-window:has(> [data-gui-name="planet_view"])::after { display:none; }
    `;
    document.head.appendChild(style);
}

function directChild(parent, name) {
    return [...parent.children].find(element => element.dataset?.guiName === name) || null;
}

function hide(element) {
    if (element) element.style.display = 'none';
}

function selectStaticSummary(view) {
    const root = view.root;
    for (const name of [
        'terraforming_in_progress',
        'colonize_button_container',
        'sector_governor_window',
        'planet_devastation',
        'management_window',
        'population_window',
        'armies_window',
        'corporate_window',
        'summary_tab',
        'management_tab_active',
        'population_tab_active',
        'armies_tab_active',
        'corporate_tab_active',
        'side_bar_window',
    ]) hide(directChild(root, name));

    const header = directChild(root, 'header_actions');
    for (const name of ['open_orbital_ring', 'previous_planet_extra_shortcut', 'move_capital', 'go_to_observation_post']) {
        hide(header && view.findIn(header, name));
    }

    const actions = directChild(root, 'planet_actions_window');
    for (const element of view.findAll('colonizing_planet_window', actions || root)) hide(element);

    const summary = directChild(root, 'summary_window');
    for (const name of ['uncolonizable_planet_window', 'archaeological_site_window', 'colonized_planet_window']) {
        hide(summary && directChild(summary, name));
    }
    return { summary, colonizable: summary && directChild(summary, 'colonizable_planet_window') };
}

function seedDistrictPlaceholders(view, colonizable) {
    if (!colonizable) return;
    const mainGrid = view.findIn(colonizable, 'main_districts_grid_box', 'gridboxtype');
    if (mainGrid) view.instantiate('planet_district_entry_width_2', mainGrid, { name: 'main-district-placeholder' });

    const districtGrid = view.findIn(colonizable, 'districts_grid_box', 'gridboxtype');
    if (!districtGrid) return;
    for (let index = 0; index < 3; index += 1) {
        view.instantiate('planet_district_entry_width_1', districtGrid, { name: `district-placeholder-${index}` });
    }
}

function applyStaticPlaceholders(view) {
    const values = {
        planet_name: '行星名称',
        colony_type_text: '殖民地类型',
        planet_stability_amount: '—',
        planet_pops_amount: '—',
        crime_amount: '—',
    };
    for (const [name, value] of Object.entries(values)) {
        const element = view.find(name);
        if (element) element.textContent = value;
    }
}

export function renderPlanetWindow(container, _data = {}, callbacks = {}) {
    ensureStyle();
    const view = mountGui(container, planetViewDefinition, { localize, applyRootPosition: false });
    const { colonizable } = selectStaticSummary(view);
    seedDistrictPlaceholders(view, colonizable);
    applyStaticPlaceholders(view);

    localizationReady.then(() => {
        view.localizeAll(localize);
        applyStaticPlaceholders(view);
    });

    const close = view.find('close');
    if (close) close.onclick = callbacks.onClose || (() => {});
    return view;
}

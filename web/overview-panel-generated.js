import outlinerDefinition from 'virtual:stellaris-outliner-ui';
import { mountGui } from './gui-runtime.js';
import { bindOverviewPanelData } from './overview-panel-binding.js';
import { localizeGameText } from './game-localization.js';

const OUTLINER_TABS = [
    ['government', 'outliner_government'],
    ['ships', 'outliner_ships'],
    ['politics', 'outliner_politics'],
    ['structures', 'outliner_structures'],
];

function setFramedSprite(element, path, frames, frame = 0) {
    if (!element) return;
    element.style.backgroundImage = `url("${path}")`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = `${frames * 100}% 100%`;
    element.style.backgroundPosition = `${frames <= 1 ? 0 : frame / (frames - 1) * 100}% 0`;
}

function ensureStyle() {
    if (document.getElementById('generated-overview-panel-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-overview-panel-style';
    style.textContent = `
        #overview-panel.generated-overview-shell {
            display:block; inset:0 !important; width:auto; height:auto;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
            pointer-events:none;
        }
        #overview-panel.generated-overview-shell > [data-gui-name] { pointer-events:auto; }
        #overview-panel.generated-overview-shell > [data-gui-name="outliner_controller_window"],
        #overview-panel.generated-overview-shell > [data-gui-name="tabs_outliner_window"] {
            pointer-events:none;
        }
        #overview-panel [data-gui-name="outliner_toggle_window"],
        #overview-panel [data-gui-name="outliner_toggle_window"] > button {
            pointer-events:auto;
        }
        [data-gui-name="outliner_tab_window"] { user-select:none; }
        [data-gui-name="tabs_outliner_window"] [data-gui-instance^="outliner-tab-"] { pointer-events:none; }
        [data-overview-kind="planet"], [data-overview-kind="fleet"], [data-overview-kind="station"] { cursor:pointer; }
        .generated-overview-hit-target {
            position:absolute; inset:0; z-index:10; width:100%; height:100%;
            padding:0; border:0; background:transparent; opacity:0; cursor:pointer; pointer-events:auto;
        }
        .generated-overview-inline-icon { display:block; width:15px; height:16px; object-fit:contain; flex:none; }
    `;
    document.head.appendChild(style);
}

function buildTabs(view, container) {
    const tabs = view.instantiate('tabs_outliner_window', container, { name: 'outliner-tabs' });
    const grid = tabs.querySelector('[data-gui-name="tabs_gridbox"]');
    OUTLINER_TABS.forEach(([name, labelKey], index) => {
        const entry = view.instantiate('tabs_gridbox_entry', grid, { name: `outliner-tab-${name}` });
        const icon = entry.querySelector('[data-gui-name="tab_button_background_icon"]');
        setFramedSprite(icon, `/gfx/interface/outliner/outliner_${name}_tab_button.webp`, 2, index === 0 ? 1 : 0);
        const button = entry.querySelector('[data-gui-name="button_overlay"]');
        button?.setAttribute('aria-label', localizeGameText(labelKey));
        button?.setAttribute('aria-selected', String(index === 0));
        entry.querySelector('[data-gui-name="notification_container"]')?.style.setProperty('display', 'none');
    });
    return tabs;
}

function buildController(view, container, tabs) {
    const controller = view.instantiate('outliner_controller_window', container, { name: 'outliner-controller' });
    const toggleWindow = controller.querySelector('[data-gui-name="outliner_toggle_window"]');
    if (toggleWindow) toggleWindow.style.left = 'calc(100% - 65px)';
    const toggle = controller.querySelector('[data-gui-name="tabbed_outliner_toggle"]');
    if (toggle) {
        setFramedSprite(toggle, '/gfx/interface/buttons/outliner_button.webp', 3);
        toggle.style.width = '73px';
        toggle.style.height = '53px';
        toggle.setAttribute('aria-expanded', 'true');
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') !== 'false';
            toggle.setAttribute('aria-expanded', String(!expanded));
            tabs.style.display = expanded ? 'none' : '';
            view.root.style.display = expanded ? 'none' : '';
        });
    }
    controller.querySelector('[data-gui-name="observer_outliner_toggle"]')?.style.setProperty('display', 'none');
    return controller;
}

function buildPopup(view, container, templateName, instanceName) {
    const popup = view.instantiate(templateName, container, { name: instanceName });
    popup.style.display = 'none';
    popup.querySelector('[data-gui-name="close"]')?.addEventListener('click', () => {
        popup.style.display = 'none';
    });
    return popup;
}

function bindShellControls(view, options, rearrange) {
    view.find('options')?.addEventListener('click', () => {
        const opening = options.style.display === 'none';
        options.style.display = opening ? '' : 'none';
        rearrange.style.display = 'none';
    });
    view.find('rearrange')?.addEventListener('click', () => {
        const opening = rearrange.style.display === 'none';
        rearrange.style.display = opening ? '' : 'none';
        options.style.display = 'none';
    });
}

function sizeOutlinerContent(view) {
    // outliner.gui leaves these two heights at 20/0 for game code to size.
    // Preserve its y=186 origin and reserve the viewer's 35px status bar.
    view.root.style.height = 'calc(100vh - 221px)';
    const list = view.findIn(view.root, 'list', 'smoothlistboxtype');
    if (list) list.style.height = 'calc(100vh - 261px)';
}

export function renderOverviewPanel(container, playerInfo = {}, callbacks = {}) {
    ensureStyle();
    container.classList.add('generated-overview-shell');
    const view = mountGui(container, outlinerDefinition, { localize: localizeGameText });
    const tabs = buildTabs(view, container);
    const controller = buildController(view, container, tabs);
    const options = buildPopup(view, container, 'outliner_options_window', 'outliner-options');
    const rearrange = buildPopup(view, container, 'outliner_rearrange_window', 'outliner-rearrange');
    bindShellControls(view, options, rearrange);
    const result = bindOverviewPanelData(view, playerInfo, callbacks);
    sizeOutlinerContent(view);
    return { ...view, ...result, tabs, controller, options, rearrange };
}

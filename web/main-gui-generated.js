import definition from 'virtual:stellaris-main-gui-ui';
import { mountGui } from './gui-runtime.js';
import { bindMainGuiData } from './main-gui-binding.js';

const STYLE_ID = 'generated-main-gui-style';

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #resource-bar:has(> .generated-main-gui) {
            display:block; height:36px; padding:0; overflow:visible;
            box-shadow:0 2px 13px #000;
        }
        #resource-bar:has(> .generated-main-gui)::before { content:none; }
        #resource-bar:has(> .generated-main-gui) ~ #sidebar { top:36px; }
        #resource-bar:has(> .generated-main-gui) ~ #overview-panel { top:36px; }
        #resource-bar > .generated-main-gui {
            position:absolute; inset:0; width:100%; height:36px; overflow:visible;
        }
        #resource-bar .generated-main-gui > [data-gui-name="topbar_extended"] {
            width:100%; height:36px;
        }
        #resource-bar .generated-main-gui > [data-gui-name="topbar_static"] {
            width:994px; height:36px; overflow:visible;
        }
        #resource-bar .generated-main-resource-group { cursor:default; }
        #resource-bar .generated-main-dropdown { cursor:pointer; }
        #resource-bar .generated-main-resource-group:hover > [data-gui-name="background"] {
            background-position:100% 0 !important;
        }
        #resource-bar .generated-main-amount.positive { color:#8ce19d !important; }
        #resource-bar .generated-main-amount.negative { color:#ef766d !important; }
        #resource-bar .generated-main-dropdown-row { cursor:default; }
        #resource-bar .generated-main-dropdown > [data-gui-name="expanded_window"] {
            z-index:200; overflow:visible;
        }
        #resource-bar .generated-main-dropdown > [data-gui-name="expanded_window"] > [data-gui-name="bg"] {
            inset:0; width:100%; height:100%; border:0;
            background-size:100% 100%;
        }
    `;
    document.head.appendChild(style);
}

function keepResourceBarNodes(view) {
    const extended = view.find('topbar_extended');
    const resources = view.find('topbar_static');
    if (!extended || !resources) throw new Error('main.gui is missing its generated resource bar nodes');
    view.root.replaceChildren(extended, resources);
}

export function renderMainGui(container, playerInfo = {}) {
    installStyles();
    container._generatedMainGuiCleanup?.();

    const view = mountGui(container, definition, {
        applyRootPosition: false,
        localize: key => key,
    });
    view.root.classList.add('generated-main-gui');
    keepResourceBarNodes(view);
    container._generatedMainGuiCleanup = bindMainGuiData(view, playerInfo);
    return view;
}

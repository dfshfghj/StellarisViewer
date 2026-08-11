import fleetViewDefinition from 'virtual:stellaris-fleet-view-ui';
import { mountGui } from './gui-runtime.js';
import { localizeGameText as localize } from './game-localization.js';
import { bindFleetViewData, bindFleetViewText } from './fleet-view-binding.js';

function ensureStyle() {
    if (document.getElementById('generated-fleet-view-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-fleet-view-style';
    style.textContent = `
        #fleet-window:has(> [data-gui-name="fleet_view"]) {
            display:block; width:510px; min-width:510px; max-width:510px;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
        }
        [data-gui-name="fleet_view"] { user-select:none; }
        [data-gui-name="fleet_view"] > [data-gui-name="header"].generated-fleet-drag-handle {
            display:block; padding:0; z-index:3;
        }
        .generated-fleet-commander {
            position:absolute; inset:5px; display:flex; align-items:center; gap:8px;
            overflow:hidden; color:#d5e8e5; font:12px/1.35 Arial,"Microsoft YaHei",sans-serif;
        }
        .generated-fleet-commander-portrait { width:64px; height:90px; object-fit:cover; flex:none; }
        .generated-fleet-commander-copy { min-width:0; }
        .generated-fleet-commander-name { color:#fff; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .generated-fleet-commander-detail { margin-top:4px; color:#9fc8bf; }
        .generated-fleet-commander-traits { margin-top:5px; color:#c7b878; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .generated-fleet-inline-icon {
            display:block; width:16px; height:16px; object-fit:contain; flex:none; pointer-events:none;
        }
        .generated-fleet-inline-value { min-width:0; white-space:nowrap; }
    `;
    document.head.appendChild(style);
}

export function renderFleetWindow(container, data = {}, callbacks = {}) {
    ensureStyle();
    const view = mountGui(container, fleetViewDefinition, { localize, applyRootPosition: false });
    const result = bindFleetViewData(view, data, callbacks);
    container.style.height = `${result.rootHeight}px`;

    const header = view.find('header');
    header?.classList.add('popup-header', 'generated-fleet-drag-handle');
    const close = header && view.findIn(header, 'close', 'buttontype');
    if (close) close.onclick = callbacks.onClose || (() => {});

    view.localizeAll(localize);
    bindFleetViewText(view, result.entry, data);
    return view;
}

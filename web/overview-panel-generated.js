import outlinerDefinition from 'virtual:stellaris-outliner-ui';
import { mountGui } from './gui-runtime.js';
import { bindOverviewPanelData } from './overview-panel-binding.js';
import { t } from './app-i18n.js';

function ensureStyle() {
    if (document.getElementById('generated-overview-panel-style')) return;
    const style = document.createElement('style');
    style.id = 'generated-overview-panel-style';
    style.textContent = `
        #overview-panel:has(> [data-gui-name="outliner_tab_window"]) {
            display:block; top:47px; right:0; bottom:35px; width:320px;
            padding:0; border:0; background:none; box-shadow:none; overflow:visible;
        }
        [data-gui-name="outliner_tab_window"] { user-select:none; }
        [data-overview-kind="planet"], [data-overview-kind="fleet"], [data-overview-kind="station"] { cursor:pointer; }
        .generated-overview-close {
            position:absolute; z-index:5; top:4px; right:5px; width:24px; height:24px;
            padding:0; border:0; background:transparent url('/gfx/interface/buttons/button_close_24_animated.webp') 0 0 / 300% 100% no-repeat;
            cursor:pointer;
        }
        .generated-overview-close:hover { background-position:50% 0; }
        .generated-overview-close:active { background-position:100% 0; }
        .generated-overview-inline-icon { display:block; width:15px; height:16px; object-fit:contain; flex:none; }
    `;
    document.head.appendChild(style);
}

export function renderOverviewPanel(container, playerInfo = {}, callbacks = {}) {
    ensureStyle();
    const view = mountGui(container, outlinerDefinition, { applyRootPosition: false, localize: key => key });
    const result = bindOverviewPanelData(view, playerInfo, callbacks);
    const close = document.createElement('button');
    close.className = 'generated-overview-close';
    close.type = 'button';
    close.title = t('common.close');
    close.setAttribute('aria-label', t('common.close'));
    close.onclick = callbacks.onClose || (() => {});
    view.root.appendChild(close);
    return { ...view, ...result };
}

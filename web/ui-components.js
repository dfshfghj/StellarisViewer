// UI Components: Status Bar

import { resolveGameLocalization } from './game-localization.js';
import { t } from './app-i18n.js';

export function renderStatusBar(dateEl, empireEl, playerInfo) {
    if (!playerInfo) return;
    dateEl.textContent = playerInfo.date || '';
    const govLabel = getGovLabel(playerInfo.government_type);
    empireEl.textContent = `${playerInfo.name} — ${govLabel}`;
}

function getGovLabel(govType) {
    if (!govType) return t('common.unknown');
    const localized = resolveGameLocalization(govType);
    return localized === govType ? govType : localized.replace(/§./g, '');
}

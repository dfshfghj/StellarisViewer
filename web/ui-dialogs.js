import { t } from './app-i18n.js';

export function showDialog(layer, options = {}) {
    const {
        title = t('dialog.info'),
        description = '',
        confirmText = t('dialog.confirm'),
        cancelText = '',
        tone = 'standard',
        onConfirm = null,
    } = options;

    layer.innerHTML = `
        <div class="stellaris-dialog stellaris-dialog-${escAttr(tone)}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div class="dialog-hex" aria-hidden="true"></div>
            <div class="dialog-header-line" aria-hidden="true"></div>
            <h2 id="dialog-title">${esc(title)}</h2>
            <div class="dialog-description">${esc(description)}</div>
            <div class="dialog-actions">
                ${cancelText ? `<button class="game-button dialog-cancel" type="button">${esc(cancelText)}</button>` : ''}
                <button class="game-button dialog-confirm" type="button">${esc(confirmText)}</button>
            </div>
        </div>`;
    layer.classList.remove('hidden');
    layer.setAttribute('aria-hidden', 'false');

    const close = () => {
        layer.classList.add('hidden');
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML = '';
    };
    layer.querySelector('.dialog-confirm').onclick = () => {
        onConfirm?.();
        close();
    };
    layer.querySelector('.dialog-cancel')?.addEventListener('click', close);
    layer.onclick = event => {
        if (event.target === layer) close();
    };
    layer.querySelector('.dialog-confirm').focus();
    return close;
}

function esc(value) {
    const element = document.createElement('div');
    element.textContent = String(value ?? '');
    return element.innerHTML;
}

function escAttr(value) {
    return String(value).replace(/[^a-z0-9_-]/gi, '');
}

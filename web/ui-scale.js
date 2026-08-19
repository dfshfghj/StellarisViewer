export const UI_SCALE = 0.67;

export function configureGameUiScale(layer) {
    if (!layer) return;
    layer.style.setProperty('--ui-scale', String(UI_SCALE));
    layer.style.setProperty('--ui-coordinate-size', `${100 / UI_SCALE}%`);
    layer.dataset.uiScale = String(UI_SCALE);
}

export function screenToUi(value) {
    return Number(value) / UI_SCALE;
}

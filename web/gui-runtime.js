const FONT_SIZES = {
    cg_16b: 14,
    malgun_goth_24: 20,
};

const FONT_FAMILIES = {
    standard_font: '"Book Antiqua", Palatino, Georgia, serif',
    null_font: '"Book Antiqua", Palatino, Georgia, serif',
    large_title_font: 'Orbitron, "Noto Sans", Arial, sans-serif',
    large_title_font_28: 'Orbitron, "Noto Sans", Arial, sans-serif',
    cg_16b: '"Century Gothic", "Noto Sans", Arial, sans-serif',
    hoi_16mbs: 'Ubuntu, "Noto Sans", Arial, sans-serif',
    jura: 'Jura, "Noto Sans", Arial, sans-serif',
    malgun_goth_24: '"Malgun Gothic", "Noto Sans", Arial, sans-serif',
    map_name_border: 'Orbitron, "Noto Sans", Arial, sans-serif',
    map_name_nebula: 'Orbitron, "Noto Sans", Arial, sans-serif',
    map_name_sector: 'Orbitron, "Noto Sans", Arial, sans-serif',
};

const FONT_WEIGHTS = {
    cg_16b: 700,
    hoi_16mbs: 700,
};

const TYPE_CLASSES = {
    containerwindowtype: 'cw-container',
    windowtype: 'cw-container',
    background: 'cw-background',
    icontype: 'cw-icon',
    buttontype: 'cw-button',
    effectbuttontype: 'cw-button',
    guibuttontype: 'cw-button',
    increasebutton: 'cw-button cw-scrollbar-increase',
    decreasebutton: 'cw-button cw-scrollbar-decrease',
    instanttextboxtype: 'cw-text',
    textboxtype: 'cw-text',
    gridboxtype: 'cw-grid',
    smoothlistboxtype: 'cw-list',
    listboxtype: 'cw-list',
    checkboxtype: 'cw-checkbox',
    overlappingelementsboxtype: 'cw-overlap-list',
    scrollbartype: 'cw-scrollbar',
    extendedscrollbartype: 'cw-scrollbar',
    editboxtype: 'cw-edit',
    progressbartype: 'cw-progress',
    dropdownboxtype: 'cw-dropdown',
    spinnertype: 'cw-spinner',
    expandbutton: 'cw-button cw-expand-button',
    expandedwindow: 'cw-container cw-expanded-window',
    positiontype: 'cw-position',
    overlay: 'cw-overlay',
    slider: 'cw-slider',
    track: 'cw-track',
};

const BUTTON_NODE_TYPES = new Set([
    'buttontype', 'checkboxtype', 'effectbuttontype', 'guibuttontype',
    'expandbutton', 'increasebutton', 'decreasebutton',
]);

function px(value) {
    return `${Number(value) || 0}px`;
}

function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function guiLength(value, position = 0, startInset = 0, endInset = 0) {
    const totalInset = number(startInset) + number(endInset);
    if (typeof value === 'string') {
        const normalized = value.trim();
        const relativeRemaining = normalized.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))%%$/);
        if (relativeRemaining) {
            const inset = totalInset * number(relativeRemaining[1]) / 100;
            const deductions = [number(position), inset].filter(Boolean).map(value => `(${value}px)`);
            return deductions.length ? `calc(${relativeRemaining[1]}% - ${deductions.join(' - ')})` : `${relativeRemaining[1]}%`;
        }
        const relative = normalized.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))%$/);
        if (relative) {
            const inset = totalInset * number(relative[1]) / 100;
            return inset ? `calc(${relative[1]}% - ${inset}px)` : `${relative[1]}%`;
        }
    }
    const absolute = number(value);
    if (absolute < 0) {
        const deductions = [number(position), totalInset, Math.abs(absolute)].filter(Boolean).map(value => `(${value}px)`);
        return `calc(100% - ${deductions.join(' - ')})`;
    }
    return `${absolute}px`;
}

export function guiPositionLength(value) {
    if (typeof value === 'string') {
        const normalized = value.trim();
        if (/^-?(?:\d+(?:\.\d*)?|\.\d+)%$/.test(normalized)) return normalized;
    }
    return `${number(value)}px`;
}

function pair(value = {}) {
    return {
        x: Number(value.x ?? value.width ?? 0),
        y: Number(value.y ?? value.height ?? 0),
    };
}

function rawPair(value = {}) {
    return {
        x: value.x ?? value.width ?? 0,
        y: value.y ?? value.height ?? 0,
    };
}

function contentInsets(props = {}) {
    const border = pair(props.bordersize);
    const margin = props.margin && typeof props.margin === 'object' ? props.margin : {};
    return {
        left: border.x + number(margin.left),
        right: border.x + number(margin.right),
        top: border.y + number(margin.top),
        bottom: border.y + number(margin.bottom),
    };
}

function insetAtAnchor(start, end, anchorPercent) {
    if (anchorPercent === 100) return -end;
    if (anchorPercent === 50) return (start - end) / 2;
    return start;
}

function anchoredPosition(anchorPercent, position, inset) {
    const insetTerm = inset ? ` + ${inset}px` : '';
    return `calc(${anchorPercent}% + ${guiPositionLength(position)}${insetTerm})`;
}

function anchor(value = 'upper_left') {
    const normalized = String(value).toLowerCase();
    const x = normalized.includes('right') ? 100 : normalized.includes('center') || normalized === 'center' ? 50 : 0;
    const y = normalized.includes('lower') ? 100 : normalized === 'center' || normalized.startsWith('center_') ? 50 : 0;
    return { x, y };
}

export function guiTransform(props = {}) {
    const transforms = [];
    const selfAnchor = anchor(props.origo);
    const centered = props.centerposition === true;
    const translateX = centered ? 50 : selfAnchor.x;
    const translateY = centered ? 50 : selfAnchor.y;
    if (translateX || translateY) transforms.push(`translate(${-translateX}%, ${-translateY}%)`);
    const scale = number(props.scale, 1);
    if (scale !== 1) transforms.push(`scale(${scale})`);
    if (props.mirror === true) transforms.push('scaleX(-1)');
    const rotation = number(props.rotation);
    if (rotation) transforms.push(`rotate(${rotation}rad)`);
    return transforms.join(' ');
}

function resolutionPair(value, fallbackWidth, fallbackHeight) {
    if (typeof value === 'number') return { width: value, height: fallbackHeight };
    return {
        width: number(value?.width ?? value?.x, fallbackWidth),
        height: number(value?.height ?? value?.y, fallbackHeight),
    };
}

export function matchesGuiCondition(condition, resolution, scaledResolution = resolution) {
    const props = condition.props || condition;
    const target = String(condition.type || condition.kind || '').toLowerCase() === 'if_scaled_resolution'
        ? scaledResolution
        : resolution;
    const limits = {
        min_width: props.min_width ?? condition.minWidth,
        max_width: props.max_width ?? condition.maxWidth,
        min_height: props.min_height ?? condition.minHeight,
        max_height: props.max_height ?? condition.maxHeight,
    };
    const checks = [
        ['min_width', target.width >= number(limits.min_width)],
        ['max_width', target.width <= number(limits.max_width)],
        ['min_height', target.height >= number(limits.min_height)],
        ['max_height', target.height <= number(limits.max_height)],
    ];
    return checks.every(([key, matches]) => limits[key] == null || matches);
}

function resolveConditionalNode(node, context) {
    if (!node.conditions?.length) return node;
    const props = { ...node.props };
    const children = [...node.children];
    let insertedChildren = 0;
    for (const condition of node.conditions) {
        if (!matchesGuiCondition(condition, context.resolution, context.scaledResolution)) continue;
        const overrides = condition.props || {};
        for (const [key, value] of Object.entries(overrides)) {
            if (!['min_width', 'max_width', 'min_height', 'max_height'].includes(key)) props[key] = value;
        }
        let conditionChildren = condition.children || [];
        if (condition.conditions?.length) {
            const nested = resolveConditionalNode({
                ...node,
                props: {},
                children: [...conditionChildren],
                conditions: condition.conditions,
            }, context);
            Object.assign(props, nested.props);
            conditionChildren = nested.children;
        }
        if (conditionChildren.length) {
            const baseIndex = number(condition.childIndex, children.length);
            const index = Math.max(0, Math.min(children.length, baseIndex + insertedChildren));
            children.splice(index, 0, ...conditionChildren);
            insertedChildren += conditionChildren.length;
        }
    }
    return { ...node, props, children };
}

function applyGeometry(element, node, isRoot, applyRootPosition = true, parentNode = null) {
    const props = node.props;
    const position = pair(props.position);
    const rawPosition = rawPair(props.position);
    const size = rawPair(props.size);
    const parentInsets = contentInsets(parentNode?.props);
    if (isRoot) {
        element.style.position = 'relative';
        if (applyRootPosition) {
            const parentAnchor = anchor(props.orientation);
            element.style.left = anchoredPosition(parentAnchor.x, rawPosition.x, insetAtAnchor(parentInsets.left, parentInsets.right, parentAnchor.x));
            element.style.top = anchoredPosition(parentAnchor.y, rawPosition.y, insetAtAnchor(parentInsets.top, parentInsets.bottom, parentAnchor.y));
        }
    } else if (node.type === 'background' && !props.position && !props.size) {
        element.style.inset = '0';
    } else {
        const parentAnchor = anchor(props.orientation);
        element.style.left = anchoredPosition(parentAnchor.x, rawPosition.x, insetAtAnchor(parentInsets.left, parentInsets.right, parentAnchor.x));
        element.style.top = anchoredPosition(parentAnchor.y, rawPosition.y, insetAtAnchor(parentInsets.top, parentInsets.bottom, parentAnchor.y));
    }
    const transformProps = isRoot && !applyRootPosition
        ? { ...props, origo: 'upper_left', centerposition: false }
        : props;
    element.style.transform = guiTransform(transformProps);
    if (props.rotation != null || props.scale != null) element.style.transformOrigin = props.centerposition === true ? 'center' : 'top left';
    if (props.size) {
        element.style.width = guiLength(size.x, position.x, parentInsets.left, parentInsets.right);
        element.style.height = guiLength(size.y, position.y, parentInsets.top, parentInsets.bottom);
    } else if (node.type === 'background') {
        // Clausewitz backgrounds inherit the owning container's render size.
        // borderSize on a corneredTileSprite is a nine-slice inset, not the
        // sprite element's width/height. A positioned background still keeps
        // the full parent size; position only offsets that inherited box.
        element.style.width = '100%';
        element.style.height = '100%';
    }
    if (['gridboxtype', 'smoothlistboxtype', 'listboxtype', 'overlappingelementsboxtype'].includes(parentNode?.type)) {
        element.style.left = 'auto';
        element.style.top = 'auto';
        element.style.right = 'auto';
        element.style.transform = 'none';
    }
    if (props.clipping === true) element.style.overflow = 'hidden';
}

function spriteFrame(resource, node) {
    const explicit = Number(node.props.frame || 0);
    if (explicit) return explicit - 1;
    return Math.max(0, Number(resource?.defaultFrame || 1) - 1);
}

function webTexturePath(texture) {
    return String(texture).replace(/\\/g, '/').replace(/\.(?:dds|tga)$/i, '.webp');
}

const croppedFrameCache = new Map();

function croppedFrameUrls(url, dimensions, frames) {
    if (frames <= 1 || !dimensions || typeof Image === 'undefined') return null;
    const absoluteUrl = typeof globalThis.document?.baseURI === 'string'
        ? new URL(url, globalThis.document.baseURI).href
        : url;
    const cacheKey = `${absoluteUrl}|${dimensions.width}x${dimensions.height}|${frames}`;
    if (croppedFrameCache.has(cacheKey)) return croppedFrameCache.get(cacheKey);
    const promise = new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const frameWidth = dimensions.width / frames;
            canvas.width = frameWidth;
            canvas.height = dimensions.height;
            const context = canvas.getContext?.('2d');
            if (!context) {
                resolve(null);
                return;
            }
            const urls = [];
            for (let frame = 0; frame < frames; frame += 1) {
                context.clearRect(0, 0, frameWidth, dimensions.height);
                context.drawImage(image, frame * frameWidth, 0, frameWidth, dimensions.height, 0, 0, frameWidth, dimensions.height);
                urls.push(canvas.toDataURL('image/png'));
            }
            resolve(urls);
        };
        image.onerror = () => resolve(null);
        image.src = absoluteUrl;
    });
    croppedFrameCache.set(cacheKey, promise);
    return promise;
}

function applyCorneredSprite(element, node, resource, url, dimensions, frames, frame) {
    const border = pair(resource.border);
    element.style.backgroundImage = 'none';
    element.style.borderStyle = 'solid';
    element.style.borderColor = 'transparent';
    element.style.borderWidth = `${border.y}px ${border.x}px`;

    const applyFrame = source => {
        element.style.borderImage = `url("${source}") ${border.y} ${border.x} fill`;
    };
    const cropped = croppedFrameUrls(url, dimensions, frames);
    if (!cropped) {
        applyFrame(url);
        return;
    }
    cropped.then(urls => {
        if (!urls) {
            applyFrame(url);
            return;
        }
        let currentFrame = Math.max(0, Math.min(frames - 1, frame));
        const show = nextFrame => {
            currentFrame = Math.max(0, Math.min(frames - 1, nextFrame));
            applyFrame(urls[currentFrame]);
            element.dataset.spriteFrame = String(currentFrame);
        };
        show(currentFrame);
        if (frames === 3 && BUTTON_NODE_TYPES.has(node.type)) {
            element.addEventListener('pointerenter', () => show(1));
            element.addEventListener('pointerleave', () => show(0));
            element.addEventListener('pointerdown', () => show(2));
            element.addEventListener('pointerup', () => show(1));
        }
    });
}

function applySprite(element, node, resource, baseUrl) {
    if (!resource?.texture) return;
    const isProgress = resource.type === 'progressbartype' && resource.textures?.length > 1;
    const displayTexture = isProgress ? resource.textures[1] : resource.texture;
    const url = `${baseUrl}${displayTexture}`;
    const frames = Math.max(1, Number(resource.frames || 1));
    const frame = spriteFrame(resource, node);
    element.style.setProperty('--cw-image', `url("${url}")`);
    element.style.setProperty('--cw-frames', String(frames));
    element.style.setProperty('--cw-frame', String(frame));
    element.style.backgroundImage = `url("${url}")`;
    element.style.backgroundRepeat = 'no-repeat';
    if (frames > 1) {
        element.style.backgroundSize = `${frames * 100}% 100%`;
        element.style.backgroundPosition = `${frames === 1 ? 0 : (frame / (frames - 1)) * 100}% 0`;
    } else {
        element.style.backgroundSize = '100% 100%';
    }

    const declaredSize = resource.type === 'progressbartype' && resource.properties?.size;
    const dimensions = declaredSize
        ? { width: pair(declaredSize).x, height: pair(declaredSize).y }
        : resource.dimensions;
    if (node.type === 'background' && resource.type === 'spritetype' && frames === 1 && dimensions) {
        // One-pixel line sprites keep their natural dimensions instead of
        // inheriting the generic background stretch above.
        if (dimensions.width === 1 || dimensions.height === 1) element.style.backgroundSize = '';
    }
    if (!node.props.size && node.type !== 'background' && dimensions) {
        element.style.width = px(dimensions.width / frames);
        element.style.height = px(dimensions.height);
    }

    if (resource.type === 'corneredtilespritetype' && resource.border) {
        applyCorneredSprite(element, node, resource, url, dimensions, frames, frame);
    }
    if (resource.maskingTexture) {
        const mask = `url("${baseUrl}${resource.maskingTexture}")`;
        element.style.maskImage = mask;
        element.style.webkitMaskImage = mask;
        element.style.maskSize = '100% 100%';
        element.style.webkitMaskSize = '100% 100%';
        element.style.maskRepeat = 'no-repeat';
        element.style.webkitMaskRepeat = 'no-repeat';
    }
    if (resource.alwaysTransparent === true) element.style.pointerEvents = 'none';
    if (resource.type === 'frameanimatedspritetype' && resource.fps && frames > 1 && resource.playOnShow !== false) {
        const duration = frames / Math.max(0.01, number(resource.fps, 1));
        const iteration = resource.looping === false ? '1 forwards' : 'infinite';
        element.style.animation = `cw-frame-animation ${duration}s steps(${Math.max(1, frames - 1)}, end) ${iteration}`;
    }
    if (node.props.alpha != null) element.style.opacity = String(number(node.props.alpha, 1));
    if (frames === 3 && BUTTON_NODE_TYPES.has(node.type)) element.classList.add('cw-three-state');
}

function textValue(node, localize) {
    const value = node.props.text ?? node.props.buttontext ?? '';
    if (!value) return '—';
    const text = localize?.(String(value)) ?? String(value);
    const append = node.props.appendtext;
    return append == null ? text : `${text}${localize?.(String(append)) ?? String(append)}`;
}

function applyFont(element, fontName) {
    const name = String(fontName || '').toLowerCase();
    const family = FONT_FAMILIES[name];
    if (family) element.style.fontFamily = family;
    const weight = FONT_WEIGHTS[name];
    if (weight) element.style.fontWeight = String(weight);
}

function applyTextColor(element, colorCode, textColors = {}) {
    const color = textColors[String(colorCode ?? '')];
    if (!color) return;
    const { red, green, blue, alpha = 255 } = color;
    element.style.color = alpha >= 255
        ? `rgb(${red}, ${green}, ${blue})`
        : `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

function applyText(element, node, localize, textColors) {
    const props = node.props;
    element.dataset.guiText = String(props.text ?? props.buttontext ?? '');
    if (props.appendtext != null) element.dataset.guiAppendText = String(props.appendtext);
    element.textContent = textValue(node, localize);
    const fontSize = FONT_SIZES[String(props.buttonfont || props.font || '').toLowerCase()] || 14;
    element.style.fontSize = px(fontSize);
    applyFont(element, props.buttonfont || props.font);
    // element.style.lineHeight = px(Number(props.maxheight) || fontSize + 4);
    if (props.maxwidth != null && !props.size) element.style.width = px(props.maxwidth);
    if (props.maxheight != null && !props.size) element.style.height = px(props.maxheight);
    if (props.bordersize && typeof props.bordersize === 'object') {
        const border = pair(props.bordersize);
        element.style.padding = `${px(border.y)} ${px(border.x)}`;
    }
    const defaultFormat = BUTTON_NODE_TYPES.has(node.type) ? 'center' : 'left';
    element.style.textAlign = String(props.format || defaultFormat).toLowerCase();
    const vertical = String(props.vertical_alignment || 'top').toLowerCase();
    if (vertical === 'center' || vertical === 'bottom') {
        element.style.display = 'flex';
        element.style.alignItems = vertical === 'center' ? 'center' : 'flex-end';
        if (element.style.textAlign === 'center') element.style.justifyContent = 'center';
        else if (element.style.textAlign === 'right') element.style.justifyContent = 'flex-end';
    }
    if (props.truncate !== false) {
        element.style.whiteSpace = 'nowrap';
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
    }
    if (props.fixedsize === false) {
        element.style.width = 'max-content';
        element.style.height = 'auto';
    }
    applyTextColor(element, props.text_color_code, textColors);

    const position = pair(props.position);
    if (String(props.format).toLowerCase() === 'right' && position.x < 0 && !props.orientation) {
        element.style.left = 'auto';
        element.style.right = px(-position.x);
        element.style.transform = 'none';
    }
}

function createProgressNode(element, node, resource = null, baseUrl = '') {
    const horizontal = node.props.horizontal !== false && resource?.properties?.horizontal !== false;
    const flipDirection = node.props.flipdirection === true || resource?.properties?.flipdirection === true;
    const fill = document.createElement('div');
    fill.className = 'cw-progress-fill';
    fill.dataset.guiProgressFill = 'true';
    fill.style.zIndex = '1';
    if (horizontal && resource?.textures?.[0]) applyProgressTexture(fill, `${baseUrl}${resource.textures[0]}`);
    if (!horizontal && resource?.textures?.[0]) {
        fill.style.background = 'transparent';
        const texture = document.createElement('div');
        texture.className = 'cw-progress-texture';
        applyProgressTexture(texture, `${baseUrl}${resource.textures[0]}`, resource, true);
        fill.appendChild(texture);
    }
    element.appendChild(fill);
    if (!horizontal && resource?.textures?.[1]) {
        element.style.backgroundImage = 'none';
        const empty = document.createElement('div');
        empty.className = 'cw-progress-texture cw-progress-empty';
        empty.style.zIndex = '0';
        applyProgressTexture(empty, `${baseUrl}${resource.textures[1]}`, resource, true);
        element.appendChild(empty);
    }
    element.dataset.guiProgressOrientation = horizontal ? 'horizontal' : 'vertical';
    element.dataset.guiProgressFlipDirection = String(flipDirection);
    element.setProgress = (value, max = 1) => {
        const maximum = Math.max(0, number(max, 1));
        const current = Math.max(0, number(value));
        const fraction = maximum ? Math.min(1, current / maximum) : 0;
        element.dataset.guiProgressValue = String(current);
        element.dataset.guiProgressMax = String(maximum);
        element.setAttribute('role', 'progressbar');
        element.setAttribute('aria-valuemin', '0');
        element.setAttribute('aria-valuemax', String(maximum));
        element.setAttribute('aria-valuenow', String(current));
        fill.style.width = '100%';
        fill.style.clipPath = horizontal
            ? flipDirection
                ? `inset(0 0 0 ${(1 - fraction) * 100}%)`
                : `inset(0 ${(1 - fraction) * 100}% 0 0)`
            : flipDirection
                ? `inset(0 0 ${(1 - fraction) * 100}% 0)`
                : `inset(${(1 - fraction) * 100}% 0 0 0)`;
    };
    element.setProgress(node.props.value ?? 0, node.props.maxvalue ?? node.props.max ?? 1);
}

function applyProgressTexture(element, url, resource = null, vertical = false) {
    element.style.backgroundImage = `url("${url}")`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = '100% 100%';
    if (!vertical) return;
    const output = pair(resource?.properties?.size);
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.width = px(output.y);
    element.style.height = px(output.x);
    element.style.transformOrigin = 'top left';
    element.style.transform = 'rotate(90deg) translateY(-100%)';
    element.style.pointerEvents = 'none';
}

function initializeDropdown(element) {
    const children = [...element.children];
    const toggle = children.find(child => child.dataset.guiType === 'expandbutton');
    const panel = children.find(child => child.dataset.guiType === 'expandedwindow');
    if (!toggle || !panel) return;
    element.setExpanded = expanded => {
        const isExpanded = Boolean(expanded);
        element.dataset.guiExpanded = String(isExpanded);
        toggle.setAttribute('aria-expanded', String(isExpanded));
        panel.hidden = !isExpanded;
        panel.style.display = isExpanded ? '' : 'none';
        const target = rawPair(isExpanded ? panel.__guiNode.props.show_position : panel.__guiNode.props.hide_position);
        if (isExpanded ? panel.__guiNode.props.show_position : panel.__guiNode.props.hide_position) {
            panel.style.left = guiPositionLength(target.x);
            panel.style.top = guiPositionLength(target.y);
        }
    };
    toggle.addEventListener?.('click', () => element.setExpanded(element.dataset.guiExpanded !== 'true'));
    element.setExpanded(false);
}

function initializeRangeControl(element, node) {
    const props = node.props;
    const minimum = number(props.minvalue, 0);
    const maximum = Math.max(minimum, number(props.maxvalue, 100));
    const step = Math.max(0.000001, number(props.stepsize, 1));
    const children = [...element.children];
    const findButton = name => children.find(child => child.dataset.guiName === name);
    const slider = findButton(props.slider) || children.find(child => child.dataset.guiType === 'slider');
    const horizontal = props.horizontal === true || props.horizontal === 1;
    const sliderBasePosition = slider ? (horizontal ? slider.style.left : slider.style.top) || '0px' : '0px';
    element.setValue = value => {
        const next = Math.min(maximum, Math.max(minimum, number(value, minimum)));
        const fraction = maximum === minimum ? 0 : (next - minimum) / (maximum - minimum);
        element.value = next;
        element.dataset.guiControlValue = String(next);
        element.setAttribute('aria-valuemin', String(minimum));
        element.setAttribute('aria-valuemax', String(maximum));
        element.setAttribute('aria-valuenow', String(next));
        if (slider) {
            const position = `calc(${sliderBasePosition} + ${fraction * 100}%)`;
            if (horizontal) slider.style.left = position;
            else slider.style.top = position;
        }
        return next;
    };
    const decrease = findButton(props.leftbutton)
        || children.find(child => child.dataset.guiType === 'decreasebutton');
    const increase = findButton(props.rightbutton)
        || children.find(child => child.dataset.guiType === 'increasebutton');
    decrease?.addEventListener?.('click', () => element.setValue(element.value - step));
    increase?.addEventListener?.('click', () => element.setValue(element.value + step));
    element.setValue(props.startvalue ?? minimum);
}

function initializeOverlappingElements(element, node) {
    const vertical = String(node.props.direction || 'horizontal').toLowerCase() === 'vertical';
    const spacing = number(node.props.spacing);
    element.style.display = 'flex';
    element.style.flexDirection = vertical ? 'column' : 'row';
    element.style.overflow = 'hidden';
    element.layoutOverlaps = () => {
        const children = [...element.children];
        const available = vertical ? element.clientHeight : element.clientWidth;
        const sizes = children.map(child => vertical ? child.offsetHeight : child.offsetWidth);
        const total = sizes.reduce((sum, size) => sum + size, 0) + spacing * Math.max(0, children.length - 1);
        const overlap = children.length > 1 && available > 0
            ? Math.max(0, (total - available) / (children.length - 1))
            : 0;
        children.forEach((child, index) => {
            const offset = index === 0 ? 0 : spacing - overlap;
            if (vertical) child.style.marginTop = `${offset}px`;
            else child.style.marginLeft = `${offset}px`;
            if (node.props.first_on_top === true) child.style.zIndex = String(children.length - index);
        });
    };
    globalThis.requestAnimationFrame?.(() => element.layoutOverlaps());
    if (globalThis.ResizeObserver) {
        const observer = new ResizeObserver(() => element.layoutOverlaps());
        observer.observe(element);
    }
}

function createNode(node, context, isRoot = false, parentNode = null) {
    node = resolveConditionalNode(node, context);
    const isButton = BUTTON_NODE_TYPES.has(node.type);
    const isEdit = node.type === 'editboxtype';
    const tag = isEdit ? node.props.allow_multi_line === true ? 'textarea' : 'input' : isButton ? 'button' : 'div';
    const element = document.createElement(tag);
    if (isButton) element.type = 'button';
    element.className = `cw-node ${TYPE_CLASSES[node.type] || 'cw-unknown'}`;
    element.dataset.guiName = node.name;
    element.dataset.guiPath = node.path;
    element.dataset.guiType = node.type;
    element.__guiNode = node;
    if (node.props.alwaystransparent === true) element.style.pointerEvents = 'none';
    if (isEdit) {
        element.value = String(node.props.text ?? '');
        if (node.props.max_characters != null) element.maxLength = number(node.props.max_characters);
        element.spellcheck = false;
        element.setAttribute('aria-label', node.name);
        const fontSize = FONT_SIZES[String(node.props.font || '').toLowerCase()] || 14;
        element.style.fontSize = px(fontSize);
        element.style.lineHeight = px(fontSize + 4);
        applyFont(element, node.props.font);
        applyTextColor(element, node.props.text_color_code, context.definition.textColors);
    }
    applyGeometry(element, node, isRoot, context.applyRootPosition, parentNode);

    const tooltip = [node.props.pdx_tooltip, node.props.pdx_tooltip_delayed]
        .filter(value => value != null)
        .map(value => context.localize?.(String(value)) ?? String(value));
    if (tooltip.length) {
        element.title = tooltip.join('\n');
        element.setAttribute('title', element.title);
    }

    const spriteName = node.props.spritetype
        || node.props.quadtexturesprite
        || (typeof node.props.background === 'string' ? node.props.background : null);
    let resource = null;
    if (typeof spriteName === 'string' && context.definition.resources[spriteName]) {
        element.dataset.guiSprite = spriteName;
        resource = context.definition.resources[spriteName];
        applySprite(element, node, resource, context.baseUrl);
        if (node.type === 'background' && !node.props.size && !parentNode?.props?.size && resource?.dimensions) {
            const frames = Math.max(1, Number(resource.frames || 1));
            element.style.width = px(resource.dimensions.width / frames);
            element.style.height = px(resource.dimensions.height);
            element.dataset.guiNaturalSize = 'true';
        }
        if (resource && !resource.texture) {
            element.classList.add('cw-runtime-placeholder');
            element.dataset.guiRuntimeResource = resource.type;
        }
    }
    if (!spriteName && typeof node.props.texturefile === 'string' && node.props.texturefile) {
        const texture = webTexturePath(node.props.texturefile);
        element.dataset.guiTexture = texture;
        element.style.backgroundImage = `url("${context.baseUrl}${texture}")`;
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundSize = '100% 100%';
    }
    if (node.type === 'instanttextboxtype' || node.type === 'textboxtype' || isButton && (node.props.text || node.props.buttontext)) {
        applyText(element, node, context.localize, context.definition.textColors);
    }
    if (node.type === 'gridboxtype') {
        const slot = pair(node.props.slotsize);
        const columns = Math.max(1, Number(node.props.max_slots_horizontal || 1));
        const rows = Math.max(1, Number(node.props.max_slots_vertical || 1));
        const horizontal = node.props.add_horizontal === true
            || node.props.add_horizontal == null && node.props.max_slots_horizontal != null;
        element.style.display = 'grid';
        element.style.gridAutoFlow = horizontal ? 'row' : 'column';
        if (horizontal) {
            element.style.gridTemplateColumns = `repeat(${columns}, ${px(slot.x)})`;
            element.style.gridAutoRows = px(slot.y);
        } else {
            element.style.gridTemplateRows = `repeat(${rows}, ${px(slot.y)})`;
            element.style.gridAutoColumns = px(slot.x);
        }
        const format = String(node.props.format || 'upper_left').toLowerCase();
        element.style.justifyContent = format.includes('right') ? 'end' : format.includes('centered') ? 'center' : 'start';
        element.style.alignContent = format.includes('down') || format.includes('lower') ? 'end' : 'start';
    }
    if (node.type === 'smoothlistboxtype' || node.type === 'listboxtype') {
        element.style.overflow = 'auto';
        element.style.display = 'flex';
        element.style.flexDirection = String(node.props.orientation || '').toLowerCase().includes('horizontal') ? 'row' : 'column';
        const spacing = number(node.props.spacing);
        if (spacing) element.style.gap = px(spacing);
    }
    if (node.type === 'scrollbartype' || node.type === 'extendedscrollbartype') {
        element.setAttribute('role', 'scrollbar');
        element.tabIndex = 0;
    }
    if (node.type === 'spinnertype') {
        element.setAttribute('role', 'spinbutton');
        element.tabIndex = 0;
    }
    if (node.type === 'progressbartype' || resource?.type === 'progressbartype') {
        createProgressNode(element, node, resource, context.baseUrl);
    }

    for (const child of node.children) element.appendChild(createNode(child, context, false, node));
    if (node.type === 'dropdownboxtype') initializeDropdown(element);
    if (node.type === 'spinnertype' || node.type === 'scrollbartype' || node.type === 'extendedscrollbartype') {
        initializeRangeControl(element, node);
    }
    if (node.type === 'overlappingelementsboxtype') initializeOverlappingElements(element, node);
    return element;
}

function installStyles() {
    if (document.getElementById('clausewitz-gui-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'clausewitz-gui-runtime-style';
    style.textContent = `
        @font-face { font-family:"Noto Sans"; src:url("/gfx/fonts/NotoSans-Regular.ttf") format("truetype"); font-style:normal; font-weight:400; font-display:swap; }
        @font-face { font-family:Orbitron; src:url("/gfx/fonts/Orbitron-Regular.ttf") format("truetype"); font-style:normal; font-weight:400; font-display:swap; }
        @font-face { font-family:Jura; src:url("/gfx/fonts/Jura-VariableFont_wght.ttf") format("truetype"); font-style:normal; font-weight:300 700; font-display:swap; }
        @font-face { font-family:"Malgun Gothic"; src:url("/gfx/fonts/malgun.ttf") format("truetype"); font-style:normal; font-weight:400; font-display:swap; }
        .cw-node { position:absolute; box-sizing:border-box; margin:0; padding:0; color:#d5e8e5; font-family:Arial,"Microsoft YaHei",sans-serif; }
        .cw-container, .cw-grid, .cw-list { background:transparent; }
        .cw-button { border:0; background-color:transparent; color:#d5e8e5; cursor:pointer; }
        .cw-three-state:hover { background-position:50% 0 !important; }
        .cw-three-state:active { background-position:100% 0 !important; }
        .cw-text { background:transparent; }
        .cw-edit { border:0; outline:0; resize:none; background:transparent; color:#d5e8e5; font:inherit; }
        .cw-progress { overflow:hidden; }
        .cw-progress-fill { position:absolute; inset:0; width:100%; background:var(--cw-progress-fill, rgba(112,190,174,.75)); pointer-events:none; }
        .cw-grid > .cw-node { position:relative; left:auto !important; top:auto !important; right:auto !important; transform:none !important; }
        .cw-list > .cw-node { position:relative; flex:none; }
        .cw-overlap-list > .cw-node { position:relative; flex:none; }
        .cw-runtime-placeholder { background:rgba(27,73,70,.18); outline:1px dashed rgba(112,190,174,.25); }
        @keyframes cw-frame-animation { from { background-position:0 0; } to { background-position:100% 0; } }
    `;
    document.head.appendChild(style);
}

export function mountGui(container, definition, options = {}) {
    installStyles();
    const rootNode = definition.templates[definition.rootName];
    const viewport = resolutionPair(options.resolution, globalThis.window?.innerWidth || 0, globalThis.window?.innerHeight || 0);
    const uiScale = Math.max(0.01, number(options.uiScale, 1));
    const context = {
        definition,
        baseUrl: options.baseUrl ?? import.meta.env.BASE_URL,
        localize: options.localize,
        resolution: viewport,
        scaledResolution: resolutionPair(options.scaledResolution, viewport.width * uiScale, viewport.height * uiScale),
        applyRootPosition: options.applyRootPosition !== false,
    };
    const root = createNode(rootNode, context, true);
    container.replaceChildren(root);

    function find(name, scope = root) {
        if (scope.dataset?.guiName === name) return scope;
        return [...scope.querySelectorAll('[data-gui-name]')].find(element => element.dataset.guiName === name) || null;
    }

    function findIn(scope, name, type = null) {
        return [...scope.querySelectorAll('[data-gui-name]')].find(element =>
            element.dataset.guiName === name && (!type || element.dataset.guiType === type),
        ) || null;
    }

    function findAll(name, scope = root, type = null) {
        const matches = [];
        if (scope.dataset?.guiName === name && (!type || scope.dataset.guiType === type)) matches.push(scope);
        for (const element of scope.querySelectorAll('[data-gui-name]')) {
            if (element.dataset.guiName === name && (!type || element.dataset.guiType === type)) matches.push(element);
        }
        return matches;
    }

    function instantiate(templateName, parent, overrides = {}) {
        const template = definition.templates[templateName];
        if (!template) throw new Error(`Unknown GUI template: ${templateName}`);
        const instance = createNode(template, context, false, parent.__guiNode || null);
        if (overrides.name) instance.dataset.guiInstance = overrides.name;
        parent.appendChild(instance);
        parent.layoutOverlaps?.();
        return instance;
    }

    function localizeAll(localize = context.localize) {
        for (const element of root.querySelectorAll('[data-gui-text]')) {
            const key = element.dataset.guiText;
            const text = key ? localize?.(key) ?? key : '—';
            const appendKey = element.dataset.guiAppendText;
            element.textContent = appendKey ? `${text}${localize?.(appendKey) ?? appendKey}` : text;
        }
    }

    function setProgress(name, value, max = 1, scope = root) {
        const element = find(name, scope);
        if (!element?.setProgress) return false;
        element.setProgress(value, max);
        return true;
    }

    function setDropdownExpanded(name, expanded, scope = root) {
        const element = findIn(scope, name, 'dropdownboxtype');
        if (!element?.setExpanded) return false;
        element.setExpanded(expanded);
        return true;
    }

    function setControlValue(name, value, scope = root) {
        const element = find(name, scope);
        if (!element?.setValue) return false;
        element.setValue(value);
        return true;
    }

    return {
        root, find, findIn, findAll, instantiate, localizeAll,
        setProgress, setDropdownExpanded, setControlValue, definition,
    };
}

import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GAMESTATE = resolve('../example/gamestate');
const SCREENSHOTS = resolve('../.omx/state/planet-e2e/screenshots');

test('uploads a real save and opens fleet and planet views from the outliner', async ({ page }) => {
    const localizationRequests = [];
    page.on('request', request => {
        if (request.url().includes('/@stellaris-localization/')) localizationRequests.push(request.url());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Stellaris Save Viewer' })).toBeVisible();
    expect(localizationRequests).toEqual([]);

    await page.locator('#file-input').setInputFiles(GAMESTATE);
    await expect(page.locator('#app')).toBeVisible({ timeout: 120_000 });
    expect(localizationRequests).toHaveLength(1);
    expect(localizationRequests[0]).toContain('/@stellaris-localization/en');

    const generatedMainGui = page.locator('#resource-bar > [data-gui-name="maingui"]');
    await expect(generatedMainGui).toBeVisible();
    await expect(generatedMainGui.locator('[data-gui-name="tb_biomass_group"]')).toHaveCount(0);
    for (const divider of [
        'basic_resources_divider',
        'advanced_resources_divider',
        'intangible_resources_divider',
    ]) {
        await expect(generatedMainGui.locator(
            `[data-gui-name="${divider}"] > [data-gui-name="green_vertical_delimiters"]`,
        )).toHaveCSS('background-size', 'auto');
    }
    const researchGroup = generatedMainGui.locator('[data-gui-name="tb_research_group"]');
    await researchGroup.click();
    await expect(researchGroup).toHaveAttribute('aria-expanded', 'true');
    await expect(researchGroup.locator('[data-gui-name="single_resource_entry"]')).toHaveCount(3);
    await page.locator('#main-canvas').click({ position: { x: 640, y: 360 } });
    await expect(researchGroup).toHaveAttribute('aria-expanded', 'false');

    const fleet = page.locator('[data-overview-kind="fleet"]').first();
    await expect(fleet).toBeVisible();
    await fleet.click({ timeout: 10_000 });
    await expect(page.locator('#fleet-window')).toBeVisible();

    await page.keyboard.press('Escape');
    const languageToggle = page.locator('#language-toggle');
    await languageToggle.click();
    await expect(languageToggle).toBeDisabled();
    await expect.poll(() => localizationRequests.length).toBe(2);
    await expect(languageToggle).toBeEnabled();
    await expect(languageToggle).toHaveText('English');

    const planet = page.locator('[data-overview-kind="planet"]').first();
    await expect(planet).toBeVisible();
    await planet.click({ timeout: 10_000 });
    await expect(page.locator('#planet-window')).toBeVisible();

    mkdirSync(SCREENSHOTS, { recursive: true });
    for (const [index, tab] of ['summary', 'management', 'population', 'armies', 'corporate'].entries()) {
        const control = page.locator(`[data-planet-tab="${tab}"]`);
        await expect(control).toBeVisible();
        await control.click();
        await expect(page.locator(`[data-planet-page="${tab}"]`)).toBeVisible();
        await expect(control).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#planet-window')).toBeVisible({ timeout: 5_000 });
        if (tab === 'management') {
            await expect(page.locator('[data-planet-feature]')).toHaveCount(10);
            await expect(page.locator('[data-planet-species]')).toHaveCount(2);
        }
        if (tab === 'population') {
            await expect(page.locator('[data-planet-job]')).toHaveCount(15);
            await expect(page.locator('[data-planet-job="politician"]')).toContainText('200');
            await expect(page.locator('[data-planet-job="farmer"]')).toContainText('1000');
        }
        if (tab === 'armies') {
            await expect(page.locator('[data-planet-army]')).toHaveCount(6);
            await expect(page.locator('[data-planet-army]').first()).toContainText('100%');
            await expect(page.locator('[data-planet-army]').first()).toContainText('35');
            await expect(page.locator('[data-recruitable-army="assault_army"]')).toContainText('90');
            await expect(page.locator('[data-recruitable-army="assault_army"]')).toContainText('100');
        }
        await page.screenshot({ path: resolve(SCREENSHOTS, `planet_${index + 1}_${tab}.png`) });
    }

    await page.locator('[data-planet-tab="summary"]').click();
    await expect(page.locator('[data-planet-district]')).not.toHaveCount(0);
    await expect(page.locator('[data-planet-district-cap]')).not.toHaveCount(0);
    await expect(page.locator('[data-planet-district] [data-gui-name="num_districts_text"]:visible').first())
        .toContainText(/\d+\/\d+/);
    await expect(page.locator('[data-planet-building-slot]')).not.toHaveCount(0);
    await expect(page.locator('[data-planet-building-slot="filled"]')).not.toHaveCount(0);
    await expect(page.locator('[data-gui-name="planetary_production_output_amount"] [data-resource-key="energy"] img')).toBeVisible();
    await expect(page.locator('[data-gui-name="planetary_production_output_amount"] [data-resource-key="minerals"] img')).toBeVisible();
    await expect(page.locator('[data-gui-name="planetary_consumption_output_amount"] [data-resource-key="energy"] img')).toBeVisible();

    const cityDistrict = page.locator('[data-planet-district="district_city"]');
    await expect(cityDistrict).toHaveAttribute('data-planet-district-built', '3');
    await expect(cityDistrict).toHaveAttribute('data-planet-district-available', '14');
    await expect(cityDistrict).toHaveAttribute('data-planet-district-blocked', '1');
    await expect(cityDistrict.locator('[data-planet-district-slot="built"]')).toHaveCount(3);
    await expect(cityDistrict.locator('[data-planet-district-slot="available"]')).toHaveCount(14);
    await expect(cityDistrict.locator('[data-planet-district-slot="blocked"]')).toHaveCount(1);
    await expect(cityDistrict.locator('[data-planet-district-slot="built"] [data-sprite-frame="0"]')).toHaveCount(3);
    await expect(cityDistrict.locator('[data-planet-district-slot="available"] [data-sprite-frame="1"]')).toHaveCount(14);
    await expect(cityDistrict.locator('[data-planet-district-slot="blocked"] [data-sprite-frame="2"]')).toHaveCount(1);

    const beforeDrag = await page.locator('#planet-window').boundingBox();
    const dragHandle = page.locator('[data-planet-drag-handle]');
    const handleBox = await dragHandle.boundingBox();
    await page.mouse.move(handleBox.x + 500, handleBox.y + 35);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 540, handleBox.y + 50, { steps: 4 });
    await page.mouse.up();
    const afterDrag = await page.locator('#planet-window').boundingBox();
    expect(afterDrag.x).toBeGreaterThan(beforeDrag.x);
    expect(afterDrag.y).toBeGreaterThan(beforeDrag.y);

    await page.locator('[data-planet-close]').click();
    await expect(page.locator('#planet-window')).toBeHidden();

    const sparsePlanet = page.locator('[data-overview-kind="planet"][data-overview-id="209"]');
    await expect(sparsePlanet).toBeVisible();
    await sparsePlanet.click();
    await expect(page.locator('#planet-window')).toBeVisible();
    await expect(page.locator('[data-planet-district]')).toHaveCount(4);
    await expect(page.locator('[data-planet-district-built="0"]')).not.toHaveCount(0);
    await expect(page.locator('[data-planet-district-built="0"] [data-gui-name="num_districts_text"]').first()).toContainText(/^0\//);
    await page.screenshot({ path: resolve(SCREENSHOTS, 'planet_zero_districts.png') });
    await page.locator('[data-planet-close]').click();
    await expect(page.locator('#planet-window')).toBeHidden();
});

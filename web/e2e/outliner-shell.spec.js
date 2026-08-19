import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GAMESTATE = resolve('../example/gamestate');
const SCREENSHOTS = resolve('../.omx/state/outliner-shell/screenshots');

test('mounts the complete outliner shell at its native coordinates', async ({ page }) => {
    await page.goto('/');
    await page.locator('#file-input').setInputFiles(GAMESTATE);
    await expect(page.locator('#app')).toBeVisible({ timeout: 120_000 });

    const host = page.locator('#overview-panel');
    const tabs = host.locator('[data-gui-name="tabs_outliner_window"]');
    const outliner = host.locator(':scope > [data-gui-name="outliner_tab_window"]');
    const controller = host.locator('[data-gui-name="outliner_controller_window"]');
    const list = outliner.locator(':scope > [data-gui-name="list"]');

    await expect(tabs).toBeVisible();
    await expect(controller).toBeVisible();
    await expect(tabs.locator('[data-gui-instance^="outliner-tab-"]')).toHaveCount(4);
    await expect(tabs).toHaveCSS('width', '260px');
    await expect(outliner).toHaveCSS('width', '260px');
    await expect(outliner).toHaveCSS('height', '499px');
    await expect(list).toHaveCSS('width', '240px');
    await expect(list).toHaveCSS('height', '459px');

    const tabsBox = await tabs.boundingBox();
    const outlinerBox = await outliner.boundingBox();
    const controllerBox = await controller.boundingBox();
    expect(tabsBox).toMatchObject({ x: 1020, y: 159 });
    expect(outlinerBox).toMatchObject({ x: 1020, y: 186 });
    expect(controllerBox).toMatchObject({ x: 1020, y: 150 });
    await expect(outliner.locator('[data-gui-name="tab_name"]')).toHaveText('Overview');
    await expect(host.locator('.generated-overview-close')).toHaveCount(0);
    const sectors = outliner.locator('[data-gui-name="outliner_sector_title_entry_window"]');
    await expect(sectors.locator(':scope > [data-gui-name="amount"]')).toHaveText('1');
    const sectorRow = sectors.locator('[data-gui-name="outliner_member_sector_entry_window"]');
    await expect(sectorRow).toHaveCount(1);
    await expect(sectorRow.locator('[data-gui-name="name"]')).toHaveText('Earth');
    await expect(sectorRow.locator('[data-gui-name="colony_count"]')).toHaveText('4');
    await expect(sectors.locator('[data-gui-name="outliner_member_planet_entry_window"]')).toHaveCount(4);

    mkdirSync(SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: resolve(SCREENSHOTS, 'outliner-shell.png') });

    const options = host.locator('[data-gui-instance="outliner-options"]');
    const rearrange = host.locator('[data-gui-instance="outliner-rearrange"]');
    await outliner.locator('[data-gui-name="options"]').click();
    await expect(options).toBeVisible();
    await outliner.locator('[data-gui-name="rearrange"]').click();
    await expect(options).toBeHidden();
    await expect(rearrange).toBeVisible();

});

import { chromium } from '@playwright/test';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Click through to battle
  await page.click('text=Enter the cave');
  await page.waitForTimeout(500);
  await page.click('text=Continue forward');
  await page.waitForTimeout(500);
  await page.click('text=Fight the goblin');
  await page.waitForTimeout(1000);
  
  // Get the HTML of the progress elements
  const progressElements = await page.locator('[data-slot="progress"]').all();
  console.log('Found', progressElements.length, 'progress elements');
  
  for (const el of progressElements) {
    const html = await el.innerHTML();
    console.log('Progress HTML:', html.substring(0, 500));
    console.log('---');
  }
  
  // Get the page HTML around the player status
  const playerStatus = await page.locator('[aria-label="Player Status"]');
  const html = await playerStatus.innerHTML();
  console.log('Player Status HTML:', html);
  
  await browser.close();
}

inspect().catch(console.error);

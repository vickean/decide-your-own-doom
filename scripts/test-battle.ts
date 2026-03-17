import { chromium } from '@playwright/test';

async function testBattle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('[BROWSER]', msg.text());
  });
  
  console.log('Navigating...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Click through to battle
  await page.click('text=Enter the cave');
  await page.waitForTimeout(500);
  await page.click('text=Continue forward');
  await page.waitForTimeout(500);
  console.log('Clicking Fight...');
  await page.click('text=Fight the goblin');
  await page.waitForTimeout(2000);
  
  await browser.close();
}

testBattle().catch(console.error);

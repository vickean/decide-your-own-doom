import { chromium } from '@playwright/test';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewportSize({ width: 800, height: 600 });
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Click through to battle
  await page.click('text=Enter the cave');
  await page.waitForTimeout(300);
  await page.click('text=Continue forward');
  await page.waitForTimeout(300);
  await page.click('text=Fight the goblin');
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/battle-screen.png', fullPage: false });
  console.log('Screenshot saved to /tmp/battle-screen.png');
  
  // Get battle container dimensions and positions
  const battleCard = await page.locator('[aria-label="Battle Screen"]');
  const box = await battleCard.boundingBox();
  console.log('Battle Screen box:', box);
  
  // Check Enemy Status
  const enemyStatus = await page.locator('[aria-label="Enemy Status"]');
  const enemyBox = await enemyStatus.boundingBox();
  console.log('Enemy Status box:', enemyBox);
  
  // Check Player Status
  const playerStatus = await page.locator('[aria-label="Player Status"]');
  const playerBox = await playerStatus.boundingBox();
  console.log('Player Status box:', playerBox);
  
  // Check Control Bar
  const controlBar = await page.locator('[aria-label="Battle Controls"]');
  const controlBox = await controlBar.boundingBox();
  console.log('Control Bar box:', controlBox);
  
  // Check spacing between Player Status and Control Bar
  if (playerBox && controlBox) {
    const gap = playerBox.y + playerBox.height - controlBox.y;
    console.log('Gap between Player Status and Control Bar:', gap, 'px');
  }
  
  // Check message text
  const message = await page.locator('[aria-label="Battle Message"] p');
  const messageText = await message.textContent();
  console.log('Current message:', messageText);
  
  await browser.close();
}

inspect().catch(console.error);

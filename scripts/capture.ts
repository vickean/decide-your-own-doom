import { chromium } from 'playwright';
import * as path from 'path';

const screenshotName = process.argv[2] || 'screenshot';
const screenshotPath = `/tmp/${screenshotName}.png`;

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);
  
  await browser.close();
}

capture();

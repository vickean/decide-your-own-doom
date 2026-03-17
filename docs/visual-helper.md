# Visual Helper Agent

The `visual-helper` subagent is used to analyze and describe screenshots or UI elements when direct visual inspection isn't possible.

## How It Works

The visual-helper agent can:
1. View images from a file path
2. Analyze UI layouts and positioning
3. Describe visual elements and their relationships
4. Identify layout issues like overlaps, gaps, or alignment problems

## Usage

Use the Task tool with `subagent_type: visual-helper`:

```typescript
task({
  description: "Description of what to analyze",
  prompt: "Your question about the image",
  subagent_type: "visual-helper"
})
```

## Capturing Screenshots with Playwright

Before using the visual-helper, you'll need to capture a screenshot using Playwright.

### Basic Setup

First, ensure Playwright is installed:
```bash
npm install -D @playwright/test
```

### Capturing a Screenshot

Create a script to capture screenshots:

```typescript
// scripts/capture-screenshot.ts
import { chromium } from '@playwright/test';

async function captureScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to your app
  await page.goto('http://localhost:5173');
  
  // Interact with the page to get to the desired state
  await page.click('text=Enter the cave');
  await page.waitForTimeout(500);
  await page.click('text=Continue forward');
  await page.waitForTimeout(500);
  await page.click('text=Fight the goblin');
  await page.waitForTimeout(1000);
  
  // Capture screenshot
  await page.screenshot({ path: '/tmp/battle-screen.png' });
  
  await browser.close();
}

captureScreenshot();
```

Run it with:
```bash
npx tsx scripts/capture-screenshot.ts
```

### Capturing Specific Elements

To capture a specific element instead of the whole page:

```typescript
// Capture a specific element
const element = await page.locator('[aria-label="Battle Screen"]');
await element.screenshot({ path: '/tmp/battle.png' });
```

### Capturing After Specific Actions

```typescript
// Take multiple screenshots during a flow
await page.goto('http://localhost:5173');
await page.screenshot({ path: '/tmp/1-home.png' });

await page.click('text=Start');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/2-game.png' });

// Trigger battle
await page.click('text=Fight');
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/3-battle.png' });
```

## Using with Visual Helper

After capturing your screenshot, feed it to the visual-helper:

```typescript
task({
  description: "Analyze battle UI layout",
  prompt: `Look at the screenshot at /tmp/battle-screen.png and tell me:
1. Is there a visible gap between the Player Status box and the Control Bar?
2. Are they touching or overlapping?
3. What does the overall layout look like?`,
  subagent_type: "visual-helper"
})
```

## Example Workflow

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Create a capture script** (or use existing one in `scripts/`)

3. **Run the capture script**:
   ```bash
   npx tsx scripts/capture-screenshot.ts
   ```

4. **Analyze with visual-helper**:
   ```typescript
   task({
     description: "Check UI spacing",
     prompt: "View /tmp/battle-screen.png and describe the gap between the player stats box and the control bar.",
     subagent_type: "visual-helper"
   })
   ```

## Limitations

- Requires a valid image file path
- Cannot capture new screenshots directly (external tool required)
- Analysis depends on image quality and clarity
- Visual-helper may not be available in all environments

## Tips

- Save screenshots to `/tmp/` for easy access
- Use clear, focused screenshots of the area you want analyzed
- Be specific in your prompt about what to look for
- Take screenshots at the same viewport size for consistent analysis
- Use `page.setViewportSize()` to control dimensions

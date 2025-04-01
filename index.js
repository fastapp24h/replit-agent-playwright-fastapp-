import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send("Missing prompt");

  try {
    console.log("Avvio browser...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("Vado su Replit...");
    await page.goto("https://replit.com/~", { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("Attendo caricamento...");
    await page.waitForTimeout(5000);

    console.log("Cerco il bottone 'Start building'...");
    const startButton = await page.locator("button:has-text('Start building')").first();

    if (await startButton.count() > 0) {
      console.log("Clicco su 'Start building'...");
      await startButton.click();
    } else {
      console.log("Fallback: cerco 'Create App'...");
      const fallbackButton = await page.locator("button:has-text('Create App')").first();
      if (await fallbackButton.count() === 0) {
        throw new Error("Nessun bottone valido trovato ('Start building' o 'Create App')");
      }
      console.log("Clicco su 'Create App'...");
      await fallbackButton.click();
    }

    console.log("Attendo campo textarea...");
    await page.waitForSelector("textarea", { timeout: 20000 });

    console.log("Scrivo il prompt...");
    await page.type("textarea", prompt);
    await page.keyboard.press("Enter");

    console.log("Attendo la generazione della demo...");
    await page.waitForTimeout(30000);

    const finalUrl = page.url();
    console.log("Demo generata:", finalUrl);

    await browser.close();
    return res.json({ url: finalUrl });

  } catch (err) {
    console.error("Errore dettagliato:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});

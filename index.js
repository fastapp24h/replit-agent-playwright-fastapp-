import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send("Missing prompt");

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://replit.com/~", { waitUntil: "networkidle" });

    // Attendi che l'utente sia loggato o pagina sia pronta
    await page.waitForTimeout(5000);

    // Clic su "Create"
    const createButton = await page.locator("button:has-text('Create')");
    await createButton.click();

    // Attendi area prompt
    await page.waitForSelector("textarea", { timeout: 20000 });

    // Inserisci prompt
    await page.type("textarea", prompt);
    await page.keyboard.press("Enter");

    // Attesa generazione
    await page.waitForTimeout(30000);

    const finalUrl = page.url();

    await browser.close();
    return res.json({ url: finalUrl });

  } catch (err) {
    console.error("Errore:", err);
    return res.status(500).send("Errore nella generazione");
  }
});

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`);
});

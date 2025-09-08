const playwright = require("playwright-core");
const chromium = require("@sparticuz/chromium");

// This is the main function that handles incoming API requests.
// Vercel's serverless functions use this format to handle HTTP requests.
module.exports = async (req, res) => {
  let browser;

  // Extract the URL from the request body.
  const { url } = req.body;
  if (!url) {
    // If no URL is provided, return a 400 Bad Request error.
    console.error("Error: No URL provided in the request body.");
    return res
      .status(400)
      .json({ error: "URL is required in the request body." });
  }

  try {
    console.log("Starting scraper...");
    console.log(`Received URL: ${url}`);

    console.log("Attempting to launch browser...");
    // Launch a headless browser using the specialized Chromium binary.
    // This is crucial for running Playwright in a serverless environment like Vercel.
    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(), // <-- The fix is here
      headless: chromium.headless,
    });
    console.log("Browser launched successfully.");

    console.log("Creating a new page...");
    // Create a new browser context and a new page.
    const page = await browser.newPage();
    console.log("New page created.");

    console.log("Navigating to the provided URL...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log("Navigation successful.");

    console.log("Scraping page content...");
    // Scrape the desired content.
    // For this example, we'll extract the page title and all H1 tags.
    const pageTitle = await page.title();
    const headings = await page.$$eval("h1", (elements) => {
      return elements.map((el) => el.textContent.trim());
    });
    console.log("Scraping complete.");

    // Return the scraped data as a JSON response.
    res.status(200).json({
      url: page.url(),
      title: pageTitle,
      headings: headings,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scraping failed:", error);
    // If an error occurs, return a 500 Internal Server Error.
    res.status(500).json({ error: "Scraping failed." });
  } finally {
    // Always close the browser instance to free up resources.
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
      console.log("Browser closed.");
    }
  }
};

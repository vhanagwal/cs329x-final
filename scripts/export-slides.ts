import puppeteer from "puppeteer";
import * as path from "path";
import * as fs from "fs";

async function exportSlides() {
  const presentationPath = path.resolve(__dirname, "../presentation.html");
  const outputDir = path.resolve(__dirname, "../slides");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to match slide dimensions (16:9 aspect ratio)
  await page.setViewport({ width: 1280, height: 720 });

  console.log("📄 Loading presentation...");
  await page.goto(`file://${presentationPath}`, { waitUntil: "networkidle0" });

  // Get total number of slides
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll(".slide").length;
  });

  console.log(`📊 Found ${slideCount} slides`);

  // Capture each slide as a separate image
  for (let i = 0; i < slideCount; i++) {
    console.log(`📸 Capturing slide ${i + 1}/${slideCount}...`);

    // Move to the slide by transforming the container (slides are horizontal)
    await page.evaluate((index) => {
      const container = document.querySelector(".slide-container") as HTMLElement;
      if (container) {
        container.style.transform = `translateX(-${index * 100}vw)`;
      }
    }, i);

    // Wait for transition
    await new Promise((r) => setTimeout(r, 600));

    // Take screenshot and save as PNG
    const outputPath = path.join(outputDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await page.screenshot({
      path: outputPath,
      type: "png",
    });
  }

  await browser.close();

  console.log(`\n✅ Exported ${slideCount} slides to: ${outputDir}/`);
  console.log("Files:");
  for (let i = 1; i <= slideCount; i++) {
    console.log(`   slide-${String(i).padStart(2, "0")}.png`);
  }
}

exportSlides().catch(console.error);

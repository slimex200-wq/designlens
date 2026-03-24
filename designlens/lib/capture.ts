import type { ExtractedStyles, PageMetadata } from "./types";

function validateUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  const hostname = url.hostname;
  const blocked = [
    /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./, /^0\./, /^169\.254\./, /^\[::1\]$/, /^\[fc/, /^\[fd/,
  ];
  if (blocked.some((re) => re.test(hostname))) {
    throw new Error("Internal URLs are not allowed");
  }

  return url;
}

async function getBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = (await import("puppeteer-core")).default;
  const possiblePaths = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ];
  const fs = await import("fs");
  const executablePath = process.env.CHROME_PATH ?? possiblePaths.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("Chrome not found. Install Chrome or set CHROME_PATH.");

  return puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
}

export async function captureUrl(rawUrl: string): Promise<{
  screenshot: string;
  extractedStyles: ExtractedStyles;
  metadata: PageMetadata;
}> {
  const url = validateUrl(rawUrl);
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.goto(url.toString(), {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Wait for lazy-loaded content
    await new Promise((r) => setTimeout(r, 1000));

    // Screenshot
    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage: false,
    });
    const screenshot = Buffer.from(screenshotBuffer).toString("base64");

    // Extract styles via page.evaluate
    const extractedStyles = (await page.evaluate(() => {
      const colorMap = new Map<string, { count: number; properties: Set<string> }>();
      const fontMap = new Map<string, Set<number>>();
      const spacingMap = new Map<string, number>();
      const radiusMap = new Map<string, number>();

      const elements = document.querySelectorAll("body *");
      const sample = Array.from(elements).slice(0, 500);

      for (const el of sample) {
        const style = getComputedStyle(el);

        // Colors
        for (const prop of ["color", "background-color", "border-color"]) {
          const val = style.getPropertyValue(prop);
          if (val && val !== "rgba(0, 0, 0, 0)" && val !== "transparent") {
            const key = val;
            const entry = colorMap.get(key);
            if (entry) {
              entry.count++;
              entry.properties.add(prop);
            } else {
              colorMap.set(key, { count: 1, properties: new Set([prop]) });
            }
          }
        }

        // Fonts
        const family = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        const weight = parseInt(style.fontWeight) || 400;
        if (family) {
          const weights = fontMap.get(family);
          if (weights) {
            weights.add(weight);
          } else {
            fontMap.set(family, new Set([weight]));
          }
        }

        // Spacing
        for (const prop of ["padding-top", "padding-bottom", "margin-top", "margin-bottom", "gap"]) {
          const val = style.getPropertyValue(prop);
          if (val && val !== "0px" && val !== "normal" && val !== "auto") {
            spacingMap.set(val, (spacingMap.get(val) ?? 0) + 1);
          }
        }

        // Border radius
        const radius = style.borderRadius;
        if (radius && radius !== "0px") {
          radiusMap.set(radius, (radiusMap.get(radius) ?? 0) + 1);
        }
      }

      // CSS Variables from :root
      const cssVariables: Record<string, string> = {};
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
              for (let i = 0; i < rule.style.length; i++) {
                const name = rule.style[i];
                if (name.startsWith("--")) {
                  cssVariables[name] = rule.style.getPropertyValue(name).trim();
                }
              }
            }
          }
        } catch {
          /* cross-origin stylesheet */
        }
      }

      // Breakpoints from media queries
      const breakpoints = new Set<string>();
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSMediaRule) {
              const match = rule.conditionText.match(/\d+px/g);
              if (match) match.forEach((bp: string) => breakpoints.add(bp));
            }
          }
        } catch {
          /* cross-origin */
        }
      }

      return {
        colors: Array.from(colorMap.entries())
          .map(([value, { count, properties }]) => ({
            value,
            count,
            properties: Array.from(properties),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        fonts: Array.from(fontMap.entries())
          .map(([family, weights]) => ({
            family,
            weights: Array.from(weights).sort((a, b) => a - b),
            count: 0,
          }))
          .slice(0, 10),
        spacing: Array.from(spacingMap.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        borderRadius: Array.from(radiusMap.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        breakpoints: Array.from(breakpoints).sort(),
        cssVariables,
      };
    })) as ExtractedStyles;

    // Metadata
    const metadata = (await page.evaluate(() => ({
      title: document.title || "",
      description:
        document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      viewport:
        document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "",
      favicon:
        document.querySelector('link[rel*="icon"]')?.getAttribute("href") || "/favicon.ico",
    }))) as PageMetadata;

    // Resolve relative favicon URL
    if (metadata.favicon && !metadata.favicon.startsWith("http")) {
      metadata.favicon = new URL(metadata.favicon, url.origin).toString();
    }

    return { screenshot, extractedStyles, metadata };
  } finally {
    await browser.close();
  }
}

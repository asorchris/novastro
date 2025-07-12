import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import fs from 'fs';
import path from 'path';

// Configure Puppeteer with stealth plugins
puppeteer.use(StealthPlugin());
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

export interface ScrapedData {
  leaderboard: Array<{
    rank: number;
    username: string;
    score: number;
    additionalData?: Record<string, any>;
  }>;
  totalEntries: number;
  scrapedAt: Date;
  metadata?: Record<string, any>;
}

export class UndetectableScraper {
  private browser: Browser | null = null;
  private cookiesPath: string;
  private userDataDir: string;
  private profileName: string;

  constructor(
    cookiesPath: string = './cookies.json',
    userDataDir?: string,
    profileName: string = 'Default'
  ) {
    this.cookiesPath = cookiesPath;
    // Auto-detect user data directory based on OS
    this.userDataDir = userDataDir || this.getDefaultUserDataDir();
    this.profileName = profileName;
  }

  private getDefaultUserDataDir(): string {
    const os = process.platform;
    const homeDir = require('os').homedir();
    
    switch (os) {
      case 'darwin': // macOS
        return `${homeDir}/Library/Application Support/Google/Chrome`;
      case 'win32': // Windows
        return `${homeDir}\\AppData\\Local\\Google\\Chrome\\User Data`;
      case 'linux': // Linux
        return `${homeDir}/.config/google-chrome`;
      default:
        throw new Error(`Unsupported operating system: ${os}`);
    }
  }

  private getChromeExecutablePaths(): string[] {
    const os = process.platform;
    
    switch (os) {
      case 'darwin': // macOS
        return [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ];
      case 'win32': // Windows
        return [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          `${require('os').homedir()}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
        ];
      case 'linux': // Linux
        return [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
        ];
      default:
        return [];
    }
  }

  private getPuppeteerChromePath(): string | undefined {
    const os = process.platform;
    const homeDir = require('os').homedir();
    
    switch (os) {
      case 'darwin': // macOS
        if (process.arch === 'arm64') {
          const knownPath = `${homeDir}/.cache/puppeteer/chrome/mac_arm-138.0.7204.94/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
          if (fs.existsSync(knownPath)) {
            return knownPath;
          }
        } else {
          const knownPath = `${homeDir}/.cache/puppeteer/chrome/mac-138.0.7204.94/chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
          if (fs.existsSync(knownPath)) {
            return knownPath;
          }
        }
        break;
      case 'win32': // Windows
        // Windows Puppeteer path logic can be added here
        break;
      case 'linux': // Linux
        // Linux Puppeteer path logic can be added here
        break;
    }
    
    return undefined;
  }

  async initialize(): Promise<void> {
    try {
      // Check if we should use existing Chrome user data
      const useUserData = process.env.USE_CHROME_USER_DATA === 'true';
      
      if (useUserData) {
        console.log(`Using Chrome user data from: ${this.userDataDir}`);
        console.log(`Profile: ${this.profileName}`);
        
        // Try system Chrome executables with user data
        const chromeExecutables = this.getChromeExecutablePaths();
        
        for (const executablePath of chromeExecutables) {
          try {
            if (!fs.existsSync(executablePath)) {
              console.log(`Chrome not found at: ${executablePath}`);
              continue;
            }

            this.browser = await puppeteer.launch({
              headless: process.env.NODE_ENV === 'production' ? true : false,
              executablePath,
              userDataDir: this.userDataDir,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI,VizDisplayCompositor',
                '--disable-ipc-flooding-protection',
                '--force-color-profile=srgb',
                '--disable-background-networking',
                '--disable-default-apps',
                '--mute-audio',
                '--no-default-browser-check',
                '--autoplay-policy=user-gesture-required',
                '--disable-web-security',
                '--disable-sync',
                '--disable-translate',
                '--no-first-run',
                '--disable-infobars',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-popup-blocking',
                '--ignore-certificate-errors',
                '--disable-prompt-on-repost',
                '--disable-hang-monitor',
                '--remote-debugging-port=9222',
                `--profile-directory=${this.profileName}`,
              ],
              defaultViewport: {
                width: 1920,
                height: 1080,
              },
            });
            
            console.log(`✅ Chrome initialized with user data using: ${executablePath}`);
            return;
          } catch (chromeError) {
            console.warn(`Failed to launch Chrome with user data at ${executablePath}:`, chromeError);
            continue;
          }
        }
        
        console.log('❌ Could not launch any Chrome installation with user data');
      }

      // Fallback to Puppeteer Chrome
      console.log('🔄 Falling back to Puppeteer Chrome...');
      const puppeteerChrome = this.getPuppeteerChromePath();
      
      if (puppeteerChrome && fs.existsSync(puppeteerChrome)) {
        try {
          this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production' ? true : false,
            executablePath: puppeteerChrome,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-features=TranslateUI,VizDisplayCompositor',
              '--disable-ipc-flooding-protection',
              '--enable-features=NetworkService,NetworkServiceLogging',
              '--force-color-profile=srgb',
              '--disable-background-networking',
              '--disable-default-apps',
              '--mute-audio',
              '--no-default-browser-check',
              '--autoplay-policy=user-gesture-required',
              '--disable-web-security',
              '--disable-extensions',
              '--disable-plugins',
              '--disable-sync',
              '--disable-translate',
              '--hide-scrollbars',
              '--no-first-run',
              '--disable-infobars',
              '--disable-breakpad',
              '--disable-client-side-phishing-detection',
              '--disable-cast',
              '--disable-cast-streaming-hw-encoding',
              '--disable-cloud-import',
              '--disable-popup-blocking',
              '--ignore-certificate-errors',
              '--disable-prompt-on-repost',
              '--disable-hang-monitor',
            ],
            defaultViewport: {
              width: 1920,
              height: 1080,
            },
          });
          
          console.log(`✅ Puppeteer Chrome initialized: ${puppeteerChrome}`);
          return;
        } catch (puppeteerError) {
          console.warn('Failed to launch Puppeteer Chrome:', puppeteerError);
        }
      }

      // Final fallback - let Puppeteer auto-detect
      console.log('🔄 Final fallback: Auto-detecting Chrome...');
      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production' ? true : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });
      
      console.log('✅ Chrome auto-detected and initialized');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async loadCookies(): Promise<any[]> {
    try {
      if (fs.existsSync(this.cookiesPath)) {
        const cookieData = fs.readFileSync(this.cookiesPath, 'utf8');
        return JSON.parse(cookieData);
      }
    } catch (error) {
      console.error('Failed to load cookies:', error);
    }
    return [];
  }

  async createStealthPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport with some randomization
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    // Set extra headers to mimic real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    });

    // Load cookies
    const cookies = await this.loadCookies();
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
      console.log(`Loaded ${cookies.length} cookies`);
    }

    // Add more sophisticated anti-detection measures
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver traces
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock chrome object
      (window as any).chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
        loadTimes: () => ({}),
        csi: () => ({}),
        app: {},
      };

      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => Array.from({ length: 5 }, (_, i) => ({ name: `Plugin ${i}` })),
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Hide automation indicators
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4,
      });

      // Mock device memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // Mock screen properties
      Object.defineProperty(screen, 'width', {
        get: () => 1920,
      });
      Object.defineProperty(screen, 'height', {
        get: () => 1080,
      });
    });

    // Add mouse movement simulation
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.mouse.move(150, 150);

    return page;
  }

  async scrapeLeaderboard(url: string): Promise<ScrapedData> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.createStealthPage();

    try {
      console.log(`Navigating to: ${url}`);
      
      // Navigate with realistic timing
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for page to load completely
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Add console log listener to capture page console messages
      page.on('console', (msg) => {
        console.log('PAGE LOG:', msg.text());
      });

      // Get page title and URL for debugging
      const pageTitle = await page.title();
      const pageUrl = await page.url();
      console.log('Page title:', pageTitle);
      console.log('Page URL:', pageUrl);

      // Check if we're on a human verification page
      if (pageTitle.includes('Human Verification') || pageTitle.includes('Verification') || pageTitle.includes('Captcha')) {
        console.log('Detected human verification page. Attempting to bypass...');
        
        // Try to find and click any "I'm not a robot" checkboxes
        const checkboxes = await page.$$('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
          await checkbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Try to find and click any "Continue" or "Proceed" buttons
        const buttons = await page.$$('button, input[type="button"], input[type="submit"]');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
          if (text.includes('continue') || text.includes('proceed') || text.includes('verify') || text.includes('submit')) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        }
        
        // Wait for potential redirect
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if we're still on verification page
        const newTitle = await page.title();
        if (newTitle.includes('Human Verification')) {
          console.log('Still on verification page. Manual intervention may be required.');
          // Take a screenshot to see what's happening
          await page.screenshot({ path: 'verification-page.png', fullPage: true });
          console.log('Verification page screenshot saved as verification-page.png');
        }
      }

      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('Screenshot saved as debug-screenshot.png');

      // Add some random human-like actions
      await page.mouse.move(Math.random() * 1920, Math.random() * 1080);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Scroll randomly
      await page.evaluate(() => {
        window.scrollTo(0, Math.random() * 500);
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Try to find leaderboard data - this will need to be customized based on the actual page structure
      const leaderboardData = await page.evaluate(() => {
        const results: Array<{
          rank: number;
          username: string;
          score: number;
          additionalData?: Record<string, any>;
        }> = [];

        // Debug: log the page structure
        console.log('Page title:', document.title);
        console.log('Page HTML length:', document.body.innerHTML.length);
        
        // Look for common leaderboard patterns
        const possibleSelectors = [
          '[data-testid*="leaderboard"]',
          '.leaderboard-item',
          '.ranking-item',
          'tbody tr',
          '.user-rank',
          '.rank-item',
          '.leaderboard-entry',
          '.user-entry',
          '.score-item',
          '.player-rank',
          '[class*="rank"]',
          '[class*="leaderboard"]',
          '[class*="user"]',
          '[class*="score"]',
          'table tr',
          'ul li',
          'div[class*="item"]'
        ];

        console.log('Searching for leaderboard elements...');
        
        for (const selector of possibleSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            
            // Log first few elements for debugging
            for (let i = 0; i < Math.min(3, elements.length); i++) {
              const element = elements[i];
              console.log(`Element ${i + 1}:`, element.textContent?.trim().substring(0, 100));
            }
          }
        }

        // Try to find any table-like structure
        const tables = document.querySelectorAll('table');
        console.log(`Found ${tables.length} tables`);
        
        const lists = document.querySelectorAll('ul, ol');
        console.log(`Found ${lists.length} lists`);
        
        const divs = document.querySelectorAll('div');
        console.log(`Found ${divs.length} divs`);

        // This selector needs to be updated based on the actual page structure
        // For now, this is a generic approach
        const leaderboardItems = document.querySelectorAll('[data-testid*="leaderboard"], .leaderboard-item, .ranking-item, tbody tr, .user-rank');
        
        console.log(`Found ${leaderboardItems.length} potential leaderboard items`);
        
        leaderboardItems.forEach((item, index) => {
          try {
            // Generic selectors - will need customization
            const rankElement = item.querySelector('.rank, .position, td:first-child, [data-testid*="rank"]');
            const usernameElement = item.querySelector('.username, .user, .name, td:nth-child(2), [data-testid*="username"]');
            const scoreElement = item.querySelector('.score, .points, .value, td:last-child, [data-testid*="score"]');

            if (rankElement && usernameElement && scoreElement) {
              const rank = parseInt(rankElement.textContent?.trim() || (index + 1).toString());
              const username = usernameElement.textContent?.trim() || '';
              const scoreText = scoreElement.textContent?.trim() || '0';
              const score = parseFloat(scoreText.replace(/[^\d.-]/g, '')) || 0;

              if (username && !isNaN(rank) && !isNaN(score)) {
                results.push({
                  rank,
                  username,
                  score,
                  additionalData: {
                    rawScore: scoreText,
                    element: item.outerHTML.substring(0, 200) // First 200 chars for debugging
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error parsing leaderboard item:', error);
          }
        });

        return {
          leaderboard: results,
          totalEntries: results.length,
          pageTitle: document.title,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString()
        };
      });

      console.log(`Scraped ${leaderboardData.leaderboard.length} leaderboard entries`);

      return {
        leaderboard: leaderboardData.leaderboard,
        totalEntries: leaderboardData.totalEntries,
        scrapedAt: new Date(),
        metadata: {
          pageTitle: leaderboardData.pageTitle,
          pageUrl: leaderboardData.pageUrl,
          userAgent: await page.evaluate(() => navigator.userAgent),
          timestamp: leaderboardData.timestamp
        }
      };

    } catch (error) {
      console.error('Error during scraping:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance with auto-detected paths
export const scraper = new UndetectableScraper(
  './cookies.json',
  undefined, // Auto-detect user data directory
  process.env.CHROME_PROFILE || 'Default'
);

import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import fs from 'fs';
import path from 'path';
import * as os from 'os';

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
        const platform = process.platform;
        const homeDir = os.homedir();

        switch (platform) {
            case 'darwin': // macOS
                return `${homeDir}/Library/Application Support/Google/Chrome`;
            case 'win32': // Windows
                return `${homeDir}\\AppData\\Local\\Google\\Chrome\\User Data`;
            case 'linux': // Linux
                return `${homeDir}/.config/google-chrome`;
            default:
                throw new Error(`Unsupported operating system: ${platform}`);
        }
    }

    private getChromeExecutablePaths(): string[] {
        const platform = process.platform;
        const homeDir = os.homedir();

        switch (platform) {
            case 'darwin': // macOS
                return [
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    // '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
                    // '/Applications/Chromium.app/Contents/MacOS/Chromium',
                ];
            case 'win32': // Windows
                return [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    `${homeDir}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
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
        const platform = process.platform;
        const homeDir = os.homedir();

        switch (platform) {
            case 'darwin': // macOS
                if (process.arch === 'arm64') {
                    const knownPath = `${homeDir}/.cache/puppeteer/chrome/mac_arm-138.0.7204.94/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                    if (fs.existsSync(knownPath)) {
                        return knownPath;
                    }
                } else {
                    const knownPath = `${homeDir}/.cache/puppeteer/chrome/mac-*/chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
                    // We'd need to use glob here for production, but for now just check a common path
                    return undefined;
                }
                break;
            case 'win32': // Windows
                // Common Puppeteer Chrome path for Windows
                return `${homeDir}\\.cache\\puppeteer\\chrome\\win64-*\\chrome-win64\\chrome.exe`;
            case 'linux': // Linux
                return `${homeDir}/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome`;
            default:
                return undefined;
        }

        return undefined;
    }

    async initialize(): Promise<void> {
        try {
            console.log('Initializing UndetectableScraper...');
            console.log(`Using Chrome user data from: ${this.userDataDir}`);
            console.log(`Profile: ${this.profileName}`);

            // First, try to use Chrome with user data directory
            const chromeExecutablePaths = this.getChromeExecutablePaths();

            for (const executablePath of chromeExecutablePaths) {
                try {
                    console.log(`Attempting to launch Chrome with user data: ${executablePath}`);

                    this.browser = await puppeteer.launch({
                        headless: process.env.NODE_ENV === 'production' ? true : false,
                        executablePath,
                        userDataDir: this.userDataDir,
                        ignoreDefaultArgs: ['--disable-extensions', '--restore-last-session'], // Ignore restore args
                        timeout: 90000, // Increase timeout to 90 seconds
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
                            '--disable-extensions-except',
                            '--load-extension',
                            '--disable-extensions',
                            '--disable-plugins',
                            '--remote-debugging-port=9222',
                            `--profile-directory=${this.profileName}`,
                            // Arguments to bypass restore prompts and session restore
                            '--disable-session-crashed-bubble',
                            '--disable-infobars',
                            '--hide-crash-restore-bubble',
                            '--disable-restore-session-state',
                            '--disable-background-mode',
                            '--disable-background-networking',
                            '--no-recovery-component',
                            '--disable-component-update',
                            '--disable-crash-reporter',
                            '--disable-breakpad',
                            '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor,CSSColorSchemeUARendering',
                            '--enable-features=NetworkService,VizDisplayCompositor',
                            '--force-fieldtrials=NetworkService/Enabled',
                            '--disable-hang-monitor',
                            '--disable-prompt-on-repost',
                            '--disable-domain-reliability',
                            // Force Chrome to start with a blank page instead of restore prompt
                            '--homepage=about:blank',
                            '--start-maximized'
                        ],
                        defaultViewport: {
                            width: 1920,
                            height: 1080,
                        },
                    });

                    console.log(`✅ Successfully launched Chrome with user data: ${executablePath}`);
                    return;
                } catch (error) {
                    console.warn(`❌ Failed to launch Chrome with user data (${executablePath}):`, error);
                    continue;
                }
            }

            console.log('⚠️  Could not launch Chrome with user data, falling back to Puppeteer browser...');

            // Fallback to Puppeteer's bundled Chrome (without user data)
            const puppeteerChromePath = this.getPuppeteerChromePath();
            const fallbackPaths = [
                puppeteerChromePath,
                ...chromeExecutablePaths,
                undefined // Let Puppeteer auto-detect
            ].filter(Boolean);

            for (const executablePath of fallbackPaths) {
                try {
                    console.log(`Attempting fallback launch: ${executablePath || 'auto-detected'}`);

                    const launchOptions: any = {
                        headless: process.env.NODE_ENV === 'production' ? true : false,
                        timeout: 60000, // 60 second timeout for fallback
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
                            '--disable-session-crashed-bubble',
                            '--disable-restore-session-state',
                            '--homepage=about:blank'
                        ],
                        defaultViewport: {
                            width: 1920,
                            height: 1080,
                        },
                    };

                    // Add executablePath if specified
                    if (executablePath) {
                        launchOptions.executablePath = executablePath;
                    }

                    this.browser = await puppeteer.launch(launchOptions);
                    console.log(`✅ Successfully launched fallback browser: ${executablePath || 'auto-detected'}`);
                    return;
                } catch (error) {
                    console.warn(`❌ Failed to launch fallback browser (${executablePath || 'auto-detected'}):`, error);
                    continue;
                }
            }

            throw new Error('❌ Failed to initialize browser with any Chrome installation');
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
        // if (cookies.length > 0) {
        //   await page.setCookie(...cookies);
        //   console.log(`Loaded ${cookies.length} cookies`);
        // }

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

    // Helper method to simulate human behavior
    async simulateHumanBehavior(page: Page): Promise<void> {
        // Random mouse movements
        const moveCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < moveCount; i++) {
            await page.mouse.move(
                Math.random() * 1920,
                Math.random() * 1080,
                { steps: 10 + Math.floor(Math.random() * 10) }
            );
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
        }

        // Random scrolling
        await page.evaluate(() => {
            const scrollAmount = Math.random() * 800;
            window.scrollTo(0, scrollAmount);
        });

        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Random small mouse movements
        for (let i = 0; i < 2; i++) {
            await page.mouse.move(
                Math.random() * 100 + 500,
                Math.random() * 100 + 300,
                { steps: 5 }
            );
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        }
    }

    async scrapeLeaderboard(url: string): Promise<ScrapedData> {
        if (!this.browser) {
            await this.initialize();
        }

        const page = await this.createStealthPage();

        try {
            console.log(`🚀 Navigating to: ${url}`);

            // Navigate with realistic timing
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 45000
            });

            // Wait for page to load completely
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000));

            // Handle any restore prompts first
            await this.handleRestorePrompt(page);

            // Add console log listener to capture page console messages
            page.on('console', (msg) => {
                console.log('PAGE LOG:', msg.text());
            });

            // Get page title and URL for debugging
            const pageTitle = await page.title();
            const pageUrl = await page.url();
            console.log('📄 Page title:', pageTitle);
            console.log('🔗 Page URL:', pageUrl);

            // Enhanced verification page detection and handling
            const isVerificationPage = pageTitle.includes('Human Verification') ||
                pageTitle.includes('Verification') ||
                pageTitle.includes('Captcha') ||
                pageTitle.includes('Just a moment') ||
                pageTitle.includes('Please wait') ||
                await page.$('[data-testid="challenge-stage"]') !== null ||
                await page.$('.challenge-stage') !== null ||
                await page.$('.cf-challenge-stage') !== null;

            if (isVerificationPage) {
                console.log('🔒 Detected verification page. Attempting advanced bypass...');

                // Take a screenshot first to see what we're dealing with
                await page.screenshot({ path: 'verification-page.png', fullPage: true });
                console.log('📸 Verification page screenshot saved');

                // Wait for any auto-redirect or challenge completion
                console.log('⏳ Waiting for auto-challenge completion...');
                await new Promise(resolve => setTimeout(resolve, 10000));

                // Check for Cloudflare challenge
                const cfChallenge = await page.$('[data-testid="challenge-stage"]');
                if (cfChallenge) {
                    console.log('🛡️ Cloudflare challenge detected. Waiting for completion...');
                    await page.waitForSelector('[data-testid="challenge-stage"]', { hidden: true, timeout: 30000 }).catch(() => {
                        console.log('Challenge element did not disappear within timeout');
                    });
                }

                // Look for any interactive elements to click
                const interactiveElements = await page.$$([
                    'input[type="checkbox"]',
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button:contains("Continue")',
                    'button:contains("Proceed")',
                    'button:contains("Verify")',
                    'button:contains("I am human")',
                    '.challenge-button',
                    '.verify-button',
                    '.continue-button'
                ].join(', '));

                for (const element of interactiveElements) {
                    try {
                        const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
                        const type = await element.evaluate(el => el.getAttribute('type') || '');

                        if (type === 'checkbox' || text.includes('human') || text.includes('robot') ||
                            text.includes('continue') || text.includes('proceed') || text.includes('verify')) {
                            console.log(`🖱️ Clicking element: ${text || type}`);
                            await element.click();
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    } catch (error) {
                        console.log('Failed to interact with element:', error instanceof Error ? error.message : String(error));
                    }
                }

                // Wait for potential redirect after interaction
                await new Promise(resolve => setTimeout(resolve, 8000));

                // Check if we're still on verification page
                const newTitle = await page.title();
                const newUrl = await page.url();
                console.log('📄 New page title:', newTitle);
                console.log('🔗 New page URL:', newUrl);

                if (newTitle.includes('Human Verification') || newTitle.includes('Just a moment')) {
                    console.log('⚠️  Still on verification page. This may require manual intervention.');
                    console.log('💡 Consider using a different approach or checking if the site has additional protections.');

                    // Try one more approach - refresh the page and wait
                    console.log('🔄 Attempting page refresh...');
                    await page.reload({ waitUntil: 'networkidle2' });
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }

            // Take a screenshot for debugging
            await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
            console.log('📸 Debug screenshot saved');

            // Add realistic human-like actions
            // Wait for page to fully load and render
            await new Promise(resolve => setTimeout(resolve, 8000)); // Increased wait time for React app

            // Wait for dynamic content to load - look for common loading indicators
            try {
                await page.waitForFunction(() => {
                    // Check if React has hydrated and content is loaded
                    const hasContent = document.querySelectorAll('div').length > 20;
                    const noLoadingSpinners = document.querySelectorAll('[class*="loading"], [class*="spinner"]').length === 0;
                    const hasText = document.body.textContent && document.body.textContent.length > 1000;
                    return hasContent && noLoadingSpinners && hasText;
                }, { timeout: 15000 });
                console.log('✅ Dynamic content loaded');
            } catch (error) {
                console.log('⚠️  Dynamic content wait timed out, proceeding anyway');
            }

            // Enhanced leaderboard data extraction with better error handling
            console.log('🔍 Starting leaderboard data extraction...');

            const leaderboardData = await page.evaluate(() => {
                const results: Array<{
                    rank: number;
                    username: string;
                    score: number;
                    additionalData?: Record<string, any>;
                }> = [];

                // Debug: log the page structure
                console.log('📄 Page title:', document.title);
                console.log('📊 Page HTML length:', document.body.innerHTML.length);
                console.log('🔗 Current URL:', window.location.href);

                // Check if we're actually on the leaderboard page
                const title = document.title.toLowerCase();
                if (title.includes('verification') || title.includes('captcha') || title.includes('just a moment')) {
                    console.log('❌ Still on verification/captcha page, cannot extract leaderboard data');
                    return {
                        leaderboard: [],
                        totalEntries: 0,
                        pageTitle: document.title,
                        pageUrl: window.location.href,
                        timestamp: new Date().toISOString(),
                        error: 'Still on verification page'
                    };
                }

                // Look for common leaderboard patterns with more specific selectors
                const possibleSelectors = [
                    // Specific leaderboard selectors
                    '[data-testid*="leaderboard"]',
                    '[data-testid*="ranking"]',
                    '.leaderboard-item',
                    '.ranking-item',
                    '.leaderboard-entry',
                    '.user-rank',
                    '.rank-item',
                    '.player-rank',
                    '.score-item',
                    '.user-entry',

                    // Table-based leaderboards
                    'table[class*="leaderboard"] tbody tr',
                    'table[class*="ranking"] tbody tr',
                    'table[class*="score"] tbody tr',
                    'tbody tr',
                    'table tr:not(:first-child)',

                    // List-based leaderboards
                    'ul[class*="leaderboard"] li',
                    'ol[class*="ranking"] li',
                    'ul[class*="users"] li',
                    'ol[class*="players"] li',

                    // Generic patterns
                    'div[class*="rank"]',
                    'div[class*="leaderboard"]',
                    'div[class*="user"]',
                    'div[class*="score"]',
                    'div[class*="player"]',
                    '.ranking-list > div',
                    '.leaderboard-list > div'
                ];

                console.log('🔍 Searching for leaderboard elements...');

                let bestMatch = { selector: '', elements: [] as Element[] };
                let maxElements = 0;

                for (const selector of possibleSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        console.log(`Found ${elements.length} elements with selector: ${selector}`);

                        if (elements.length > maxElements && elements.length > 0) {
                            maxElements = elements.length;
                            bestMatch = { selector, elements: Array.from(elements) };
                        }

                        // Log first few elements for debugging
                        if (elements.length > 0) {
                            for (let i = 0; i < Math.min(2, elements.length); i++) {
                                const element = elements[i];
                                console.log(`Sample element ${i + 1}:`, element.textContent?.trim().substring(0, 150));
                            }
                        }
                    } catch (error) {
                        console.log(`Error with selector ${selector}:`, error instanceof Error ? error.message : String(error));
                    }
                }

                console.log(`🎯 Best match: ${bestMatch.selector} with ${bestMatch.elements.length} elements`);

                // Try to extract data from the best matching elements
                if (bestMatch.elements.length > 0) {
                    console.log('🔄 Attempting to extract leaderboard data...');

                    bestMatch.elements.forEach((item, index) => {
                        try {
                            // Multiple strategies for finding rank, username, and score
                            const strategies = [
                                // Strategy 1: Look for specific data attributes
                                {
                                    rank: item.querySelector('[data-testid*="rank"], [data-rank]'),
                                    username: item.querySelector('[data-testid*="username"], [data-testid*="user"], [data-testid*="name"], [data-user]'),
                                    score: item.querySelector('[data-testid*="score"], [data-testid*="points"], [data-score]')
                                },
                                // Strategy 2: Look for class-based selectors
                                {
                                    rank: item.querySelector('.rank, .position, .number'),
                                    username: item.querySelector('.username, .user, .name, .player'),
                                    score: item.querySelector('.score, .points, .value')
                                },
                                // Strategy 3: Table-based structure
                                {
                                    rank: item.querySelector('td:first-child, th:first-child'),
                                    username: item.querySelector('td:nth-child(2), th:nth-child(2)'),
                                    score: item.querySelector('td:last-child, th:last-child')
                                },
                                // Strategy 4: Generic div structure
                                {
                                    rank: item.querySelector('div:first-child'),
                                    username: item.querySelector('div:nth-child(2)'),
                                    score: item.querySelector('div:last-child')
                                }
                            ];

                            let extracted = false;

                            for (const strategy of strategies) {
                                if (strategy.rank && strategy.username && strategy.score) {
                                    const rankText = strategy.rank.textContent?.trim() || '';
                                    const usernameText = strategy.username.textContent?.trim() || '';
                                    const scoreText = strategy.score.textContent?.trim() || '';

                                    // Parse rank
                                    const rank = parseInt(rankText.replace(/[^\d]/g, '')) || (index + 1);

                                    // Parse username
                                    const username = usernameText.replace(/[^\w\s-_.]/g, '').trim();

                                    // Parse score
                                    const scoreMatch = scoreText.match(/[\d,]+\.?\d*/);
                                    const score = scoreMatch ? parseFloat(scoreMatch[0].replace(/,/g, '')) : 0;

                                    if (username && username.length > 0 && !isNaN(rank) && !isNaN(score)) {
                                        console.log(`✅ Extracted: #${rank} ${username} - ${score}`);
                                        results.push({
                                            rank,
                                            username,
                                            score,
                                            additionalData: {
                                                rawScore: scoreText,
                                                rawRank: rankText,
                                                rawUsername: usernameText,
                                                strategy: strategies.indexOf(strategy) + 1,
                                                element: item.outerHTML.substring(0, 300)
                                            }
                                        });
                                        extracted = true;
                                        break;
                                    }
                                }
                            }

                            if (!extracted) {
                                console.log(`❌ Failed to extract data from element ${index + 1}`);
                                console.log('Element content:', item.textContent?.trim().substring(0, 100));
                            }
                        } catch (error) {
                            console.error('Error parsing leaderboard item:', error);
                        }
                    });
                }

                // Sort results by rank to ensure proper ordering
                results.sort((a, b) => a.rank - b.rank);

                console.log(`📊 Successfully extracted ${results.length} leaderboard entries`);

                return {
                    leaderboard: results,
                    totalEntries: results.length,
                    pageTitle: document.title,
                    pageUrl: window.location.href,
                    timestamp: new Date().toISOString(),
                    bestSelector: bestMatch.selector,
                    elementsFound: bestMatch.elements.length
                };
            });

            console.log(`🎉 Scraped ${leaderboardData.leaderboard.length} leaderboard entries`);

            if (leaderboardData.leaderboard.length === 0) {
                console.log('⚠️  No leaderboard data found. This could indicate:');
                console.log('   - The page is still loading');
                console.log('   - The selectors need to be updated');
                console.log('   - The page structure has changed');
                console.log('   - Anti-bot measures are preventing data extraction');

                // Save debug information
                const debugInfo = await page.evaluate(() => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        bodyText: document.body.textContent?.substring(0, 500) || '',
                        forms: document.querySelectorAll('form').length,
                        buttons: document.querySelectorAll('button').length,
                        tables: document.querySelectorAll('table').length,
                        divs: document.querySelectorAll('div').length
                    };
                });

                console.log('🔍 Debug info:', debugInfo);
            }

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

    // Helper method to handle Chrome restore prompts
    async handleRestorePrompt(page: Page): Promise<void> {
        try {
            // Wait a bit for the page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Look for common restore prompt elements and dismiss them
            const restoreSelectors = [
                'button[aria-label="Restore"]',
                'button[aria-label="Don\'t restore"]',
                'button:contains("Don\'t restore")',
                'button:contains("Not now")',
                'button:contains("Cancel")',
                '.infobar button',
                '.restore-bar button',
                '[role="button"]:contains("restore")',
                '[data-testid="restore-dismiss"]'
            ];

            for (const selector of restoreSelectors) {
                try {
                    const elements = await page.$$(selector);
                    for (const element of elements) {
                        const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
                        if (text.includes('restore') || text.includes('cancel') || text.includes('not now')) {
                            console.log(`🚫 Dismissing restore prompt: ${text}`);
                            await element.click();
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            return;
                        }
                    }
                } catch (error) {
                    // Ignore errors for individual selectors
                }
            }

            // Try pressing Escape key to dismiss any modal dialogs
            await page.keyboard.press('Escape');
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.log('Error handling restore prompt:', error instanceof Error ? error.message : String(error));
        }
    }
}

// Export singleton instance
export const scraper = new UndetectableScraper(
    './cookies.json',
    process.env.CHROME_USER_DATA_DIR,
    process.env.CHROME_PROFILE || 'Profile 7'
);
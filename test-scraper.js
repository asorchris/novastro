const { scraper } = require('./dist/scraper/undetectable');

async function testScraper() {
  try {
    console.log('Testing scraper with Chrome Profile 7...');
    
    // Initialize the scraper
    await scraper.initialize();
    console.log('Scraper initialized successfully!');
    
    // Test navigation to the target URL
    console.log('Testing navigation to target URL...');
    const result = await scraper.scrapeLeaderboard('https://yaps.kaito.ai/yapper-leaderboards');
    
    console.log('Scraping completed!');
    console.log(`Found ${result.totalEntries} entries`);
    console.log('First 3 entries:', result.leaderboard.slice(0, 3));
    
    // Close the browser
    // await scraper.close();
    console.log('Browser closed successfully');
    
  } catch (error) {
    console.error('Error testing scraper:', error);
  }
}

testScraper();

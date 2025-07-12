const { UndetectableScraper } = require('./dist/scraper/undetectable');

async function testInitialization() {
  console.log('Testing scraper initialization...');
  
  try {
    const scraper = new UndetectableScraper(
      './cookies.json',
      '/Users/m4cb000k/Library/Application Support/Google/Chrome',
      'Default'
    );
    
    console.log('Scraper instance created successfully');
    
    await scraper.initialize();
    console.log('✅ Scraper initialized successfully!');
    
    await scraper.close();
    console.log('✅ Scraper closed successfully!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
}

testInitialization();

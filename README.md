# Leaderboard Scraper

An undetectable Puppeteer-based web scraper that extracts leaderboard data from https://yaps.kaito.ai/yapper-leaderboards with intelligent caching and scheduling.

## Features

- 🕵️ **Undetectable Scraping**: Uses Puppeteer-Extra with stealth plugins to avoid detection
- 🍪 **Cookie Injection**: Loads cookies from JSON file for authenticated scraping
- ⚡ **Redis Caching**: Intelligent caching with TTL to reduce scraping frequency
- 📅 **Scheduled Scraping**: Automatic scraping every 30 minutes using cron
- 🗄️ **MongoDB Storage**: Persistent storage of all scraped data
- 🚀 **RESTful API**: Express.js server with comprehensive endpoints
- 📊 **Scalable Architecture**: Modular design for easy scaling and maintenance
- 🔒 **Security**: Rate limiting, CORS, and Helmet security middleware

## Prerequisites

- Node.js 18+
- MongoDB
- Redis
- TypeScript

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd leaderboard-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Configure cookies:
```bash
# Edit cookies.json with your authentication cookies
```

5. Build the project:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/leaderboard_scraper

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Scraping Configuration
SCRAPE_INTERVAL_MINUTES=30
TARGET_URL=https://yaps.kaito.ai/yapper-leaderboards

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Chrome Configuration

You can configure the scraper to use your existing Chrome user data, which gives you access to your saved cookies, login sessions, and browsing history:

```env
# Use your existing Chrome user data
USE_CHROME_USER_DATA=true

# Specify which Chrome profile to use
CHROME_PROFILE=Default
```

**Available Chrome Profiles:**
Based on your Chrome installation, you can use any of these profiles:
- `Default` (recommended)
- `Profile 1`, `Default`, `Profile 16`, `Profile 24`, `Profile 28`, etc.

**Benefits of using Chrome User Data:**
- 🍪 **Automatic Cookie Access**: No need to manually export/import cookies
- 🔐 **Saved Login Sessions**: Access sites you're already logged into
- 📚 **Browsing History**: Leverages your existing browsing patterns
- 🎯 **Better Detection Avoidance**: Uses your real browsing profile

**Note**: When using Chrome user data, make sure Chrome is completely closed before running the scraper.

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### GET /api/leaderboard
Get current leaderboard data (from cache if available)

**Query Parameters:**
- `refresh=true` - Force refresh from source

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "username": "user123",
      "score": 1500,
      "additionalData": {}
    }
  ],
  "totalEntries": 50,
  "timestamp": "2025-01-01T12:00:00Z",
  "cached": true
}
```

### GET /api/leaderboard/history
Get historical scraping data

**Query Parameters:**
- `limit=10` - Number of records to return

### POST /api/leaderboard/scrape
Trigger manual scraping

### GET /api/leaderboard/status
Get scheduler status

### POST /api/leaderboard/scheduler/start
Start the scheduler

### POST /api/leaderboard/scheduler/stop
Stop the scheduler

## Project Structure

```
src/
├── app.ts              # Main application entry point
├── models/
│   └── leaderboard.ts  # MongoDB schemas
├── routes/
│   └── leaderboard.ts  # API routes
├── scraper/
│   ├── undetectable.ts # Puppeteer scraper with stealth
│   └── scheduler.ts    # Cron job scheduler
├── services/
│   └── scraperService.ts # Business logic
└── utils/
    └── redis.ts        # Redis utilities
```

## How It Works

1. **Initialization**: App connects to MongoDB and Redis, initializes the scraper
2. **Scheduling**: Cron job runs every 30 minutes to scrape data
3. **Scraping**: Puppeteer with stealth plugins navigates to target site
4. **Cookie Injection**: Loads cookies from JSON file for authentication
5. **Data Extraction**: Extracts leaderboard data using intelligent selectors
6. **Caching**: Stores data in Redis with TTL
7. **Persistence**: Saves all data to MongoDB for history
8. **API**: Serves data via REST endpoints with caching logic

## Undetectable Features

- **Stealth Plugin**: Removes webdriver traces
- **Realistic User Agent**: Mimics real browser
- **Random Delays**: Human-like timing
- **Header Spoofing**: Realistic HTTP headers
- **Cookie Support**: Maintains session state
- **Viewport Randomization**: Varies screen size
- **Plugin Mocking**: Simulates browser plugins

## Monitoring

The application includes comprehensive logging:
- Scraping attempts and results
- Cache hit/miss ratios
- Database operations
- Scheduler status
- API requests and responses

## Error Handling

- **Fallback Mechanism**: Returns cached data if scraping fails
- **Retry Logic**: Automatic retries for failed requests
- **Graceful Degradation**: Continues operation even if some components fail
- **Comprehensive Logging**: All errors are logged for debugging

## Security

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers
- **Input Validation**: Sanitizes user input
- **Environment Variables**: Sensitive data protection

## Scaling

The architecture supports horizontal scaling:
- **Stateless Design**: No server-side sessions
- **Redis Clustering**: Distributed caching
- **MongoDB Sharding**: Database scaling
- **Load Balancing**: Multiple server instances

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

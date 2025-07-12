<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Leaderboard Scraper Project

This project is a TypeScript-based web scraper that uses Puppeteer to extract leaderboard data from https://yaps.kaito.ai/yapper-leaderboards in an undetectable manner.

## Key Technologies
- **Puppeteer-Extra**: For undetectable web scraping with stealth plugins
- **Express.js**: RESTful API server
- **MongoDB with Mongoose**: Data persistence
- **Redis**: Caching layer
- **TypeScript**: Type-safe development
- **Node-cron**: Scheduled scraping every 30 minutes

## Project Structure
- `src/scraper/`: Contains the undetectable Puppeteer scraper
- `src/services/`: Business logic for scraping and caching
- `src/models/`: MongoDB schemas
- `src/routes/`: Express API routes
- `src/utils/`: Utility functions (Redis, etc.)

## Key Features
- Undetectable scraping with stealth plugins
- Cookie injection from JSON file
- Automatic retry and fallback mechanisms
- Scheduled scraping every 30 minutes
- Redis caching with TTL
- RESTful API endpoints
- Error handling and logging

## Code Guidelines
- Use async/await for all asynchronous operations
- Implement proper error handling with try-catch blocks
- Follow TypeScript best practices with proper typing
- Cache data in Redis before returning responses
- Log all significant operations for monitoring
- Use environment variables for configuration

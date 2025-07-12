import { scraper } from '../scraper/undetectable';
import { LeaderboardData, ILeaderboardEntry } from '../models/leaderboard';
import { setCache, getCache } from '../utils/redis';

export class ScraperService {
  private static instance: ScraperService;
  private readonly cacheKey = 'leaderboard_data';
  private readonly cacheTtl = 1800; // 30 minutes in seconds

  private constructor() {}

  static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  async getLeaderboardData(forceRefresh: boolean = false): Promise<ILeaderboardEntry[]> {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = await getCache(this.cacheKey);
        if (cached) {
          console.log('Returning cached leaderboard data');
          return cached;
        }
      }

      // Scrape new data
      console.log('Scraping new leaderboard data');
      const scrapedData = await scraper.scrapeLeaderboard(process.env.TARGET_URL || 'https://yaps.kaito.ai/yapper-leaderboards');
      
      // Save to database
      const leaderboardDoc = new LeaderboardData({
        data: scrapedData.leaderboard,
        source: process.env.TARGET_URL || 'https://yaps.kaito.ai/yapper-leaderboards',
        totalEntries: scrapedData.totalEntries,
        metadata: scrapedData.metadata
      });

      await leaderboardDoc.save();
      console.log('Leaderboard data saved to database');

      // Cache the data
      await setCache(this.cacheKey, scrapedData.leaderboard, this.cacheTtl);
      console.log('Leaderboard data cached');

      return scrapedData.leaderboard;
    } catch (error) {
      console.error('Error in getLeaderboardData:', error);
      
      // Try to return cached data as fallback
      const cached = await getCache(this.cacheKey);
      if (cached) {
        console.log('Returning cached data as fallback');
        return cached;
      }

      // If no cache, try to get latest from database
      const latest = await LeaderboardData.findOne().sort({ scrapedAt: -1 });
      if (latest) {
        console.log('Returning latest data from database as fallback');
        return latest.data;
      }

      throw error;
    }
  }

  async getLeaderboardHistory(limit: number = 10): Promise<any[]> {
    try {
      const history = await LeaderboardData.find()
        .sort({ scrapedAt: -1 })
        .limit(limit)
        .select('scrapedAt totalEntries source metadata');
      
      return history;
    } catch (error) {
      console.error('Error getting leaderboard history:', error);
      throw error;
    }
  }

  async triggerScrape(): Promise<ILeaderboardEntry[]> {
    console.log('Manual scrape triggered');
    return this.getLeaderboardData(true);
  }
}

export const scraperService = ScraperService.getInstance();

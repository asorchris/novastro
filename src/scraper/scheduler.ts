import cron from 'node-cron';
import { scraperService } from '../services/scraperService';

export class ScraperScheduler {
  private static instance: ScraperScheduler;
  private scheduledTask: any = null;

  private constructor() {}

  static getInstance(): ScraperScheduler {
    if (!ScraperScheduler.instance) {
      ScraperScheduler.instance = new ScraperScheduler();
    }
    return ScraperScheduler.instance;
  }

  async initialize(): Promise<void> {
    const intervalMinutes = parseInt(process.env.SCRAPE_INTERVAL_MINUTES || '30');
    
    // Create cron expression for every N minutes
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    console.log(`Scheduling scraper to run every ${intervalMinutes} minutes`);
    
    this.scheduledTask = cron.schedule(cronExpression, async () => {
      console.log('Scheduled scrape started at:', new Date().toISOString());
      
      try {
        await scraperService.getLeaderboardData(true);
        console.log('Scheduled scrape completed successfully');
      } catch (error) {
        console.error('Scheduled scrape failed:', error);
      }
    }, {
      timezone: 'UTC'
    });

    // Run an initial scrape
    console.log('Running initial scrape...');
    try {
      await scraperService.getLeaderboardData(true);
      console.log('Initial scrape completed successfully');
    } catch (error) {
      console.error('Initial scrape failed:', error);
    }
  }

  stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      console.log('Scraper scheduler stopped');
    }
  }

  start(): void {
    if (this.scheduledTask) {
      this.scheduledTask.start();
      console.log('Scraper scheduler started');
    }
  }

  getStatus(): { isRunning: boolean; nextRun: string | null } {
    if (this.scheduledTask) {
      return {
        isRunning: this.scheduledTask.running || false,
        nextRun: this.scheduledTask.nextDate ? this.scheduledTask.nextDate().toISOString() : null
      };
    }
    
    return {
      isRunning: false,
      nextRun: null
    };
  }
}

export const scraperScheduler = ScraperScheduler.getInstance();

export const initializeScraper = async (): Promise<void> => {
  await scraperScheduler.initialize();
};

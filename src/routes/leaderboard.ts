import express from 'express';
import { scraperService } from '../services/scraperService';
import { scraperScheduler } from '../scraper/scheduler';

const router = express.Router();

// Get leaderboard data
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await scraperService.getLeaderboardData(forceRefresh);
    
    res.json({
      success: true,
      data,
      totalEntries: data.length,
      timestamp: new Date().toISOString(),
      cached: !forceRefresh
    });
  } catch (error) {
    console.error('Error getting leaderboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get leaderboard history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await scraperService.getLeaderboardHistory(limit);
    
    res.json({
      success: true,
      data: history,
      totalEntries: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting leaderboard history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger manual scrape
router.post('/scrape', async (req, res) => {
  try {
    const data = await scraperService.triggerScrape();
    
    res.json({
      success: true,
      data,
      totalEntries: data.length,
      timestamp: new Date().toISOString(),
      message: 'Manual scrape completed successfully'
    });
  } catch (error) {
    console.error('Error triggering manual scrape:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger manual scrape',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scheduler status
router.get('/status', (req, res) => {
  try {
    const status = scraperScheduler.getStatus();
    
    res.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Control scheduler (start/stop)
router.post('/scheduler/:action', (req, res) => {
  try {
    const { action } = req.params;
    
    if (action === 'start') {
      scraperScheduler.start();
      res.json({
        success: true,
        message: 'Scheduler started',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'stop') {
      scraperScheduler.stop();
      res.json({
        success: true,
        message: 'Scheduler stopped',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be either "start" or "stop"'
      });
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control scheduler',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

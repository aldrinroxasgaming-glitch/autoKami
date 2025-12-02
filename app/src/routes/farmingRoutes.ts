import { Router } from 'express';
import { calculateHarvestOutput, calculateRegenerationTime, getFarmingStats } from '../services/farmingService.js';

const router = Router();

/**
 * GET /api/farming/calculate/:kamiIdOrIndex
 * Calculate harvest output and regeneration times for a Kami
 * Accepts either entity ID or index (if < 1e10, treated as index)
 */
router.get('/calculate/:kamiIdOrIndex', async (req, res) => {
  try {
    const param = req.params.kamiIdOrIndex;
    const nodeIndex = req.query.nodeIndex ? parseInt(req.query.nodeIndex as string, 10) : undefined;
    const harvestDuration = req.query.duration ? parseInt(req.query.duration as string, 10) : 3600; // default 1 hour in seconds

    // Determine if it's an index or entity ID
    // If it's a number and less than 1e10, treat as index, otherwise as entity ID
    const numValue = Number(param);
    const kamiIdOrIndex = (!isNaN(numValue) && numValue < 1e10) 
      ? numValue  // Treat as index
      : BigInt(param);  // Treat as entity ID

    const stats = await getFarmingStats(kamiIdOrIndex, nodeIndex, harvestDuration);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to calculate farming stats', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * POST /api/farming/calculate
 * Calculate harvest output with custom parameters
 * 
 * Body:
 * {
 *   "kamiId": "123...",
 *   "nodeIndex": 12,
 *   "duration": 3600
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { kamiId, kamiIndex, nodeIndex, duration = 3600 } = req.body;

    if (!kamiId && kamiIndex === undefined) {
      return res.status(400).json({ error: 'kamiId or kamiIndex is required' });
    }

    // Use kamiIndex if provided, otherwise use kamiId
    const kamiIdOrIndex = kamiIndex !== undefined 
      ? Number(kamiIndex)  // Treat as index
      : (typeof kamiId === 'string' && !isNaN(Number(kamiId)) && Number(kamiId) < 1e10)
        ? Number(kamiId)  // Small number, treat as index
        : BigInt(kamiId);  // Large number, treat as entity ID

    const stats = await getFarmingStats(kamiIdOrIndex, nodeIndex, duration);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to calculate farming stats', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;


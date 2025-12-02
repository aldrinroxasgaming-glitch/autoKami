import { Router } from 'express';
import { getKamiById, getKamiByIndex, getTotalKamis } from '../services/kamiService.js';

const router = Router();

/**
 * GET /api/kami/total
 * Get total number of Kamis
 */
router.get('/total', async (req, res) => {
  try {
    const total = await getTotalKamis();
    res.json({ total });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get total Kamis',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/kami/:id
 * Get Kami data by entity ID
 */
router.get('/:id', async (req, res) => {
  try {
    const kamiId = req.params.id;
    const kami = await getKamiById(BigInt(kamiId));
    res.json(kami);
  } catch (error) {
    res.status(404).json({ 
      error: 'Kami not found', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * GET /api/kami/index/:index
 * Get Kami data by index
 */
router.get('/index/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid index. Must be a number.' });
    }
    const kami = await getKamiByIndex(index);
    res.json(kami);
  } catch (error) {
    res.status(404).json({ 
      error: 'Kami not found', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;


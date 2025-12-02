import { Router, Request, Response } from 'express';
import {
  startHarvest,
  stopHarvest,
  collectHarvest,
  stopHarvestByKamiId,
  collectHarvestByKamiId,
  getHarvestIdForKami,
  isKamiHarvesting,
  HarvestStartParams,
  HarvestStopParams,
  HarvestCollectParams
} from '../services/harvestService.js';

const router = Router();

/**
 * POST /api/harvest/start
 * Start harvesting for a Kami at a specific node
 *
 * Body:
 * - kamiId: string (Kami entity ID)
 * - nodeIndex: number (node/room index to harvest at)
 * - privateKey?: string (optional - uses OPERATOR_PRIVATE_KEY from env if not provided)
 * - taxerId?: string (optional taxer ID)
 * - taxAmount?: string (optional tax amount)
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { kamiId, nodeIndex, privateKey, taxerId, taxAmount } = req.body;

    if (!kamiId || nodeIndex === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: kamiId, nodeIndex'
      });
    }

    const params: HarvestStartParams = {
      kamiId,
      nodeIndex: Number(nodeIndex),
      privateKey, // Optional - service will use env default if not provided
      taxerId,
      taxAmount
    };

    const result = await startHarvest(params);

    if (result.success) {
      return res.json({
        success: true,
        txHash: result.txHash,
        harvestId: result.harvestId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start harvest'
    });
  }
});

/**
 * POST /api/harvest/stop
 * Stop harvesting and collect output
 *
 * Body:
 * - harvestId: string (harvest entity ID)
 * - privateKey?: string (optional - uses OPERATOR_PRIVATE_KEY from env if not provided)
 *
 * OR
 *
 * - kamiId: string (Kami entity ID - will compute harvest ID automatically)
 * - privateKey?: string (optional - uses OPERATOR_PRIVATE_KEY from env if not provided)
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const { harvestId, kamiId, privateKey } = req.body;

    if (!harvestId && !kamiId) {
      return res.status(400).json({
        error: 'Missing required parameter: harvestId or kamiId'
      });
    }

    let result;

    if (harvestId) {
      // Direct harvest ID provided
      result = await stopHarvest({ harvestId, privateKey });
    } else {
      // Use kamiId to compute harvest ID
      result = await stopHarvestByKamiId(kamiId, privateKey);
    }

    if (result.success) {
      return res.json({
        success: true,
        txHash: result.txHash
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to stop harvest'
    });
  }
});

/**
 * POST /api/harvest/collect
 * Collect harvest output without stopping
 *
 * Body:
 * - harvestId: string (harvest entity ID)
 * - privateKey?: string (optional - uses OPERATOR_PRIVATE_KEY from env if not provided)
 *
 * OR
 *
 * - kamiId: string (Kami entity ID - will compute harvest ID automatically)
 * - privateKey?: string (optional - uses OPERATOR_PRIVATE_KEY from env if not provided)
 */
router.post('/collect', async (req: Request, res: Response) => {
  try {
    const { harvestId, kamiId, privateKey } = req.body;

    if (!harvestId && !kamiId) {
      return res.status(400).json({
        error: 'Missing required parameter: harvestId or kamiId'
      });
    }

    let result;

    if (harvestId) {
      // Direct harvest ID provided
      result = await collectHarvest({ harvestId, privateKey });
    } else {
      // Use kamiId to compute harvest ID
      result = await collectHarvestByKamiId(kamiId, privateKey);
    }

    if (result.success) {
      return res.json({
        success: true,
        txHash: result.txHash
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to collect harvest'
    });
  }
});

/**
 * GET /api/harvest/status/:kamiId
 * Get harvest status for a Kami (check if harvesting)
 *
 * The harvestId is computed deterministically as:
 * keccak256(abi.encodePacked("harvest", kamiID))
 */
router.get('/status/:kamiId', async (req: Request, res: Response) => {
  try {
    const { kamiId } = req.params;

    if (!kamiId) {
      return res.status(400).json({
        error: 'Missing required parameter: kamiId'
      });
    }

    // Check Kami state directly from GetterSystem
    const isHarvesting = await isKamiHarvesting(kamiId);

    // Compute harvestId deterministically from kamiId
    const harvestId = getHarvestIdForKami(kamiId);

    return res.json({
      kamiId,
      isHarvesting,
      harvestId
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get harvest status'
    });
  }
});

export default router;

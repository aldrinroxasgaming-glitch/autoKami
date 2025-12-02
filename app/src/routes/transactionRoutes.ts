import { Router } from 'express';
import { executeSystemCall } from '../services/transactionService.js';

const router = Router();

/**
 * POST /api/transaction/execute
 * Execute a system call transaction
 * 
 * Body:
 * {
 *   "systemId": "system.harvest.start",
 *   "arguments": ["123"], // encoded as bytes or typed parameters
 *   "privateKey": "0x..." // or use wallet provider
 * }
 */
router.post('/execute', async (req, res) => {
  try {
    const { systemId, arguments: args, privateKey, typedParams } = req.body;

    if (!systemId) {
      return res.status(400).json({ error: 'systemId is required' });
    }

    if (!privateKey) {
      return res.status(400).json({ error: 'privateKey is required for transaction signing' });
    }

    const result = await executeSystemCall({
      systemId,
      arguments: args,
      typedParams,
      privateKey
    });

    res.json({
      success: true,
      transactionHash: result.hash,
      transaction: result
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Transaction failed', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;


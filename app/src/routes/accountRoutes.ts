import { Router } from 'express';
import { getKamisByAccountId, getAccountByAddress, getAccountById } from '../services/accountService.js';
import { getAccountStamina } from '../services/automationService.js';

const router = Router();

/**
 * GET /api/account/:accountId/stamina
 * Get current stamina for an account
 */
router.get('/:accountId/stamina', async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const stamina = await getAccountStamina(accountId);
    res.json({ stamina });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve stamina',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/account/address/:address
 * Get account by wallet address (includes all Kamis)
 */
router.get('/address/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const account = await getAccountByAddress(address);
    res.json(account);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve account',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/account/:accountId
 * Get account by account ID (includes all Kamis)
 */
router.get('/:accountId', async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const account = await getAccountById(accountId);
    res.json(account);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve account',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/account/:accountId/kamis
 * Get all Kamis owned by an account ID (legacy endpoint)
 */
router.get('/:accountId/kamis', async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const kamis = await getKamisByAccountId(accountId);
    res.json({
      accountId,
      count: kamis.length,
      kamis
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve Kamis',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import {
    getOrCreateUser,
    addOperatorWallet,
    getOperatorWallets,
    deleteOperatorWallet
} from '../services/supabaseService.js';
import { computeAccountIdFromAddress } from '../services/accountService.js';

const router = Router();

/**
 * POST /api/profiles/add
 * Add a new operator wallet (profile)
 * 
 * Body:
 * - privyUserId: string (Privy user ID)
 * - name: string (Profile name)
 * - walletAddress: string (Wallet address 0x...)
 * - privateKey: string (Private key for the wallet)
 */
router.post('/add', async (req: Request, res: Response) => {
    try {
        // Accept either walletAddress (preferred) or accountId (legacy/direct)
        const { privyUserId, name, walletAddress, accountId, privateKey } = req.body;

        if (!privyUserId || !name || !privateKey) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        let finalWalletAddress = walletAddress;
        let finalAccountId = accountId;

        // If wallet address provided, compute account ID
        if (walletAddress) {
            try {
                finalAccountId = computeAccountIdFromAddress(walletAddress).toString();
            } catch (e) {
                return res.status(400).json({ error: 'Invalid wallet address format' });
            }
        } 
        // If only account ID provided (unlikely for normal flow but possible), we might not have wallet address
        // Ideally we require walletAddress now based on the UI change
        else if (!finalAccountId) {
             return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get or create user
        const user = await getOrCreateUser(privyUserId);

        // Add operator wallet
        const wallet = await addOperatorWallet(
            user.id, 
            name, 
            finalAccountId, 
            finalWalletAddress, 
            privateKey
        );

        return res.json({
            success: true,
            profile: {
                id: wallet.id,
                name: wallet.name,
                accountId: wallet.account_id,
                walletAddress: wallet.wallet_address,
                createdAt: wallet.created_at
            }
        });
    } catch (error) {
        console.error('Error adding profile:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to add profile'
        });
    }
});

/**
 * GET /api/profiles
 * Get all profiles for a user
 * 
 * Query:
 * - privyUserId: string (Privy user ID)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { privyUserId } = req.query;
        console.log(`[Profiles] GET request. Query:`, req.query);

        if (!privyUserId || typeof privyUserId !== 'string') {
            console.warn('[Profiles] Missing privyUserId');
            return res.status(400).json({
                error: 'Missing required query parameter: privyUserId'
            });
        }

        const cleanUserId = privyUserId.trim();

        // Get user
        const user = await getOrCreateUser(cleanUserId);
        console.log(`[Profiles] User resolved: ${user.id} (from ${cleanUserId})`);

        // Get operator wallets
        const wallets = await getOperatorWallets(user.id);
        console.log(`[Profiles] Found ${wallets.length} wallets for user ${user.id}`);

        return res.json({
            profiles: wallets.map(w => ({
                id: w.id,
                name: w.name,
                accountId: w.account_id,
                walletAddress: w.wallet_address,
                isActive: w.is_active,
                createdAt: w.created_at
            }))
        });
    } catch (error) {
        console.error('Error getting profiles:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get profiles'
        });
    }
});

/**
 * DELETE /api/profiles/:id
 * Delete an operator wallet (profile)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Missing profile ID'
            });
        }

        await deleteOperatorWallet(id);

        return res.json({
            success: true
        });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete profile'
        });
    }
});

export default router;

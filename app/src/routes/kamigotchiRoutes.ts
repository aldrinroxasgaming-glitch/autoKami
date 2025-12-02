import { Router, Request, Response } from 'express';
import {
    getOrCreateUser,
    getOperatorWallets,
    upsertKamigotchi,
    getKamigotchis,
    getKamigotchiById,
    getKamigotchiByEntityId,
    deleteKamigotchi,
    getOrCreateKamiProfile,
    updateKamiProfile,
    decryptPrivateKey,
    logSystemEvent
} from '../services/supabaseService.js';
import { getKamisByAccountId } from '../services/accountService.js';
import { startHarvest, stopHarvestByKamiId, isKamiHarvesting } from '../services/harvestService.js';

const router = Router();

/**
 * POST /api/kamigotchis/refresh
 * Fetch kamigotchis from on-chain for all user profiles and sync to Supabase
 * 
 * Body:
 * - privyUserId: string (Privy user ID)
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { privyUserId, operatorWalletId } = req.body;

        if (!privyUserId) {
            return res.status(400).json({
                error: 'Missing required field: privyUserId'
            });
        }

        // Get user first to ensure we can log with user_id
        const user = await getOrCreateUser(privyUserId);

        await logSystemEvent({
            user_id: user.id,
            action: 'refresh_kamigotchis',
            status: 'info',
            message: `Starting refresh for user ${privyUserId}${operatorWalletId ? ` (Wallet: ${operatorWalletId})` : ''}`
        });

        // Get all operator wallets
        let wallets = await getOperatorWallets(user.id);

        // Filter by operatorWalletId if provided
        if (operatorWalletId) {
            wallets = wallets.filter(w => w.id === operatorWalletId);
            if (wallets.length === 0) {
                await logSystemEvent({
                    user_id: user.id,
                    action: 'refresh_kamigotchis',
                    status: 'warning',
                    message: `Operator wallet ${operatorWalletId} not found or not active`
                });
                return res.status(404).json({ error: 'Operator wallet not found' });
            }
        }

        if (wallets.length === 0) {
            await logSystemEvent({
                user_id: user.id,
                action: 'refresh_kamigotchis',
                status: 'warning',
                message: `No profiles found for user ${user.id}`
            });
            return res.json({
                success: true,
                message: 'No profiles found',
                synced: 0
            });
        }

        let totalSynced = 0;
        const errors: string[] = [];

        // For each wallet, fetch kamis and sync
        for (const wallet of wallets) {
            try {
                // Fetch kamis from on-chain using account ID (computed from wallet address and stored in account_id)
                await logSystemEvent({
                    user_id: user.id,
                    action: 'fetch_onchain',
                    status: 'info',
                    message: `Fetching kamis for wallet ${wallet.name} (Account ID: ${wallet.account_id})`,
                    metadata: { walletId: wallet.id, accountId: wallet.account_id, walletAddress: wallet.wallet_address }
                });

                // Use the stored numeric account ID for querying on-chain
                const kamis = await getKamisByAccountId(wallet.account_id);

                console.log(`[Query] Fetched ${kamis.length} kamis for wallet ${wallet.name} (${wallet.wallet_address})`);

                // Decrypt private key for storage
                const privateKey = decryptPrivateKey(wallet.encrypted_private_key);

                // Upsert each kami to Supabase
                for (const kami of kamis) {
                    try {
                        const upsertedKami = await upsertKamigotchi({
                            userId: user.id,
                            operatorWalletId: wallet.id,
                            kamiEntityId: kami.id,
                            kamiIndex: kami.index,
                            kamiName: kami.name,
                            level: kami.level,
                            state: kami.state,
                            roomIndex: kami.room?.index || null,
                            roomName: kami.room?.name || null,
                            mediaUri: kami.mediaURI,
                            accountId: wallet.account_id, // Use the correct account ID
                            affinities: kami.affinities,
                            stats: kami.stats,
                            finalStats: kami.finalStats,
                            traits: kami.traits,
                            privateKey: privateKey,
                            currentHealth: kami.currentHealth
                        });

                        // Ensure automation profile exists so frontend can query it
                        await getOrCreateKamiProfile(upsertedKami.id, wallet.id);
                        
                        await logSystemEvent({
                            user_id: user.id,
                            kami_index: kami.index,
                            action: 'sync_kami',
                            status: 'success',
                            message: `Synced Kamigotchi: ${kami.name} (#${kami.index})`,
                            metadata: { entityId: kami.id }
                        });
                        
                        totalSynced++;
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                        console.error(`[Error] Failed to sync kami ${kami.id}:`, error);
                        
                        await logSystemEvent({
                            user_id: user.id,
                            kami_index: kami.index,
                            action: 'sync_kami',
                            status: 'error',
                            message: `Failed to sync ${kami.name}: ${errorMsg}`,
                            metadata: { error: errorMsg, entityId: kami.id }
                        });
                        
                        errors.push(`Failed to sync ${kami.name}: ${errorMsg}`);
                    }
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[Error] Failed to fetch kamis for wallet ${wallet.name}:`, error);
                
                await logSystemEvent({
                    user_id: user.id,
                    action: 'fetch_onchain',
                    status: 'error',
                    message: `Failed to fetch kamis for wallet ${wallet.name}: ${errorMsg}`,
                    metadata: { error: errorMsg, walletId: wallet.id }
                });
                
                errors.push(`Wallet ${wallet.name}: ${errorMsg}`);
            }
        }

        await logSystemEvent({
            user_id: user.id,
            action: 'refresh_kamigotchis',
            status: 'success',
            message: `Refresh complete. Synced ${totalSynced} kamigotchis. Errors: ${errors.length}`,
            metadata: { synced: totalSynced, errorCount: errors.length }
        });

        return res.json({
            success: true,
            synced: totalSynced,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to refresh kamigotchis';
        console.error('[Error] refreshing kamigotchis:', error);
        
        // Try to get user ID if possible, otherwise log without it (might be system error)
        let userId;
        try {
             if (req.body.privyUserId) {
                 const user = await getOrCreateUser(req.body.privyUserId);
                 userId = user.id;
             }
        } catch (e) { /* ignore */ }

        await logSystemEvent({
            user_id: userId,
            action: 'refresh_kamigotchis',
            status: 'error',
            message: `Critical error during refresh: ${errorMsg}`,
            metadata: { error: errorMsg }
        });

        return res.status(500).json({
            error: errorMsg
        });
    }
});

/**
 * GET /api/kamigotchis
 * Get all kamigotchis for a user from Supabase
 * 
 * Query:
 * - privyUserId: string (Privy user ID)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { privyUserId } = req.query;

        if (!privyUserId || typeof privyUserId !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: privyUserId'
            });
        }

        // Get user
        const user = await getOrCreateUser(privyUserId);

        // Get kamigotchis
        const kamigotchis = await getKamigotchis(user.id);

        // Get automation profiles for each kamigotchi
        const kamigotchisWithProfiles = await Promise.all(
            kamigotchis.map(async (kami) => {
                try {
                    const profile = await getOrCreateKamiProfile(kami.id, kami.operator_wallet_id);

                    // Check on-chain harvesting status
                    let isHarvesting = false;
                    try {
                        isHarvesting = await isKamiHarvesting(kami.kami_entity_id);
                    } catch (error) {
                        console.error(`Failed to check harvest status for ${kami.kami_entity_id}:`, error);
                    }

                    return {
                        id: kami.id,
                        entityId: kami.kami_entity_id,
                        index: kami.kami_index,
                        name: kami.kami_name,
                        level: kami.level,
                        state: isHarvesting ? 'HARVESTING' : kami.state,
                        room: {
                            index: kami.room_index,
                            name: kami.room_name
                        },
                        mediaURI: kami.media_uri,
                        accountId: kami.account_id,
                        operator_wallet_id: kami.operator_wallet_id, // Added for filtering
                        affinities: kami.affinities,
                        stats: kami.stats,
                        finalStats: kami.final_stats,
                        currentHealth: kami.current_health,
                        traits: kami.traits,
                        automation: {
                            autoHarvestEnabled: profile.auto_harvest_enabled,
                            harvestNodeIndex: profile.harvest_node_index,
                            autoCollectEnabled: profile.auto_collect_enabled,
                            autoRestartEnabled: profile.auto_restart_enabled,
                            minHealthThreshold: profile.min_health_threshold,
                            harvestDuration: profile.harvest_duration,
                            restDuration: profile.rest_duration,
                            isCurrentlyHarvesting: isHarvesting
                        },
                        lastSynced: kami.last_synced
                    };
                } catch (error) {
                    console.error(`Error getting profile for kamigotchi ${kami.id}:`, error);
                    return null;
                }
            })
        );

        // Filter out nulls
        const validKamigotchis = kamigotchisWithProfiles.filter(k => k !== null);

        return res.json({
            kamigotchis: validKamigotchis
        });
    } catch (error) {
        console.error('Error getting kamigotchis:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get kamigotchis'
        });
    }
});

/**
 * DELETE /api/kamigotchis/:id
 * Delete a kamigotchi from Supabase
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Missing kamigotchi ID'
            });
        }

        await deleteKamigotchi(id);

        return res.json({
            success: true
        });
    } catch (error) {
        console.error('Error deleting kamigotchi:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete kamigotchi'
        });
    }
});

/**
 * PATCH /api/kamigotchis/:id/automation
 * Update automation settings for a kamigotchi
 * 
 * Body can include any of:
 * - autoHarvestEnabled: boolean
 * - harvestNodeIndex: number
 * - autoCollectEnabled: boolean
 * - autoRestartEnabled: boolean
 * - minHealthThreshold: number
 */
router.patch('/:id/automation', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return res.status(400).json({
                error: 'Missing kamigotchi ID'
            });
        }

        // Map frontend field names to database column names
        const dbUpdates: any = {};
        if (updates.autoHarvestEnabled !== undefined) dbUpdates.auto_harvest_enabled = updates.autoHarvestEnabled;
        if (updates.harvestNodeIndex !== undefined) dbUpdates.harvest_node_index = updates.harvestNodeIndex;
        if (updates.autoCollectEnabled !== undefined) dbUpdates.auto_collect_enabled = updates.autoCollectEnabled;
        if (updates.autoRestartEnabled !== undefined) dbUpdates.auto_restart_enabled = updates.autoRestartEnabled;
        if (updates.minHealthThreshold !== undefined) dbUpdates.min_health_threshold = updates.minHealthThreshold;
        if (updates.harvestDuration !== undefined) dbUpdates.harvest_duration = updates.harvestDuration;
        if (updates.restDuration !== undefined) dbUpdates.rest_duration = updates.restDuration;

        const profile = await updateKamiProfile(id, dbUpdates);

        return res.json({
            success: true,
            automation: {
                autoHarvestEnabled: profile.auto_harvest_enabled,
                harvestNodeIndex: profile.harvest_node_index,
                autoCollectEnabled: profile.auto_collect_enabled,
                autoRestartEnabled: profile.auto_restart_enabled,
                minHealthThreshold: profile.min_health_threshold,
                harvestDuration: profile.harvest_duration,
                restDuration: profile.rest_duration
            }
        });
    } catch (error) {
        console.error('Error updating automation:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update automation'
        });
    }
});

/**
 * POST /api/kamigotchis/:id/harvest/start
 * Start harvesting (uses stored private key)
 * 
 * Body:
 * - nodeIndex?: number (optional, uses automation setting if not provided)
 */
router.post('/:id/harvest/start', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nodeIndex } = req.body;

        if (!id) {
            return res.status(400).json({
                error: 'Missing kamigotchi ID'
            });
        }

        // Get kamigotchi
        const kami = await getKamigotchiById(id);
        if (!kami) {
            return res.status(404).json({
                error: 'Kamigotchi not found'
            });
        }

        // Get automation profile for node index if not provided
        let harvestNodeIndex = nodeIndex;
        if (harvestNodeIndex === undefined) {
            const profile = await getOrCreateKamiProfile(kami.id, kami.operator_wallet_id);
            harvestNodeIndex = profile.harvest_node_index || kami.room_index || 0;
        }

        // Decrypt private key
        const privateKey = decryptPrivateKey(kami.encrypted_private_key);

        // Start harvest
        const result = await startHarvest({
            kamiId: kami.kami_entity_id,
            nodeIndex: harvestNodeIndex,
            privateKey
        });

        if (result.success) {
            // Update profile
            await updateKamiProfile(kami.id, {
                is_currently_harvesting: true,
                last_harvest_start: new Date().toISOString(),
                auto_harvest_enabled: true // Enable automation when started manually via UI
            });

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
        console.error('Error starting harvest:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to start harvest'
        });
    }
});

/**
 * POST /api/kamigotchis/:id/harvest/stop
 * Stop harvesting (uses stored private key)
 */
router.post('/:id/harvest/stop', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Missing kamigotchi ID'
            });
        }

        // Get kamigotchi
        const kami = await getKamigotchiById(id);
        if (!kami) {
            return res.status(404).json({
                error: 'Kamigotchi not found'
            });
        }

        // Decrypt private key
        const privateKey = decryptPrivateKey(kami.encrypted_private_key);

        // Stop harvest
        const result = await stopHarvestByKamiId(kami.kami_entity_id, privateKey);

        if (result.success) {
            // Update profile
            await updateKamiProfile(kami.id, {
                is_currently_harvesting: false,
                auto_harvest_enabled: false // Disable automation when stopped manually via UI
            });

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
        console.error('Error stopping harvest:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to stop harvest'
        });
    }
});

/**
 * POST /api/kamigotchis/:id/harvest/auto
 * Toggle auto-harvest
 * 
 * Body:
 * - enabled: boolean
 */
router.post('/:id/harvest/auto', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        if (!id) {
            return res.status(400).json({
                error: 'Missing kamigotchi ID'
            });
        }

        if (enabled === undefined) {
            return res.status(400).json({
                error: 'Missing required field: enabled'
            });
        }

        // Update automation profile
        const profile = await updateKamiProfile(id, {
            auto_harvest_enabled: enabled
        });

        // Fetch kamigotchi to get kami_index and user_id for logging
        const kami = await getKamigotchiById(id);
        if (kami) {
            await logSystemEvent({
                user_id: kami.user_id,
                kami_index: kami.kami_index,
                kami_profile_id: profile.id,
                action: enabled ? 'start_auto_harvest' : 'stop_auto_harvest',
                status: 'success',
                message: enabled ? `Auto-harvest ENABLED for Kami #${kami.kami_index}.` : `Auto-harvest DISABLED for Kami #${kami.kami_index}.`
            });
        }

        return res.json({
            success: true,
            autoHarvestEnabled: profile.auto_harvest_enabled
        });
    } catch (error) {
        console.error('Error toggling auto-harvest:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to toggle auto-harvest'
        });
    }
});

export default router;

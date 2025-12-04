import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import { getKamiByIndex } from './kamiService.js';
import { getSystemAddress } from './transactionService.js';
import { walletMutex } from '../utils/walletMutex.js';

const World = loadAbi('World.json');
// ... existing code ...

export async function moveAccount(privateKey: string, roomIndex: number): Promise<MoveResult> {
    const wallet = new ethers.Wallet(privateKey, provider);

    return walletMutex.runExclusive(wallet.address, async () => {
        try {
            // Use encodedID from systems.json for AccountMoveSystem
            // Verify key in systems.json
            const systemId = (systems as any).AccountMoveSystem.encodedID;
            const systemAddress = await getSystemAddress(systemId);
            
            const AccountMoveSystemABI = loadAbi('AccountMoveSystem.json');
            const contract = new ethers.Contract(systemAddress, AccountMoveSystemABI.abi, wallet);

            console.log(`[Account] Moving account to Room #${roomIndex}`);
            
            // executeTyped(uint32 roomIndex)
            const tx = await contract.executeTyped(BigInt(roomIndex), { gasLimit: 2000000 });
            console.log(`[Account] Move Tx submitted: ${tx.hash}`);
            
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                return { success: true, txHash: tx.hash };
            } else {
                return { success: false, error: 'Transaction reverted' };
            }
        } catch (error: any) {
            console.error('[Account] Move failed:', error);
            return { success: false, error: error.message };
        }
    });
}
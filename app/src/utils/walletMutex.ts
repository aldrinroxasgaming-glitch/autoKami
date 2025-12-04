
export class WalletMutex {
    private queues: Map<string, Promise<void>> = new Map();

    /**
     * Executes a task exclusively for a given wallet address.
     * Ensures that only one transaction/task runs at a time for this wallet.
     */
    async runExclusive<T>(walletAddress: string, task: () => Promise<T>): Promise<T> {
        const normalizedAddress = walletAddress.toLowerCase();
        
        // Get the current tail of the queue for this wallet
        const previousTask = this.queues.get(normalizedAddress) || Promise.resolve();

        // Create a new task that waits for the previous one
        const currentTask = previousTask.then(async () => {
            try {
                return await task();
            } catch (error) {
                throw error;
            }
        });

        // Update the queue tail. We catch errors here so the queue doesn't stall on failure.
        const nextQueue = currentTask.then(() => {}).catch(() => {});
        this.queues.set(normalizedAddress, nextQueue);

        // Clean up map entry when queue is empty to prevent memory leaks (optional but good)
        // For simplicity, we just leave the resolved promise.

        return currentTask;
    }
}

export const walletMutex = new WalletMutex();

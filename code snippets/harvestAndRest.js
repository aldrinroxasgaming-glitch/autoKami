
importScripts(`${self.location.origin}/libraries/ethers6.umd.min.js`);
importScripts(`${self.location.origin}/libraries/moment.min.js`);
const kamiIdentifier = formFields['kamiIdentifier'].trim();
const harvestRoom = formFields['harvestRoom'];
const harvestTime = Math.max(parseInt(formFields['harvestTime']), 5); // Minimum 5 minutes
const restTime = Math.max(parseInt(formFields['restTime']), 5);       // Minimum 5 minutes
let scheduleTime = 10;
const cooldownDelay = 200; // Cooldown delay in seconds before stopping harvest after any action
const playerFeedItemIds = Array.isArray(formFields['playerFeedItemIds']) ? formFields['playerFeedItemIds'].map(id => parseInt(id)) : [];
let enableLevelup = formFields['enableLevelup'] || false;


const SCHEMA = 'indexeddb_';
const provider = new ethers.JsonRpcProvider('https://jsonrpc-yominet-1.anvil.initia.xyz');
const chain = {
    id: 428962654539583,
    name: 'Yominet-1',
    network: 'Yominet-1',
    rpcUrls: {
        default: {
            http: ['https://jsonrpc-yominet-1.anvil.initia.xyz'], // Replace with your RPC URL
        },
    },
}

// ABI for World and Systems contracts
const worldAbi = [
    "function systems() public view returns (address)", // Fetch systems component address
];

const systemsAbi = [
    "function getEntitiesWithValue(bytes value) external view returns (uint256[])" // Fetch entities with a value
];
const worldAddress = "0x2729174c265dbbd8416c6449e0e813e88f43d0e7";

let contracts = {
    'harvestStartSystem': {
        "systemId": "0x889a517f187477a50ab38d2b87c697dd40cb524faa7a48fe1ce59620bb8d6203",
        "abi": [
            //"function executeTyped(uint256 kamiID, uint256 nodeID) returns (bytes)",
            "function executeTyped(uint256 kamiID, uint32 nodeIndex, uint256 taxerID, uint256 taxAmt) returns (bytes)"
        ],
        "address": "0xec3536b88d47280b4f31a515f204036346c05adc"
    },
    'harvestStopSystem': {
        "systemId": "0x2ce6930d030ce775e29350c0200df30632bef67d7b0c72df15cbe7b4be763912",
        "abi": [
            "function executeTyped(uint256 ID) returns (bytes)"
        ],
        "address": "0x42c633d016e23ffff9e9aa5421705432393e4d93"
    },
    'harvestCollectSystem': {
        "systemId": "0x8493c9d75b152fc52d462c6389b227634dbf7dab0534ecb90e9cc85ad4e98145",
        "abi": [
            "function executeTyped(uint256 petID) returns (bytes)"
        ],
        "address": "0x637c29bebde9ce1f5622e5666401d7e1b5046777"
    },
    'moveSystem': {
        "systemId": "0xf9b303531494d4003467a5e0d14c8770502040183c6facf992ad01c7e317eaab",
        "abi": [
            "function executeTyped(uint32 id) returns (bytes)"
        ],
        "address": "0x5317e8106abe68990277e61f8e0fa39a0e0b9f42"
    },
    'playerFeedSystem': {
        "systemId": "0x02594d17a5ffc4ba72c65c5616374156e960547eac12113df1f60b0b21d9e2d5",
        "abi": [
            "function executeTyped(uint32,uint256) returns (bytes)"
        ],
        "address": "0x3a4252905019b4e4de4b8f784e4b34385536c038"
    },
    'kamiLevelSystem': {
        "systemId": "0x5b84b4f4f45a066d7e7527ce4cf36c4c8a56da7c1b163d1139e1934b9f2d3a23",
        "abi": [
            "function executeTyped(uint256) returns (bytes)"
        ],
        "address": "0x93a5fcf1e394fa61e6801f925c25101725e8e154"
    },
    'scavengeClaimSystem': {
        "systemId": "0x688e3fa170b8b4e4646c37eeea4c877c977d801ff735c03cec4eb263a8be10c5",
        "abi": [
            "function executeTyped(uint256) returns (bytes)"
        ],
        "address": "0x7b0d9136efbd8777cbef36f77378c04afb395c74"
    },
}

if (!kamiIdentifier || !harvestRoom || !harvestTime || !restTime) {
    YeomenAI.statusMessage('Please ensure formFields are filled', YeomenAI.MESSAGE_TYPES.ERROR);
    YeomenAI.exit(1);
}

let nodes = [];
let scavenges = [];
let grid = Array.from({ length: 13 }, () => Array(9).fill(null));
const kamiStats = {};
let kamiHarvestRooms = {};
const lastStartedTime = {};
const lastStoppedTime = {};
const lastActionTime = {};
const lowBalance = { threshold: 0.001, alertSent: false };

// Helper function to fetch data
const fetchTupleData = async (key, value) => {
    const query = `
        query GetTupleData {
          ${SCHEMA}tuple_data(where: {${key}: {_eq: "${value}"}}) {
            component
            entity
            value
          }
        }
    `;
    const result = await YeomenAI.getQueryData(query);
    return result[`${SCHEMA}tuple_data`] || [];
};

const fetchNodes = async () => {
    const query = `
        query GetTupleData {
          ${SCHEMA}tuple_data(where: {component: {_eq: "0x5d88ced8d8e079072bf73f49fc87661b519c50d79482941abb852ba2b10909cd"},  value: { _eq: "NODE" }}) {
            component
            entity
            value
          }
        }
    `;
    const result = await YeomenAI.getQueryData(query);
    return result[`${SCHEMA}tuple_data`] || [];
};

const fetchRooms = async () => {
    const query = `
        query GetTupleData {
          ${SCHEMA}tuple_data(where: {component: {_eq: "0x5d88ced8d8e079072bf73f49fc87661b519c50d79482941abb852ba2b10909cd"},  value: { _eq: "ROOM" }}) {
            component
            entity
            value
          }
        }
    `;
    const result = await YeomenAI.getQueryData(query);
    return result[`${SCHEMA}tuple_data`] || [];
};

const fetchScavenges = async () => {
    const query = `
        query GetTupleData {
          ${SCHEMA}tuple_data(where: {component: {_eq: "0x5d88ced8d8e079072bf73f49fc87661b519c50d79482941abb852ba2b10909cd"},  value: { _eq: "SCAVENGE" }}) {
            component
            entity
            value
          }
        }
    `;
    const result = await YeomenAI.getQueryData(query);
    return result[`${SCHEMA}tuple_data`] || [];
};

const fetchPlayerRecord = async (address) => {
    try {
        const response = await fetch(`${YeomenAI.BACKEND_URL}/api/v1/bots/kamigotchi/account/${address}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Player Record:', data);
        return data;
    } catch (error) {
        console.error('Error fetching player record:', error.message);
        return null;
    }
};

async function getBalance(address) {
    try {
        const balance = await provider.getBalance(address);
        const etherString = ethers.formatEther(balance);
        console.log(`Balance of ${address}: ${etherString} ETH`);
        return etherString;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

async function getHarvestIdFromReceipt(txHash) {
    try {
        console.log('⏳ Waiting for transaction to be mined...');
        const receipt = await provider.waitForTransaction(txHash);

        if (receipt && receipt.blockNumber) {
            console.log('✅ Transaction mined in block:', receipt.blockNumber);

            const logs = receipt.logs;

            // Target topic to match in the log (typically the event signature hash - StartTime)
            const targetTopic = '0x9ee42634d52dbd5a24ad226010389fb7306af59bdaec5e20547162dd896dacad';

            for (const log of logs) {
                if (log.topics && log.topics[1] === targetTopic) {
                    const harvestId = log.topics[3]; // topics[3] is the fourth indexed topic
                    console.log('🌾 Harvest ID found:', harvestId);
                    return harvestId;
                }
            }

            console.warn('⚠️ No matching log entry found for target topic.');
            return null;
        } else {
            console.log('⚠️ Transaction not yet mined or not found.');
            return null;
        }
    } catch (err) {
        console.error('❌ Error waiting for transaction:', err);
        return null;
    }
}


// Helper function to execute and handle gas estimation
const executeContractFunction = async (method, params, successMessage, errorMessage, options = {}) => {
    try {
        const { estimate = false } = options;

        let contract = contracts[method];
        if (!contract) {
            throw new Error('Contract not found');
        }


        let accountAddress = (YeomenAI.ACCOUNT.address).toLowerCase();
        const ethersContract = new ethers.Contract(contract.address, contract.abi, provider);

        //const nonce = await provider.getTransactionCount(accountAddress, "latest");
        const nonce = await YeomenAI.getNonce({ chain, address: accountAddress });

        const data = ethersContract.interface.encodeFunctionData("executeTyped", params);

        let gasEstimate;
        try {
            gasEstimate = await provider.estimateGas({
                to: contract.address,
                from: accountAddress,
                data: data
            });
        } catch (gasError) {
            console.log(gasError)
            if (estimate) {
                return [false, gasError];
            } else {
                throw gasError;
            }
        }
        const feeData = await provider.getFeeData();

        let preparedTx = {
            type: 0,
            to: contract.address,
            data: data,
            chainId: chain.id,
            gasLimit: ethers.toBigInt(gasEstimate) + 20000n, // Set a high enough gas limit   
            gasPrice: ethers.toBigInt(feeData.gasPrice ?? 1000000000n),
            gas: ethers.toBigInt(gasEstimate) + 20000n,
            nonce: BigInt(nonce),
            value: 0n
        };
        console.log(preparedTx)
        //const signedTx = await YeomenAI.signTransaction({ tx: preparedTx, chain, abi: contract.abi });
        //console.log(signedTx)
        //const txResponse = await provider.broadcastTransaction(signedTx);
        const txResponse = await YeomenAI.signBroadcastTransaction({ tx: preparedTx, chain, abi: contract.abi });
        console.log("Transaction sent! Hash:", txResponse);
        YeomenAI.statusMessage(successMessage, YeomenAI.MESSAGE_TYPES.SUCCESS);
        return [true, txResponse];
    } catch (err) {
        YeomenAI.statusMessage(`${errorMessage}: ${err.message}`, YeomenAI.MESSAGE_TYPES.ERROR);
        return [false, err];
    }
};

// Display Kami stats
const displayKamiStats = async (kamiStats) => {
    let markdown = `#### Kami Stats\n`;
    markdown += `| Kami Name          | Level&nbsp;&nbsp;&nbsp;      | Status      | Room      | Health (%) | Harvests | Rests |\n`;
    markdown += `|--------------------|---------------|-------------|-----------|------------|------------|------------|\n`;

    for (const [key, { kami, stats }] of Object.entries(kamiStats)) {
        const totalHealth = kami.stats.health.base + kami.stats.health.shift + kami.stats.health.boost;
        const healthPercentage = ((kami.stats.health.sync / totalHealth) * 100).toFixed(2);
        const node = nodes.find((node) => node.room == kami.room);

        let totalHarvest = stats.total_harvest;
        let totalRest = stats.total_rest;
        if (kami.state == 'HARVESTING') {
            totalHarvest = Math.max(0, totalHarvest - 1);
        } else if (kami.state == 'RESTING') {
            totalRest = Math.max(0, totalRest - 1);
        }

        const totalHarvestDuration = moment.duration(totalHarvest * harvestTime, 'minutes');
        const totalRestDuration = moment.duration(totalRest * restTime, 'minutes');

        markdown += `| ${kami.name || 'N/A'}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;             | ${kami.level || 'N/A'}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;    | ${kami.state || 'Unknown'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;   | ${node ? node.name : 'N/A'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;   | ${healthPercentage}% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;    | ${totalHarvest} (${String(Math.floor(totalHarvestDuration.asHours()))}h ${String(totalHarvestDuration.minutes())}m) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;    | ${totalRest} (${String(Math.floor(totalRestDuration.asHours()))}h ${String(totalRestDuration.minutes())}m) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;    |\n`;
    }

    markdown += ` \n\n\n\n`;
    markdown += `NB: The displayed health percentage may not be accurate. It will only reflect the correct value after a recent on-chain transaction.`;

    await YeomenAI.markdown(markdown);
};

function findPath(grid, source, destination) {
    // Directions for up, down, left, and right movements
    const directions = [
        [-1, 0], // up
        [1, 0],  // down
        [0, -1], // left
        [0, 1]   // right
    ];

    // Find the source and destination coordinates
    let start = null;
    let end = null;
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            //if (grid[i][j] === source) start = [i, j];
            //if (grid[i][j] === destination) end = [i, j];
            if (grid[i][j] && grid[i][j].includes(source)) start = [i, j];
            if (grid[i][j] && grid[i][j].includes(destination)) end = [i, j];
        }
    }

    if (!start || !end) {
        console.log('Source or destination not found');
        return [];
    }

    // BFS setup
    const queue = [start];  // Queue for BFS
    const visited = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false));
    visited[start[0]][start[1]] = true;

    const parent = {}; // To reconstruct the path

    while (queue.length > 0) {
        const [x, y] = queue.shift(); // Get the current cell

        // If we reach the destination, reconstruct the path
        if (x === end[0] && y === end[1]) {
            const path = [];
            let current = end;
            while (current) {
                const [cx, cy] = current;
                //if (grid[cx][cy] !== source) {  // Exclude the source value from the path
                path.unshift(grid[cx][cy]);  // Push the value (not coordinates)
                //}
                current = parent[current];
            }
            return path;
        }

        // Explore the four possible directions
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            // Check if the neighbor is within bounds and is not visited or blocked (null)
            if (
                nx >= 0 && nx < grid.length &&
                ny >= 0 && ny < grid[0].length &&
                grid[nx][ny] !== null && !visited[nx][ny]
            ) {
                visited[nx][ny] = true;
                parent[`${nx},${ny}`] = [x, y];  // Track the parent for path reconstruction
                queue.push([nx, ny]);  // Add the neighbor to the queue
            }
        }
    }

    // Return an empty array if no path was found
    console.log('No path found');
    return [];
}


const simulateGame = async () => {
    try {
        YeomenAI.statusMessage('Fetching player and kami details...');

        // Initialize the World contract
        const worldContract = new ethers.Contract(worldAddress, worldAbi, provider);
        // Fetch the systems component address
        const systemsAddress = await worldContract.systems();
        // Initialize the Systems component contract
        const systemsContract = new ethers.Contract(systemsAddress, systemsAbi, provider);

        for (let contractKey of Object.keys(contracts)) {
            let contract = contracts[contractKey];
            let entities = await systemsContract.getEntitiesWithValue(contract.systemId);
            contract.address = ethers.toBeHex(entities[0]);
        }

        await displayKamiStats(kamiStats);

        // if (nodes.length == 0) {
        //     YeomenAI.statusMessage('Fetching rooms...');
        //     let nodesRecords = await fetchRooms();
        //     for (let nodesRecord of nodesRecords) {
        //         const nodeRecords = await fetchTupleData('entity', nodesRecord.entity);

        //         const nodeRoomRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x3be9611062b8582cf4b9a4eafe577dbde7dcd7779a1efb46d73e212026c4b0cc');
        //         const nodeNameRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x2acf3c3c6b18ed6530ed0fd161fd0b65f4febe79d1182824d3263e852d29ca03');
        //         // const nodeIndexRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x076fae2ce684ff843e499be243657d8fb16b0eb71350c7a9da8fa7be44c14f3e');
        //         const nodeLocationRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x1d80d8bc36212886f1cd16bb0e8f17892d2237a9ad83cebdcec1f76b3c52d19f');

        //         nodes.push({ entity: nodesRecord.entity, room: nodeRoomRecord.value, name: nodeNameRecord.value, /*index: nodeIndexRecord.value,*/ location: nodeLocationRecord?.value });

        //         // Extract x, y, z from the hex string
        //         let x = parseInt(nodeLocationRecord?.value.slice(2, 4), 16);
        //         let y = parseInt(nodeLocationRecord?.value.slice(18, 20), 16);
        //         let z = parseInt(nodeLocationRecord?.value.slice(34, 36), 16);

        //         //Case to match Convenience Store
        //         if (nodeRoomRecord.value == 13) {
        //             x = 3;
        //         }

        //         if (x && y) {
        //             grid[y - 1][x] = grid[y - 1][x] || [];
        //             grid[y - 1][x][z - 1] = nodeRoomRecord.value;
        //         }
        //     }
        // }

        nodes = [{ "entity": "0x62c7994b219e50054c44b1d2c7adc987412e70edd479735e1b565c315eab6ec1", "room": "1", "name": "Misty Riverside", "location": "0x0300000000000000010000000000000001" }, { "entity": "0x5904ff60975a2b8cf7c34195bb7b05b99a178a1b1e0e81d493c8c27060b3e174", "room": "0", "name": "deadzone", "location": "0x00" }, { "entity": "0x9a657dc452878223a39c2fb4c5857954863397deeb2ea213c4471648bb15072c", "room": "2", "name": "Tunnel of Trees", "location": "0x0300000000000000030000000000000001" }, { "entity": "0x99ad3f1a512def7420cb3f1ebb936fcc35cfa42af9c8ea9546d28ca2d546c168", "room": "6", "name": "Labs Entrance", "location": "0x04000000000000000a0000000000000001" }, { "entity": "0xe0dd5e85c1d2008b57c4e22a05d1c092fb6cc9948967df50267f4ad7f459b99b", "room": "13", "name": "Convenience Store", "location": "0x0400000000000000030000000000000002" }, { "entity": "0x776b93e45d845bd1be0bc1bbabb1684e741b8c497379d76b7e8bee27460d3547", "room": "9", "name": "Forest: Old Growth", "location": "0x0500000000000000080000000000000001" }, { "entity": "0x25cf6187beac6c4447fba9ec74c396d5ac652e0ba2d2a030fb84ea3d4dd37e58", "room": "11", "name": "Temple by the Waterfall", "location": "0x06000000000000000b0000000000000001" }, { "entity": "0x876109f5b9bee0256db37f6041d5b6a8b15abd51ee33bf0c87c8a8e7de8a2f69", "room": "3", "name": "Torii Gate", "location": "0x0300000000000000040000000000000001" }, { "entity": "0x8fc48ccac13b7e0eeca7e878abefb400bf2fc918ea46b2a1c132428cd99d678b", "room": "5", "name": "Restricted Area", "location": "0x0300000000000000090000000000000001" }, { "entity": "0x98e93ff66a944e28be795cb2fcfd3c1b8d2de8f7972d517f4887703a544d7087", "room": "10", "name": "Forest: Insect Node", "location": "0x0500000000000000050000000000000001" }, { "entity": "0x928572a8441a3bd9e78a05202412ea62b3627bc1331da0095aaaf8128e2630b2", "room": "4", "name": "Vending Machine", "location": "0x0300000000000000060000000000000001" }, { "entity": "0x41db086cbeff1e77b994158c8a768829eaee9a5c0c9d9218496bef2b6abf220d", "room": "26", "name": "Trash-Strewn Graves", "location": "0x0200000000000000080000000000000001" }, { "entity": "0xaa3a9a68a43437e7840b64409ddbb1f5b706e491a2b5231a55612957dce1a28a", "room": "33", "name": "Forest Entrance", "location": "0x0400000000000000080000000000000001" }, { "entity": "0x7fb9d9c13842e0d9d7459cc645bda9540810679fc14962cf195b7385b0efabff", "room": "32", "name": "Road To Labs", "location": "0x03000000000000000a0000000000000001" }, { "entity": "0x94a9e4d788088def528096d79ba26938d084a49e3f0f8e52f44c17da0afa5ea9", "room": "34", "name": "Deeper Into Scrap", "location": "0x0200000000000000060000000000000001" }, { "entity": "0x5600958e463423e51d5cf9b8983d14fe6127ee012e7e965cbc401f7d5598e5ee", "room": "30", "name": "Scrapyard Entrance", "location": "0x0300000000000000050000000000000001" }, { "entity": "0x4f946582729eeca591019f5be312db3371667f2437328dfba4e9a35ab27bd2d9", "room": "35", "name": "Elder Path", "location": "0x0500000000000000060000000000000001" }, { "entity": "0x655d58ec3dc0bb497789e6d9ad0d7af8ded24f5f0cf1510d25292f88e8546317", "room": "31", "name": "Scrapyard Exit", "location": "0x0300000000000000080000000000000001" }, { "entity": "0x5ed5b7f0ca08a2037890a9ba3a92e5922c9dfc5603f66d0da523b699ef606081", "room": "29", "name": "Misty Forest Path", "location": "0x0300000000000000020000000000000001" }, { "entity": "0x7acb36aace1e20e0145433ed0d9920cebac76eba2983b8b7f9787639cd915a01", "room": "25", "name": "Lost Skeleton", "location": "0x0600000000000000090000000000000001" }, { "entity": "0x5eff947178d9f571474a88a4bf594d20ebd049fd55911f7704d8da3413b8d738", "room": "36", "name": "Parting Path", "location": "0x0500000000000000090000000000000001" }, { "entity": "0x13e059a6697ff638dd323ee90a5615a81a8e237d57e54ca55c89b1d8e87e622e", "room": "50", "name": "Ancient Forest Entrance", "location": "0x0600000000000000050000000000000001" }, { "entity": "0x870ff5ce93944649d8a5ae5d69d909ffad3a8064e692463f817fd134731c1f25", "room": "47", "name": "Scrap Paths", "location": "0x0300000000000000070000000000000001" }, { "entity": "0x145e8bf9e3eee25a0a2d5c1d33609f3fc8c12fd0643fb9f7827f1f8d55753ed6", "room": "48", "name": "Steps", "location": "0x0500000000000000070000000000000001" }, { "entity": "0x92af3965bc85804e82ba971d4bcd330cde53fe2565be4a242b9776057766a964", "room": "49", "name": "Clearing", "location": "0x0700000000000000090000000000000001" }, { "entity": "0xd9ae0925084f3614ac08115033fac0a790a20c6e6917962f46a13c6ffe1b1131", "room": "37", "name": "Hollow Path", "location": "0x06000000000000000a0000000000000001" }, { "entity": "0xc8573960bd286a0bfef1a9a1789232546de32ae6a4606219634a7b58e7ca9a72", "room": "52", "name": "Airplane Crash", "location": "0x0800000000000000050000000000000001" }, { "entity": "0xaa4a6911abe1a1692d3dd4446df2d68acbd7d8c42ce67af3ca86512d96033630", "room": "51", "name": "Scrap-Littered Undergrowth ", "location": "0x0700000000000000050000000000000001" }, { "entity": "0x657ed41e476925564d9d65bf45946af435fd54ebc4078cda2041f311be6b0d56", "room": "53", "name": "Blooming Tree", "location": "0x0700000000000000040000000000000001" }, { "entity": "0x2dda2c8bee2c28065bb9ae45a394505a2f77f0cad140ddc6efc9b2ef07f7bf2d", "room": "62", "name": "Centipedes", "location": "0x0800000000000000010000000000000001" }, { "entity": "0xcaf97afcc374f4fb226a097b18b63870a40e7faa7281808962af24e746f6cb98", "room": "57", "name": "River Crossing", "location": "0x0600000000000000030000000000000001" }, { "entity": "0x18621dc99fdf0816de4fbf34f1a250da1b489a29940a615b03f06e6c9a8084a1", "room": "56", "name": "Butterfly Forest", "location": "0x0500000000000000030000000000000001" }, { "entity": "0x076a31847ee749205b34a05d91ddebe33c3cf1f599279f0ef5b25cac9e689397", "room": "60", "name": "Scrap Trees", "location": "0x0500000000000000010000000000000001" }, { "entity": "0x2d5b9b1a7715849d43fc9dda6653d9f6e0b6fc7435985b9b8e4af9f492b7abe8", "room": "63", "name": "Deeper Forest Path", "location": "0x0600000000000000020000000000000001" }, { "entity": "0x6eb1666adb676ba500208a5fca3fb076bbf206302321a51a03c068eed66b2be7", "room": "54", "name": "Plane Interior", "location": "0x0800000000000000050000000000000002" }, { "entity": "0xe98d47953dae5b2a22acb2713d63132f702e48e3a84bd0cb7de57aa900ccfa19", "room": "65", "name": "Forest Hut ", "location": "0x0600000000000000010000000000000001" }, { "entity": "0x8f9b65f256241e353c8aed73a2279480c9f45afdb873502bab9e966fe65b19d9", "room": "55", "name": "Shady Path ", "location": "0x0400000000000000030000000000000001" }, { "entity": "0x4a3c3a00acb76e6afa486b18bdfa7f18f1514b036f9ff455d91a6ed60f43636e", "room": "61", "name": "Musty Forest Path", "location": "0x0700000000000000010000000000000001" }, { "entity": "0x8310f544a2bb233bd733277591a24fb39e06035f00c97d5e1ab485a4cfebe62b", "room": "66", "name": "Marketplace", "location": "0x0200000000000000020000000000000001" }, { "entity": "0x1445f7967fdd88e04d68938cf6dd4f867f0a24e2d06baf569e88efc643c2b87c", "room": "64", "name": "Burning Room", "location": "0x0500000000000000050000000000000002" }, { "entity": "0x938425bcc499028088728cf40d025bd1ad8335906dab88bb5fb69ac7438589bb", "room": "12", "name": "Scrap Confluence", "location": "0x0100000000000000060000000000000001" }];
        grid = [[null, null, null, ["1"], null, ["60"], ["65"], ["61"], ["62"]], [null, null, ["66"], ["29"], null, null, ["63"], null, null], [null, null, null, ["2", "13"], ["55"], ["56"], ["57"], null, null], [null, null, null, ["3"], null, null, null, ["53"], null], [null, null, null, ["30"], null, ["10", "64"], ["50"], ["51"], ["52", "54"]], [null, ["12"], ["34"], ["4"], null, ["35"], null, null, null], [null, null, null, ["47"], null, ["48"], null, null, null], [null, null, ["26"], ["31"], ["33"], ["9"], null, null, null], [null, null, null, ["5"], null, ["36"], ["25"], ["49"], null], [null, null, null, ["32"], ["6"], null, ["37"], null, null], [null, null, null, null, null, null, ["11"], null, null], [null, null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null, null]];


        //console.log('nodes', nodes);
        //console.log('grid', grid);

        // if (scavenges.length == 0) {
        //     let scavengesRecords = await fetchScavenges();
        //     for (let scavengesRecord of scavengesRecords) {
        //         const scavengeRecords = await fetchTupleData('entity', scavengesRecord.entity);
        //         const indexRecord = scavengeRecords.find((rec) => rec.component == '0x62adc4221185187a288916c2630b5e1f37e9437c5b68d55bc59b9debc23f19d0');

        //         scavenges.push({ entity: scavengesRecord.entity, index: indexRecord.value });
        //     }
        // }

        scavenges = [{ "entity": "0xc6b32d20bb3c8309537fd863726060d116fdb852cdb3360b6bf2ddddf2013473", "index": "1" }, { "entity": "0x6547c3eeff88384cbc0b55d9c8d1db889f7548b7ea74ba469b6179d7a97b8195", "index": "2" }, { "entity": "0xa28bd75bed533fa4f828a19d9a51b20a08ed40351f0d1244a5d7380bcf79340a", "index": "3" }, { "entity": "0xd7c514bfe8e7cb4256384641975467b10130d5167dfe17b06da7a44ea8701165", "index": "5" }, { "entity": "0x9010a48d44e187537e12bb8da907059affdf143751de489988dfef1284508d3b", "index": "6" }, { "entity": "0x99834d65d3a0363365e4be44ebcc303597883522e82d19b2eef6c53b081c6e81", "index": "9" }, { "entity": "0x242505053f4ffffc001f2fd4e84e89f22040f80b1461e09740a23b7bbaf9d518", "index": "25" }, { "entity": "0x6e9d2e6fe088067102d99524795781ae69bc1d0d2abaa16c9087ffc86bc04aff", "index": "26" }, { "entity": "0xd2247e7b802ac70909f34b5fab39dd162a9ec89c71062d510ed22bdfc6ec04cb", "index": "29" }, { "entity": "0x052b6bf22324472de90d95626eaf925c60317e2bb598f0d370d43af789bdc32e", "index": "31" }, { "entity": "0x40dc5f56de294dd964bf0e881950b15012424d92d303d1fa65bc58a80042e4fb", "index": "30" }, { "entity": "0x9930b8fc064c7c8cc86459ab5634310f1eb3b2bddd46de75ec4468008bfe6b86", "index": "32" }, { "entity": "0xe4d5978ef11f093394ac6f4b2888a3112061ab519ccc30b129381846d920cb44", "index": "33" }, { "entity": "0xc3e165e2cb8c66a3be4f39cc82bccb17391b4170d04e2496c386a10fbc5898dd", "index": "34" }, { "entity": "0xec2759b943acbf7eadd72684df29c180483c4a3d1ccba40f23bb7f9b455db9dd", "index": "35" }, { "entity": "0x0557786a5268bb29a93ae5e3b68b0765b090d97c839baa2818fb911948f6f197", "index": "36" }, { "entity": "0x488eb2f73bb535c99c91167547ac868e4a28bd4e5d5a37b4c9293d72cf4d9ba7", "index": "48" }, { "entity": "0x7270e374c6f6fdc44dcb9e2bf369c7091aa465a481a54015c57767d6f3282c9d", "index": "47" }, { "entity": "0x9cfc4d047c596a15ca855b89e3e5de46dc9df1e2eb9c5008882e759a47cb5fdc", "index": "37" }, { "entity": "0x6a3d63e022314a1beccd2a990bae657f960fc979477038296750365ed1d2c721", "index": "51" }, { "entity": "0xbda5e2d44fdbd2368641ff52bf5858b77b66a352fb9efe28f1702f52bab53666", "index": "50" }, { "entity": "0x6a8c3f2e23fcc1088d7718d7926d1ebfaa1146df81dba2bf3bcaa791520339ce", "index": "49" }, { "entity": "0x2d05842da7b3729c0a941dd36f243f6dd7de62a8abedcafa9d6f37b36669ab18", "index": "52" }, { "entity": "0xd5a65541fef5bdfe911baf29009390b29b1691038741372c468cf062e31311df", "index": "55" }, { "entity": "0xbf2dea03f0481f6b9b7d6eca22a4f4181d6525442481b6948f26c216dd777bf1", "index": "53" }, { "entity": "0xb81c843b0e72a73cd5280170115b20d0bd559232e46a7c71627406d7bb7f80b3", "index": "56" }, { "entity": "0x3b62eeffa9a49120174a1c4dab62d24c596d9089cd5811861f7102782ed4519e", "index": "57" }, { "entity": "0x5723aa0f3ea0235bcaab6bebb3684f2dbd7c61266080d55e6be3248d11c0e9c7", "index": "10" }, { "entity": "0x20c02cfc43ee980a754c588cf021c821adf1ebb6832498286272899100cf5888", "index": "12" }];


        //console.log('scavenges', scavenges);       

        // Get player address
        let playerAddress = (YeomenAI.ACCOUNT.delegator || YeomenAI.ACCOUNT.address).trim().toLowerCase();
        let delegatorAddress = YeomenAI.ACCOUNT.delegator ? YeomenAI.ACCOUNT.delegator.trim().toLowerCase() : null;
        let delegateeAddress = YeomenAI.ACCOUNT.address ? YeomenAI.ACCOUNT.address.trim().toLowerCase() : null;

        // ///////////////Faucet////////////////////
        // async function dripFaucet(address) {
        //     try {
        //         const response = await fetch("https://command-node.yeomen.ai/proxy?target=https://initia-faucet-02.test.asphodel.io/claim", {
        //             method: "POST",
        //             headers: {
        //                 "Content-Type": "application/json"
        //             },
        //             body: JSON.stringify({ address })
        //         });

        //         if (!response.ok) {
        //             throw new Error(`HTTP error! Status: ${response.status}`);
        //         }

        //         const result = await response.json();
        //         console.log("Faucet Response:", result);
        //         return result;
        //     } catch (error) {
        //         console.error("Error in dripFaucet:", error);
        //         return null;
        //     }
        // }

        // // Trigger immediately
        // console.log("Triggering faucet immediately...");
        // await dripFaucet(delegateeAddress);

        // // Wait for 24 hour 
        // setInterval(async () => {
        //     console.log("Triggering faucet after 1 hour...");
        //     await dripFaucet(delegateeAddress);
        // }, 24 * 60 * 60 * 1000);
        // /////////////////////////////////

        /////////////Low balance alert///////////////////////
        let balance = await getBalance(delegateeAddress);
        balance = balance ? Number(balance).toFixed(6) : null; // Format to 6 decimals        
        if (balance && balance < lowBalance.threshold) {
            const message = `Low Balance
        Address: ${delegateeAddress}
        Balance: ${balance} ETH
        
        Please top up to ensure continued operation.`;

            await YeomenAI.telegramAlert(message);
            lowBalance.alertSent = true;
        } else if (balance && balance >= lowBalance.threshold) {
            lowBalance.alertSent = false;
        }
        ///////////////////////////////////////////////////

        const movePlayer = async (source, destination) => {
            source = String(source);
            destination = String(destination);

            if (source == destination) return true;

            const path = findPath(grid, source, destination);

            // Output the path
            if (path.length == 0) {
                YeomenAI.statusMessage('No path found');
                return false;
            }

            const sourceNode = nodes.find((node) => node.room == source);
            const destinationNode = nodes.find((node) => node.room == destination);


            YeomenAI.statusMessage(`Player is not in kami room, moving from: ${sourceNode.name} to: ${destinationNode.name}`);

            let reachedDestination = false;
            for (let rooms of path) {
                if (!rooms.includes(source) && !rooms.includes(destination)) {
                    rooms = [rooms[0]];
                }
                rooms = (source === rooms[0]) ? [] : rooms.filter(room => room !== source);


                for (let room of rooms) {
                    const node = nodes.find((node) => node.room == room);


                    let moved = false, movedResponse = null;
                    let retries = 0;
                    const maxRetries = 3; // Set a maximum number of retries (optional)

                    while (!moved) {
                        let timestamp = new Date().getTime();
                        YeomenAI.statusMessage(`Moving to target: ${node.name}`);

                        [moved, movedResponse] = await executeContractFunction(
                            'moveSystem',
                            [room],
                            `Successfully moved: ${node.name}`,
                            `Failed to move: ${node.name}`
                        );

                        if (!moved) {
                            if (retries >= maxRetries) {
                                YeomenAI.statusMessage(`Max retries reached.`);
                                YeomenAI.exit(1);
                                return;
                            }

                            //If moved error is ""Account: insufficient stamina" then feed player and continue
                            const errorMessage = movedResponse?.info?.error?.message || "";
                            if (errorMessage.includes("Account: insufficient stamina")) {
                                let staminaIncreased = false, staminaIncreasedResponse = null;
                                for (const playerFeedItemId of playerFeedItemIds) {
                                    [staminaIncreased, staminaIncreasedResponse] = await executeContractFunction(
                                        'playerFeedSystem',
                                        [BigInt(playerFeedItemId), BigInt(1)],
                                        `Successfully increased stamina`,
                                        `Failed to increase stamina`
                                    );

                                    if (staminaIncreased)
                                        break;
                                }

                                if (!staminaIncreased && kamisWithHealths[kamiId]['healthStatus'] != YeomenAI.Healthchecks.UNHEALTHY) {
                                    kamisWithHealths[kamiId]['healthStatus'] = YeomenAI.Healthchecks.UNHEALTHY;
                                    await YeomenAI.Healthchecks.health(YeomenAI.Healthchecks.UNHEALTHY, `Kami ${kami.name}, failed increase stamina`);
                                }

                                // Skip the delay if stamina was successfully increased
                                if (staminaIncreased) {
                                    continue; // Retry moving without delay
                                }
                            }


                            //wait 5 minutes and move to same room again
                            YeomenAI.statusMessage(`Waiting 5 minutes before retry moving to target: ${node.name}`);
                            await YeomenAI.delay(5 * 60);

                            retries++;
                        } else {
                            source = String(node.room);
                            await YeomenAI.setStorageItem('current_source', source);
                        }
                    }

                    if (!moved && kamisWithHealths[kamiId]['healthStatus'] != YeomenAI.Healthchecks.UNHEALTHY) {
                        kamisWithHealths[kamiId]['healthStatus'] = YeomenAI.Healthchecks.UNHEALTHY;
                        await YeomenAI.Healthchecks.health(YeomenAI.Healthchecks.UNHEALTHY, `Kami ${kami.name}, failed to move`);
                    }

                    await YeomenAI.delay(5);

                    // Check if the destination is reached
                    if (room == destination) {
                        reachedDestination = true;
                        break;
                    }
                }
                if (reachedDestination) break; // Exit the outer loop if destination is reached
            }

            YeomenAI.statusMessage(`Successfully moved from: ${sourceNode.name} to: ${destinationNode.name}`);
            if (reachedDestination) {
                return true;
            } else {
                return false;
            }
        };

        // Fetch player's Kami IDs
        // const playerRecords = await fetchTupleData('value', playerAddress);
        // const kamiIds = playerRecords
        //     .filter(record => record.component === '0xdb1228220c36234210e3f04b6ac039f5d81c4d6d81f43d9b4a9d70c4d5bcfac1')
        //     .map(record => record.entity);

        let playerRecord = await fetchPlayerRecord(playerAddress.toLowerCase());
        if (!playerRecord) {
            YeomenAI.statusMessage('No record found for the player', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }
        const kamiIds = playerRecord?.kamis?.map(kami => kami.id) || [];

        if (kamiIds.length === 0) {
            YeomenAI.statusMessage('No Kamis found for the player', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }

        let kami;
        let kamiId;
        //Find the matching kami
        for (const _kamiId of kamiIds) {
            console.log('kamiId', _kamiId)
            const _kamiIdDecimal = BigInt(_kamiId).toString();
            const _kami = await YeomenAI.getContractData('getterSystem.getKami', [_kamiIdDecimal]);
            if (_kami.name.toLowerCase() == kamiIdentifier.toLowerCase() || _kami.index == Number(kamiIdentifier) || _kami.index == Number(kamiIdentifier.match(/\d+/)?.[0])) {
                kami = _kami;
                kamiId = _kamiId;
            }
        }

        if (!kami) {
            YeomenAI.statusMessage('No Kami found matching the identifier', YeomenAI.MESSAGE_TYPES.INFO);
            return YeomenAI.exit(0);
        }
        console.log(`Found kami`, kami)

        if (!kamiStats[kamiId]) {
            kamiStats[kamiId] = {
                kami: null,
                stats: { total_harvest: 0, total_rest: 0, total_feed: 0 },
                harvestId: null
            };
        }


        //const playerEntityRecords = await fetchTupleData('entity', playerAddress);
        // const playerRoomRecord = playerEntityRecords.find(
        //     record => record.component === '0x3be9611062b8582cf4b9a4eafe577dbde7dcd7779a1efb46d73e212026c4b0cc'
        // );

        // const playerRoom = playerRoomRecord ? playerRoomRecord.value : null;

        // let playerRecord = await fetchPlayerRecord(playerAddress);
        // if (!playerRecord) {
        //     YeomenAI.statusMessage('No record found for the player', YeomenAI.MESSAGE_TYPES.INFO);
        //     return YeomenAI.exit(0);
        // }

        let playerRoom = playerRecord ? playerRecord.roomIndex : null;
        let playerRoomNode = nodes.find((node) => node.room == playerRoom);



        // Register the shutdown handler
        //let waitForShutdown = false;
        YeomenAI.registerShutdown(async () => {
            console.log('Start registerShutdown callback');

            await new Promise(async (resolve) => {
                YeomenAI.statusMessage(`Wait for shutdown process...`, YeomenAI.MESSAGE_TYPES.INFO);
                let playerRecord = await fetchPlayerRecord(playerAddress);
                let playerRoom = playerRecord ? playerRecord.roomIndex : null;

                if (kami) {

                    const kamiIdDecimal = BigInt(kamiId).toString();
                    const kamiHarvestRecords = await fetchTupleData('value', kamiId);
                    const kamiHarvestRecord = kamiHarvestRecords.find((kamiHarvestRecord) => kamiHarvestRecord.component == '0x5bc28889d745caef68975e56a733199d93efb3f5ae8e4606262ab97c83f72648');

                    //const harvestId = kamiHarvestRecord ? kamiHarvestRecord.entity : null;
                    const harvestId = kamiStats[kamiId]?.harvestId ?? (kamiHarvestRecord ? kamiHarvestRecord.entity : null);

                    let kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
                    kamiStats[kamiId].kami = kami;
                    await displayKamiStats(kamiStats);

                    if (kami.state == 'HARVESTING') {
                        kamiHarvestRooms[kamiId] = kami.room;
                    }

                    const kamiRoom = kamiHarvestRooms[kamiId] || kami.room;

                    if (kami.state == 'HARVESTING') {

                        //Move player
                        if (playerRoom != kamiRoom) {
                            let moved = await movePlayer(playerRoom, kamiRoom);
                            if (!moved) {
                                YeomenAI.statusMessage(`Failed to move kami ${kami.name} to ${kamiRoomNode.name}`, YeomenAI.MESSAGE_TYPES.INFO);
                                //return;
                            }
                        }

                        YeomenAI.statusMessage(`Attempting to stop harvesting for Kami ${kami.name}`, YeomenAI.MESSAGE_TYPES.INFO);
                        let [stopped, stoppedResponse] = await executeContractFunction(
                            'harvestStopSystem',
                            [harvestId],
                            'Successfully stopped harvesting for Kami',
                            'Failed to stop harvesting for Kami'
                        );

                    }

                    await YeomenAI.delay(5);


                    // Get Kami details
                    kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
                    kamiStats[kamiId].kami = kami;
                    await displayKamiStats(kamiStats);

                }
                resolve(true);
            });
            console.log('End registerShutdown callback');
        });



        const kamiIdDecimal = BigInt(kamiId).toString();
        const kamiHarvestRecords = await fetchTupleData('value', kamiId);
        const kamiHarvestRecord = kamiHarvestRecords.find((kamiHarvestRecord) => kamiHarvestRecord.component == '0x5bc28889d745caef68975e56a733199d93efb3f5ae8e4606262ab97c83f72648');

        //const harvestId = kamiHarvestRecord ? kamiHarvestRecord.entity : null;
        const harvestId = kamiStats[kamiId]?.harvestId ?? (kamiHarvestRecord ? kamiHarvestRecord.entity : null);


        kamiHarvestRooms[kamiId] = harvestRoom;


        // Get Kami details
        kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
        kamiStats[kamiId].kami = kami;
        await displayKamiStats(kamiStats);

        if (kami.state == 'DEAD') {
            YeomenAI.statusMessage(`Kami ${kami.name} is no longer alive. Please revive or select a different Kami to continue.`, YeomenAI.MESSAGE_TYPES.ERROR);
            YeomenAI.exit(1);
            return;
        }

        if (kami.state == 'HARVESTING') {
            if (!lastStartedTime[kamiId]) {
                lastStartedTime[kamiId] = Date.now();

                scheduleTime = harvestTime;
            }

        }

        const kamiRoom = kamiHarvestRooms[kamiId] || kami.room;
        const kamiRoomNode = nodes.find((node) => node.room == kamiRoom);



        playerRecord = await fetchPlayerRecord(playerAddress);
        playerRoom = playerRecord ? playerRecord.roomIndex : null;
        playerRoomNode = nodes.find((node) => node.room == playerRoom);


        kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
        kamiStats[kamiId].kami = kami;
        await displayKamiStats(kamiStats);

        const totalHealth = kami.stats.health.base + kami.stats.health.shift + kami.stats.health.boost;
        const healthPercentage = ((kami.stats.health.sync / totalHealth) * 100).toFixed(2);


        // Transition to Rest if tired
        if (kami.state == 'HARVESTING' && harvestId) {

            //YeomenAI.statusMessage(`Kami ${kami.name} is tired. Waiting 200 seconds (cooldown)...`, YeomenAI.MESSAGE_TYPES.INFO);

            // Wait for cooldown before attempting to stop harvesting
            //await new Promise(resolve => setTimeout(resolve, cooldownDelay * 1000)); // Cooldown delay in milliseconds

            // If harvesting, check if harvestTime has passed since lastStartedTime
            const now = Date.now();
            if (!lastStartedTime[kamiId] || now - lastStartedTime[kamiId] >= harvestTime * 60 * 1000) {
                //Move player
                if (playerRoom != kamiRoom) {
                    let moved = await movePlayer(playerRoom, kamiRoom);
                    if (!moved) {
                        YeomenAI.statusMessage(`Failed to move kami ${kami.name} to ${kamiRoomNode.name}`, YeomenAI.MESSAGE_TYPES.INFO);
                        //return;
                    }
                }

                console.log(`Attempting to stop harvesting for Kami ${kami.name}.`);
                let [stopped, stoppedResponse] = await executeContractFunction(
                    'harvestStopSystem',
                    [harvestId],
                    'Successfully stopped harvesting for Kami',
                    'Failed to stop harvesting for Kami'
                );
                if (stopped) {
                    console.log(`Kami ${kami.name} successfully stopped harvesting. Now resting.`);
                    lastStoppedTime[kamiId] = Date.now(); // Record the time Kami stopped harvesting  
                    delete lastStartedTime[kamiId];

                    scheduleTime = restTime;

                    kamiStats[kamiId].stats.total_rest++;
                } else {
                    console.error(`Failed to stop Kami ${kami.name} due to contract error.`);
                }
            }
        } else if (kami.state == 'RESTING') {

            if (enableLevelup) {
                //Check and see if Kami can be levelled up
                let [kamiLevelup, kamiLevelupResponse] = await executeContractFunction(
                    'kamiLevelSystem',
                    [kamiId],
                    'Kami leveled up successfully',
                    'Failed to levelup kami',
                    { estimate: true }
                );

                if (kamiLevelup) {
                    await YeomenAI.delay(5);
                }
            }


            // If resting, check if restTime has passed since lastStoppedTime
            const now = Date.now();
            if (!lastStoppedTime[kamiId] || now - lastStoppedTime[kamiId] >= restTime * 60 * 1000) {
                //Move player
                if (playerRoom != kamiRoom) {
                    let moved = await movePlayer(playerRoom, kamiRoom);
                    if (!moved) {
                        YeomenAI.statusMessage(`Failed to move kami ${kami.name} to ${kamiRoomNode.name}`, YeomenAI.MESSAGE_TYPES.INFO);
                        //return;
                    }
                }

                YeomenAI.statusMessage(`Start Harvesting ${kami.name} at ${kamiRoomNode.name}`, YeomenAI.MESSAGE_TYPES.INFO);
                let nodeIndex = kamiRoomNode.room;

                let [started, startedResponse] = await executeContractFunction(
                    'harvestStartSystem',
                    [kamiIdDecimal, nodeIndex, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
                    'Successfully started harvest',
                    'Failed to start harvest'
                );
                if (started) {
                    lastStartedTime[kamiId] = Date.now();
                    delete lastStoppedTime[kamiId];

                    scheduleTime = harvestTime;

                    kamiStats[kamiId].stats.total_harvest++;

                    kamiStats[kamiId].harvestId = await getHarvestIdFromReceipt(startedResponse);
                }
            }
        }

        await YeomenAI.delay(5);


        // Get Kami details
        kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
        kamiStats[kamiId].kami = kami;
        await displayKamiStats(kamiStats);


        // Schedule the next execution
        const now = new Date();
        const nextScheduleTime = new Date(now.getTime() + scheduleTime * 60000);
        YeomenAI.statusMessage(
            `Scheduled to check kami ${kami.name} after ${scheduleTime} minutes at ${nextScheduleTime.toLocaleTimeString()}`,
            YeomenAI.MESSAGE_TYPES.INFO
        );
        setTimeout(simulateGame, scheduleTime * 60000);

    } catch (err) {
        console.error(err);
        YeomenAI.statusMessage(`Script execution failed: ${err?.message || err}`, YeomenAI.MESSAGE_TYPES.ERROR);
        YeomenAI.exit(1);
    }


};

// Start simulation
simulateGame();

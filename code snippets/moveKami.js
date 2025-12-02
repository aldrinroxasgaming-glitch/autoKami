importScripts(`${self.location.origin}/libraries/ethers6.umd.min.js`);
let source = null;
let destination = formFields['destination'] || null;
let wander = formFields['wander'] || false;

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
    'moveSystem': {
        "systemId": "0xf9b303531494d4003467a5e0d14c8770502040183c6facf992ad01c7e317eaab",
        "abi": [
            "function executeTyped(uint32 id) returns (bytes)"
        ],
        "address": "0x5317e8106abe68990277e61f8e0fa39a0e0b9f42"
    },
}

if (!destination) {
    YeomenAI.statusMessage('Please check params to be filled', YeomenAI.MESSAGE_TYPES.ERROR);
    YeomenAI.exit(1);
}

let nodes = [];
let grid = Array.from({ length: 13 }, () => Array(9).fill(null));
const stats = {};
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

// Helper function to execute and handle gas estimation
const executeContractFunction = async (method, params, successMessage, errorMessage) => {
    try {

        let contract = contracts[method];
        if (!contract) {
            throw new Error('Contract not found');
        }


        let accountAddress = (YeomenAI.ACCOUNT.address).toLowerCase();
        const ethersContract = new ethers.Contract(contract.address, contract.abi, provider);

        //const nonce = await provider.getTransactionCount(accountAddress, "latest");
        const nonce = await YeomenAI.getNonce({ chain, address: accountAddress });

        const data = ethersContract.interface.encodeFunctionData("executeTyped", params);

        const gasEstimate = await provider.estimateGas({
            to: contract.address,
            from: accountAddress,
            data: data
        });
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
        return true;
    } catch (err) {
        YeomenAI.statusMessage(`${errorMessage}: ${err.message}`, YeomenAI.MESSAGE_TYPES.ERROR);
        return false;
    }
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
        YeomenAI.statusMessage('Running code script started');

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

        await displayStats();

        // let nodesRecords = await fetchRooms();
        // for (let nodesRecord of nodesRecords) {
        //     const nodeRecords = await fetchTupleData('entity', nodesRecord.entity);
        //     const nodeRoomRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x3be9611062b8582cf4b9a4eafe577dbde7dcd7779a1efb46d73e212026c4b0cc');
        //     const nodeNameRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x2acf3c3c6b18ed6530ed0fd161fd0b65f4febe79d1182824d3263e852d29ca03');
        //     //const nodeIndexRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x1d80d8bc36212886f1cd16bb0e8f17892d2237a9ad83cebdcec1f76b3c52d19f');
        //     const nodeLocationRecord = nodeRecords.find((nodeRecord) => nodeRecord.component == '0x1d80d8bc36212886f1cd16bb0e8f17892d2237a9ad83cebdcec1f76b3c52d19f');

        //     nodes.push({ entity: nodesRecord.entity, room: nodeRoomRecord.value, name: nodeNameRecord.value, /*index: nodeIndexRecord.value,*/ location: nodeLocationRecord?.value });

        //     // Extract x, y, z from the hex string
        //     let x = parseInt(nodeLocationRecord?.value.slice(2, 4), 16);
        //     let y = parseInt(nodeLocationRecord?.value.slice(18, 20), 16);
        //     let z = parseInt(nodeLocationRecord?.value.slice(34, 36), 16);

        //     //Case to match Convenience Store
        //     if (nodeRoomRecord.value == 13) {
        //         x = 3;
        //     }

        //     if (x && y) {
        //         grid[y - 1][x] = grid[y - 1][x] || [];
        //         grid[y - 1][x][z - 1] = nodeRoomRecord.value;
        //     }
        // }

        nodes = [{ "entity": "0x62c7994b219e50054c44b1d2c7adc987412e70edd479735e1b565c315eab6ec1", "room": "1", "name": "Misty Riverside", "location": "0x0300000000000000010000000000000001" }, { "entity": "0x5904ff60975a2b8cf7c34195bb7b05b99a178a1b1e0e81d493c8c27060b3e174", "room": "0", "name": "deadzone", "location": "0x00" }, { "entity": "0x9a657dc452878223a39c2fb4c5857954863397deeb2ea213c4471648bb15072c", "room": "2", "name": "Tunnel of Trees", "location": "0x0300000000000000030000000000000001" }, { "entity": "0x99ad3f1a512def7420cb3f1ebb936fcc35cfa42af9c8ea9546d28ca2d546c168", "room": "6", "name": "Labs Entrance", "location": "0x04000000000000000a0000000000000001" }, { "entity": "0xe0dd5e85c1d2008b57c4e22a05d1c092fb6cc9948967df50267f4ad7f459b99b", "room": "13", "name": "Convenience Store", "location": "0x0400000000000000030000000000000002" }, { "entity": "0x776b93e45d845bd1be0bc1bbabb1684e741b8c497379d76b7e8bee27460d3547", "room": "9", "name": "Forest: Old Growth", "location": "0x0500000000000000080000000000000001" }, { "entity": "0x25cf6187beac6c4447fba9ec74c396d5ac652e0ba2d2a030fb84ea3d4dd37e58", "room": "11", "name": "Temple by the Waterfall", "location": "0x06000000000000000b0000000000000001" }, { "entity": "0x876109f5b9bee0256db37f6041d5b6a8b15abd51ee33bf0c87c8a8e7de8a2f69", "room": "3", "name": "Torii Gate", "location": "0x0300000000000000040000000000000001" }, { "entity": "0x8fc48ccac13b7e0eeca7e878abefb400bf2fc918ea46b2a1c132428cd99d678b", "room": "5", "name": "Restricted Area", "location": "0x0300000000000000090000000000000001" }, { "entity": "0x98e93ff66a944e28be795cb2fcfd3c1b8d2de8f7972d517f4887703a544d7087", "room": "10", "name": "Forest: Insect Node", "location": "0x0500000000000000050000000000000001" }, { "entity": "0x928572a8441a3bd9e78a05202412ea62b3627bc1331da0095aaaf8128e2630b2", "room": "4", "name": "Vending Machine", "location": "0x0300000000000000060000000000000001" }, { "entity": "0x41db086cbeff1e77b994158c8a768829eaee9a5c0c9d9218496bef2b6abf220d", "room": "26", "name": "Trash-Strewn Graves", "location": "0x0200000000000000080000000000000001" }, { "entity": "0xaa3a9a68a43437e7840b64409ddbb1f5b706e491a2b5231a55612957dce1a28a", "room": "33", "name": "Forest Entrance", "location": "0x0400000000000000080000000000000001" }, { "entity": "0x7fb9d9c13842e0d9d7459cc645bda9540810679fc14962cf195b7385b0efabff", "room": "32", "name": "Road To Labs", "location": "0x03000000000000000a0000000000000001" }, { "entity": "0x94a9e4d788088def528096d79ba26938d084a49e3f0f8e52f44c17da0afa5ea9", "room": "34", "name": "Deeper Into Scrap", "location": "0x0200000000000000060000000000000001" }, { "entity": "0x5600958e463423e51d5cf9b8983d14fe6127ee012e7e965cbc401f7d5598e5ee", "room": "30", "name": "Scrapyard Entrance", "location": "0x0300000000000000050000000000000001" }, { "entity": "0x4f946582729eeca591019f5be312db3371667f2437328dfba4e9a35ab27bd2d9", "room": "35", "name": "Elder Path", "location": "0x0500000000000000060000000000000001" }, { "entity": "0x655d58ec3dc0bb497789e6d9ad0d7af8ded24f5f0cf1510d25292f88e8546317", "room": "31", "name": "Scrapyard Exit", "location": "0x0300000000000000080000000000000001" }, { "entity": "0x5ed5b7f0ca08a2037890a9ba3a92e5922c9dfc5603f66d0da523b699ef606081", "room": "29", "name": "Misty Forest Path", "location": "0x0300000000000000020000000000000001" }, { "entity": "0x7acb36aace1e20e0145433ed0d9920cebac76eba2983b8b7f9787639cd915a01", "room": "25", "name": "Lost Skeleton", "location": "0x0600000000000000090000000000000001" }, { "entity": "0x5eff947178d9f571474a88a4bf594d20ebd049fd55911f7704d8da3413b8d738", "room": "36", "name": "Parting Path", "location": "0x0500000000000000090000000000000001" }, { "entity": "0x13e059a6697ff638dd323ee90a5615a81a8e237d57e54ca55c89b1d8e87e622e", "room": "50", "name": "Ancient Forest Entrance", "location": "0x0600000000000000050000000000000001" }, { "entity": "0x870ff5ce93944649d8a5ae5d69d909ffad3a8064e692463f817fd134731c1f25", "room": "47", "name": "Scrap Paths", "location": "0x0300000000000000070000000000000001" }, { "entity": "0x145e8bf9e3eee25a0a2d5c1d33609f3fc8c12fd0643fb9f7827f1f8d55753ed6", "room": "48", "name": "Steps", "location": "0x0500000000000000070000000000000001" }, { "entity": "0x92af3965bc85804e82ba971d4bcd330cde53fe2565be4a242b9776057766a964", "room": "49", "name": "Clearing", "location": "0x0700000000000000090000000000000001" }, { "entity": "0xd9ae0925084f3614ac08115033fac0a790a20c6e6917962f46a13c6ffe1b1131", "room": "37", "name": "Hollow Path", "location": "0x06000000000000000a0000000000000001" }, { "entity": "0xc8573960bd286a0bfef1a9a1789232546de32ae6a4606219634a7b58e7ca9a72", "room": "52", "name": "Airplane Crash", "location": "0x0800000000000000050000000000000001" }, { "entity": "0xaa4a6911abe1a1692d3dd4446df2d68acbd7d8c42ce67af3ca86512d96033630", "room": "51", "name": "Scrap-Littered Undergrowth ", "location": "0x0700000000000000050000000000000001" }, { "entity": "0x657ed41e476925564d9d65bf45946af435fd54ebc4078cda2041f311be6b0d56", "room": "53", "name": "Blooming Tree", "location": "0x0700000000000000040000000000000001" }, { "entity": "0x2dda2c8bee2c28065bb9ae45a394505a2f77f0cad140ddc6efc9b2ef07f7bf2d", "room": "62", "name": "Centipedes", "location": "0x0800000000000000010000000000000001" }, { "entity": "0xcaf97afcc374f4fb226a097b18b63870a40e7faa7281808962af24e746f6cb98", "room": "57", "name": "River Crossing", "location": "0x0600000000000000030000000000000001" }, { "entity": "0x18621dc99fdf0816de4fbf34f1a250da1b489a29940a615b03f06e6c9a8084a1", "room": "56", "name": "Butterfly Forest", "location": "0x0500000000000000030000000000000001" }, { "entity": "0x076a31847ee749205b34a05d91ddebe33c3cf1f599279f0ef5b25cac9e689397", "room": "60", "name": "Scrap Trees", "location": "0x0500000000000000010000000000000001" }, { "entity": "0x2d5b9b1a7715849d43fc9dda6653d9f6e0b6fc7435985b9b8e4af9f492b7abe8", "room": "63", "name": "Deeper Forest Path", "location": "0x0600000000000000020000000000000001" }, { "entity": "0x6eb1666adb676ba500208a5fca3fb076bbf206302321a51a03c068eed66b2be7", "room": "54", "name": "Plane Interior", "location": "0x0800000000000000050000000000000002" }, { "entity": "0xe98d47953dae5b2a22acb2713d63132f702e48e3a84bd0cb7de57aa900ccfa19", "room": "65", "name": "Forest Hut ", "location": "0x0600000000000000010000000000000001" }, { "entity": "0x8f9b65f256241e353c8aed73a2279480c9f45afdb873502bab9e966fe65b19d9", "room": "55", "name": "Shady Path ", "location": "0x0400000000000000030000000000000001" }, { "entity": "0x4a3c3a00acb76e6afa486b18bdfa7f18f1514b036f9ff455d91a6ed60f43636e", "room": "61", "name": "Musty Forest Path", "location": "0x0700000000000000010000000000000001" }, { "entity": "0x8310f544a2bb233bd733277591a24fb39e06035f00c97d5e1ab485a4cfebe62b", "room": "66", "name": "Marketplace", "location": "0x0200000000000000020000000000000001" }, { "entity": "0x1445f7967fdd88e04d68938cf6dd4f867f0a24e2d06baf569e88efc643c2b87c", "room": "64", "name": "Burning Room", "location": "0x0500000000000000050000000000000002" }, { "entity": "0x938425bcc499028088728cf40d025bd1ad8335906dab88bb5fb69ac7438589bb", "room": "12", "name": "Scrap Confluence", "location": "0x0100000000000000060000000000000001" }];
        grid = [[null, null, null, ["1"], null, ["60"], ["65"], ["61"], ["62"]], [null, null, ["66"], ["29"], null, null, ["63"], null, null], [null, null, null, ["2", "13"], ["55"], ["56"], ["57"], null, null], [null, null, null, ["3"], null, null, null, ["53"], null], [null, null, null, ["30"], null, ["10", "64"], ["50"], ["51"], ["52", "54"]], [null, ["12"], ["34"], ["4"], null, ["35"], null, null, null], [null, null, null, ["47"], null, ["48"], null, null, null], [null, null, ["26"], ["31"], ["33"], ["9"], null, null, null], [null, null, null, ["5"], null, ["36"], ["25"], ["49"], null], [null, null, null, ["32"], ["6"], null, ["37"], null, null], [null, null, null, null, null, null, ["11"], null, null], [null, null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null, null]];

        //console.log('nodes', JSON.stringify(nodes))
        //console.log('grid', JSON.stringify(grid))

        // Get player address
        let playerAddress = (YeomenAI.ACCOUNT.delegator || YeomenAI.ACCOUNT.address).toLowerCase();
        let delegatorAddress = YeomenAI.ACCOUNT.delegator ? YeomenAI.ACCOUNT.delegator.toLowerCase() : null;
        let delegateeAddress = YeomenAI.ACCOUNT.address ? YeomenAI.ACCOUNT.address.toLowerCase() : null;

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

        //const playerEntityRecords = await fetchTupleData('entity', playerAddress);

        YeomenAI.statusMessage('Fetching player details...');
        let playerRecord = await fetchPlayerRecord(playerAddress);
        if (!playerRecord) {
            YeomenAI.statusMessage('No record found for the player', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }

        let playerRoom = playerRecord ? playerRecord.roomIndex : null;

        source = String(playerRoom)
        destination = String(destination);

        const sourceNode = nodes.find((node) => node.room == source);
        const destinationNode = nodes.find((node) => node.room == destination);

        if (source != destination) {
            YeomenAI.statusMessage('Finding path and moving to target...');
            const path = findPath(grid, source, destination);
            console.log('path', JSON.stringify(path))
            // Output the path
            if (path.length == 0) {
                YeomenAI.statusMessage('No path found');
                return;
            }



            let timestamp = new Date().getTime();
            stats[`journey-${timestamp}`] = `Journey: ${sourceNode.name} to ${destinationNode.name}`;
            await displayStats();

            let reachedDestination = false;
            for (let rooms of path) {
                // if (!rooms.includes(source) && !rooms.includes(destination)) {
                //     rooms = [rooms[0]];
                // }
                // rooms = (source === rooms[0]) ? [] : rooms.filter(room => room !== source);

                // Check if the current path includes both source and destination
                if (rooms.includes(source) && rooms.includes(destination)) {
                    // Retain only the destination as the next move
                    rooms = [destination];
                } else if (!rooms.includes(source) && !rooms.includes(destination)) {
                    rooms = [rooms[0]];
                } else if (rooms.includes(source)) {
                    // Remove the source, keep other rooms
                    rooms = (source === rooms[0]) ? [] : rooms.filter(room => room !== source);
                }

                for (let room of rooms) {
                    const node = nodes.find((node) => node.room == room);


                    let moved = false;
                    let retries = 0;
                    const maxRetries = 3; // Set a maximum number of retries (optional)

                    while (!moved) {
                        let timestamp = new Date().getTime();
                        stats[`room-${node.room}-${timestamp}`] = `Moving to target: ${node.name}`;

                        moved = await executeContractFunction(
                            'moveSystem',
                            [room],
                            `Successfully moved: ${node.name}`,
                            `Failed to move: ${node.name}`
                        );

                        if (!moved) {
                            stats[`room-${node.room}-${timestamp}`] += ` -  &#10005; Failed`;
                            await displayStats();

                            if (retries >= maxRetries) {
                                YeomenAI.statusMessage(`Max retries reached.`);
                                YeomenAI.exit(1);
                                return;
                            }


                            //wait 5 minutes and move to same room again
                            YeomenAI.statusMessage(`Waiting 5 minutes before retry moving to target: ${node.name}`);
                            await YeomenAI.delay(5 * 60);

                            retries++;
                        } else {
                            stats[`room-${node.room}-${timestamp}`] += ` -  &#10003; Success`;
                        }
                    }

                    await displayStats();
                    await YeomenAI.delay(5);

                    // Check if the destination is reached
                    if (room == destination) {
                        reachedDestination = true;
                        break;
                    }
                }
                if (reachedDestination) break; // Exit the outer loop if destination is reached
            }

        }

        YeomenAI.statusMessage(`Successfully moved from: ${sourceNode.name} to: ${destinationNode.name}`);
        if (wander) {
            //swap source and destination
            [source, destination] = [destination, source];
            simulateGame();
        } else {
            YeomenAI.exit(0, `Successfully moved from: ${sourceNode.name} to: ${destinationNode.name}`);
        }

    } catch (err) {
        console.error(err);
        YeomenAI.statusMessage(`Script execution failed: ${err?.message || "An unknown error occurred."}`, YeomenAI.MESSAGE_TYPES.ERROR);
        YeomenAI.exit(1, `Script execution failed: ${err?.message || "An unknown error occurred."}`);
    }


};

// Display stats
const displayStats = async () => {
    let markdown = `#### Journey log\n`;

    for (let statKey of Object.keys(stats)) {
        const stat = stats[statKey];
        markdown += `- ${stat}\n`;
    }

    await YeomenAI.markdown(markdown);
};

// Start simulation
simulateGame();

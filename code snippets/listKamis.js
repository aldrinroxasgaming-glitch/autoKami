const accountAddressOrName = formFields['addressOrName'].trim();

if (!accountAddressOrName) {
    YeomenAI.statusMessage('Please provide the account address or name', YeomenAI.MESSAGE_TYPES.ERROR);
    YeomenAI.exit(1);
}

const SCHEMA = 'indexeddb_';
const kamiStats = [];

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


// Display Kami stats
const displayKamiStats = async (stats) => {
    let markdown = `#### Kami Stats\n`;
    markdown += `| Kami Name          | Level      | Status      | Health (%) |\n`;
    markdown += `|--------------------|------------|-------------|------------|\n`;

    for (const kami of stats) {

        const totalHealth = kami.stats ? (kami.stats.health.base + kami.stats.health.shift + kami.stats.health.boost) : null;
        const healthPercentage = kami.stats ? (((kami.stats.health.sync / totalHealth) * 100).toFixed(2)) : null;
        markdown += `| ${kami.name || `${kami.id}(Unknown Kami)` || 'N/A'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | ${kami.level || 'N/A'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | ${kami.state || 'N/A'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | ${healthPercentage ? `${healthPercentage}%` : 'N/A'} &nbsp;&nbsp;&nbsp; |\n`;

    }

    markdown += `\n#### Summary\nTotal Kami(s): ${stats.length}\n`;

    markdown += ` \n\n\n\n`;
    markdown += `NB: The displayed health percentage may not be accurate. It will only reflect the correct value after a recent on-chain transaction.`;

    await YeomenAI.markdown(markdown);
};

// Main function to fetch and display Kami stats
const fetchKamiStats = async () => {
    try {
        YeomenAI.statusMessage('Fetching player Kami(s)...');
        await displayKamiStats(kamiStats);

        let accountAddress;
        if (ethers.utils.isAddress(accountAddressOrName)) {
            accountAddress = accountAddressOrName;
        } else {
            const playerSearchRecords = await fetchTupleData('value', accountAddressOrName);
            const playerNameRecord = playerSearchRecords.find((playerSearchRecord) => playerSearchRecord.component == '0x2acf3c3c6b18ed6530ed0fd161fd0b65f4febe79d1182824d3263e852d29ca03');
            accountAddress = playerNameRecord ? playerNameRecord.entity : null;
        }

        if (!accountAddress) {
            YeomenAI.statusMessage('No Accounts found for the search', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }

        // const playerRecords = await fetchTupleData('value', accountAddress.toLowerCase());
        // const kamiIds = playerRecords
        //     .filter(record => record.component === '0xdb1228220c36234210e3f04b6ac039f5d81c4d6d81f43d9b4a9d70c4d5bcfac1')
        //     .map(record => record.entity);

        let playerRecord = await fetchPlayerRecord(accountAddress.toLowerCase());
        if (!playerRecord) {
            YeomenAI.statusMessage('No record found for the player', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }
        const kamiIds = playerRecord?.kamis?.map(kami => kami.id) || [];

        if (kamiIds.length === 0) {
            YeomenAI.statusMessage('No Kamis found for the player', YeomenAI.MESSAGE_TYPES.INFO);
            return;
        }

        YeomenAI.statusMessage(`Found ${kamiIds.length} Kami(s), fetching stats...`, YeomenAI.MESSAGE_TYPES.INFO);

        for (const kamiId of kamiIds) {
            const kamiIdDecimal = ethers.BigNumber.from(kamiId).toString();
            // console.log(kamiIdDecimal)
            let kami;
            try {
                kami = await YeomenAI.getContractData('getterSystem.getKami', [kamiIdDecimal]);
                kamiStats.push(kami);
            } catch (err) {
                kamiStats.push({ id: kamiId });
            }

        }

        await displayKamiStats(kamiStats);

        YeomenAI.statusMessage('Listing of all Kami complete');
        YeomenAI.exit(0);

    } catch (err) {
        console.error(err);
        YeomenAI.statusMessage('Error fetching Kami stats', YeomenAI.MESSAGE_TYPES.ERROR);
        YeomenAI.exit(1);
    }
};

// Start script
fetchKamiStats();

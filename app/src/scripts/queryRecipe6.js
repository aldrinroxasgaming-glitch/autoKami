import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';

// Configuration
const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const COMPONENTS = loadIds('components.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);

async function getComponentAddress(encodedId) {
    const registryAddress = await world.components();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddress, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(encodedId);
    if (addresses.length > 0) {
        const id = BigInt(addresses[0]);
        return ethers.getAddress('0x' + id.toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + encodedId);
}

async function getRecipeDetails(index) {
    console.log(`Fetching details for Recipe #${index}...`);

    // Utils from LibRecipe
    const genInputID = (idx) => ethers.solidityPackedKeccak256(["string", "uint32"], ["recipe.input", idx]);
    const genOutputID = (idx) => ethers.solidityPackedKeccak256(["string", "uint32"], ["recipe.output", idx]);
    const genID = (idx) => ethers.solidityPackedKeccak256(["string", "uint32"], ["registry.recipe", idx]);

    const keysAddr = await getComponentAddress(COMPONENTS.Keys.encodedID);
    const valuesAddr = await getComponentAddress(COMPONENTS.Values.encodedID);
    const staminaAddr = await getComponentAddress(COMPONENTS.Stamina.encodedID);

    const Keys = new ethers.Contract(keysAddr, loadAbi('KeysComponent.json').abi, provider);
    const Values = new ethers.Contract(valuesAddr, loadAbi('ValuesComponent.json').abi, provider);
    const Stamina = new ethers.Contract(staminaAddr, loadAbi('StaminaComponent.json').abi, provider);

    // Inputs
    const inputID = genInputID(index);
    let inputIndices = [];
    let inputAmounts = [];
    try {
        // Keys returns uint32[]
        inputIndices = await Keys.getFunction('get(uint256)')(inputID);
        // Values returns uint256[]
        inputAmounts = await Values.getFunction('get(uint256)')(inputID);
    } catch (e) {
        console.log("Error fetching inputs (might be empty):", e.message);
    }

    // Outputs
    const outputID = genOutputID(index);
    let outputIndices = [];
    let outputAmounts = [];
    try {
        outputIndices = await Keys.getFunction('get(uint256)')(outputID);
        outputAmounts = await Values.getFunction('get(uint256)')(outputID);
    } catch (e) {
        console.log("Error fetching outputs:", e.message);
    }

    // Stamina Cost
    const recipeID = genID(index);
    let staminaCost = 0;
    try {
        const staminaStats = await Stamina.getFunction('get(uint256)')(recipeID);
        // staminaStats is likely [base, shift, boost, sync]
        // We want 'sync' which is the last one (index 3) based on LibRecipe: Stat(0,0,0, staminaCost)
        // Actually Stat struct is { int32 base; int32 shift; int32 boost; int32 sync; }
        // Ethers returns it as array-like object.
        staminaCost = Number(staminaStats.sync || staminaStats[3]); 
    } catch (e) {
        console.log("No stamina cost found (or error):", e.message);
    }

    console.log(`\nRecipe #${index} Details:`);
    console.log(`Stamina Cost: ${staminaCost}`);
    
    console.log("\nInputs:");
    if (inputIndices.length === 0) console.log("None");
    for (let i = 0; i < inputIndices.length; i++) {
        console.log(`- Item #${inputIndices[i]}: ${inputAmounts[i]}`);
    }

    console.log("\nOutputs:");
    if (outputIndices.length === 0) console.log("None");
    for (let i = 0; i < outputIndices.length; i++) {
        console.log(`- Item #${outputIndices[i]}: ${outputAmounts[i]}`);
    }
}

getRecipeDetails(7).catch(console.error);

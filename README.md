# Kamigotchi ABIs Documentation

This repository contains the Application Binary Interfaces (ABIs) for the Kamigotchi on-chain game built on the MUD (Modular Unified Development) framework. This documentation provides comprehensive guides on how to interact with the smart contracts, make on-chain transactions, and connect to the Yominet network.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Game Mechanics](#game-mechanics)
- [Connecting to Yominet](#connecting-to-yominet)
- [Reading from Contracts](#reading-from-contracts)
- [Writing Transactions](#writing-transactions)
- [Systems Reference](#systems-reference)
- [Components Reference](#components-reference)
- [Code Examples](#code-examples)
- [Formulas Reference](#formulas-reference)

## Project Overview

Kamigotchi is an on-chain game built using the MUD framework. The game consists of:

- **World Contract**: The main entry point that manages all systems and components
- **Systems**: Executable functions that modify game state
- **Components**: Data storage structures that hold game state

### Quick Reference

**Network RPC**: `https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz`  
**World Contract**: `0x2729174c265dbBd8416C6449E0E813E88f43D0E7`  
**GetterSystem Contract**: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`

### Repository Structure

```
kamigotchi-abis/
├── abi/              # ABI JSON files for all contracts
│   ├── World.json    # Main World contract
│   ├── *System.json  # System contracts
│   └── *Component.json # Component contracts
└── ids/              # System and component ID mappings
    ├── systems.json  # System IDs and encoded hashes
    └── components.json # Component IDs and encoded hashes
```

## Architecture

### World Contract

The `World` contract is the central registry that:
- Manages all system registrations
- Manages all component registrations
- Provides access to systems via `systems()` function
- Provides access to components via `components()` function
- Emits events for component value changes

### Systems

Systems are executable contracts that contain game logic. Each system has:
- `execute(bytes arguments)`: Generic execution function
- `executeTyped(...)`: Type-safe execution functions with specific parameters
- `deprecate()`: Marks the system as deprecated
- Ownership management functions

### Components

Components are data storage contracts that hold game state. They can be:
- **Bare Components**: Store raw data (uint256, bytes32, etc.)
- **Typed Components**: Store structured data with specific types

## Game Mechanics

This section provides an overview of Kamigotchi's core game mechanics. For detailed formulas and calculations, see [Formulas Reference](#formulas-reference).

> **Source**: Based on [Kamigotchi World Mechanics](https://paragraph.com/@0xclarke/kamigotchi-world-mechanics) by 0xclarke

### Leveling System

Kamigotchi uses a polynomial progression system for experience requirements. Each level requires more experience than the previous one, following the formula:

\[
\text{ExperienceNeeded}[i] = \text{ExperienceNeeded}[i-1] + 0.44 \times \text{ExperienceAdded}[i-1]
\]

**Key Points:**
- Reaching level 55 (final tier of talent tree) takes approximately **1 year**
- Talent trees may be resettable at various points
- Experience is gained through various activities (harvesting, quests, etc.)

### Harvesting System

Harvesting is a core mechanic where Kami collect MUSU (the game's resource) from nodes. The system involves several key factors:

#### Harvesting Factors

1. **Power**: Directly increases the base MUSU gained per hour
2. **Intensity**: A ramping mechanic where prolonged harvesting increases MUSU per hour over time
3. **Bounty Boost**: Overall multiplier to MUSU bounty, applicable with both Power and Intensity
4. **Fertility Boost**: Affinity-based boost to MUSU bounty
   - Only applicable for type matchups
   - **Not** applicable for [Normal/Normal] matchups
   - Typically increased by 5% per level in Harvester and Enlightened trees
5. **Strain**: Damage taken by Kami during MUSU harvesting (affects health)

#### Affinity System

Affinity is determined by the type matchup between your Kami's **body** and **hand** parts and the node type being harvested.

**Body Part Contribution:**
- **Normal type**: No change (0)
- **Matches node type**: +0.65 + fertility boost
- **Doesn't match node type**: -0.25

**Hand Part Contribution:**
- **Normal type**: No change (0)
- **Matches node type**: +0.35 + fertility boost
- **Doesn't match node type**: -0.10

**Example**: An [Eerie/Eerie] Kami harvesting in an Eerie node:
- Base: 1.0
- Body (Eerie matches): +0.65 + fertility boost
- Hand (Eerie matches): +0.35 + fertility boost
- **Total**: 2.0 + 2×fertility boost

#### Harvesting States

- **HARVESTING**: Kami is actively harvesting a node
- **RESTING**: Kami has stopped harvesting and is on cooldown
- Harvesting can be stopped manually or through liquidation/death

#### Harvesting Operations

The harvesting system includes several operations:

1. **Start Harvesting** (`HarvestStartSystem`): Begin harvesting a node
2. **Stop Harvesting** (`HarvestStopSystem`): Manually stop and collect rewards
3. **Collect Harvest** (`HarvestCollectSystem`): Collect rewards without stopping
4. **Liquidate Harvest** (`HarvestLiquidateSystem`): Liquidate a harvest (different from manual stop)

**Important Notes:**
- When a harvest is stopped manually, rewards are collected and the Kami enters RESTING state
- When a harvest is liquidated or the Kami dies, rewards are **not** collected
- Harvesting triggers scavenging mechanics on the node
- Harvest times and amounts are logged for tracking
- Action bonuses are reset when harvesting stops

### Build Types

Players can optimize their Kami for different playstyles:

1. **Harvester Build**
   - Focus: Maximum MUSU harvesting efficiency
   - Key Attributes: Power, Fertility Boost
   - Skill Trees: Harvester tree (5% fertility boost per level)

2. **Guardian Build**
   - Focus: Defense and protection
   - Key Attributes: Health, Stamina
   - Use Case: Protecting Kami from liquidation

3. **Enlightened Build**
   - Focus: Balanced harvesting with other attributes
   - Key Attributes: Balanced stats, Fertility Boost
   - Skill Trees: Enlightened tree (5% fertility boost per level)

4. **Predator Build**
   - Focus: Offensive capabilities
   - Key Attributes: Power, Violence
   - Use Case: Liquidating other Kami

### Liquidations

Liquidations are a risk/reward mechanic in the game:

- **Threshold**: The point at which a Kami is at risk of liquidation
- **Salvage**: Potential recovery from a liquidated Kami
- **Spoils**: Rewards obtained from liquidating another Kami
- **Cooldown**: Time required before a Kami can perform certain actions post-liquidation
- **Recoil**: Potential negative effects following a liquidation event

### Game States

Kami can be in various states:
- **RESTING**: Default state, ready for actions
- **HARVESTING**: Actively harvesting a node
- **QUESTING**: On a quest
- Other states may exist for different game activities

### Stamina System

- Kami have current stamina (`currStamina`) that affects their ability to perform actions
- Stamina is tracked per account
- Actions may consume stamina or have cooldown periods

For detailed formulas and calculations, see [KAMIGOTCHI_FORMULAS.md](./KAMIGOTCHI_FORMULAS.md).

## Connecting to Yominet

Yominet is the blockchain network where Kamigotchi is deployed. To connect to Yominet, you'll need to configure your Web3 provider.

### Network Configuration

```typescript
const YOMINET_CONFIG = {
  chainId: 0x1a2b3c4d, // Replace with actual Yominet chain ID
  chainName: 'Yominet',
  nativeCurrency: {
    name: 'YOMI',
    symbol: 'YOMI',
    decimals: 18,
  },
  rpcUrls: ['https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'],
  blockExplorerUrls: ['https://explorer.yominet.io'], // Replace with actual explorer URL
};
```

### GetterSystem Contract Address

The GetterSystem is deployed at: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`

You can use this address directly without querying the World contract for system addresses.

### Using ethers.js

```typescript
import { ethers } from 'ethers';

// Connect to Yominet
const provider = new ethers.providers.JsonRpcProvider('https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz');
// Or use a wallet provider
const wallet = new ethers.Wallet(privateKey, provider);

// Load World contract
import WorldABI from './abi/World.json';
const worldAddress = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7'; // World contract address
const worldContract = new ethers.Contract(worldAddress, WorldABI.abi, wallet);
```

### Using viem

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Create public client for reads
const publicClient = createPublicClient({
  chain: yominetChain, // Define your Yominet chain config
  transport: http('https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'),
});

// Create wallet client for writes
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: yominetChain,
  transport: http('https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'),
});
```

### Using Web3.js

```typescript
import Web3 from 'web3';

const web3 = new Web3('https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz');
const worldContract = new web3.eth.Contract(WorldABI, worldAddress);
```

## Reading from Contracts

Reading from contracts is done through view functions that don't modify state and don't require gas.

### Reading from World Contract

```typescript
// Get system address by system ID
import systems from './ids/systems.json';

const systemId = systems.AccountRegisterSystem.encodedID;
const systemAddress = await worldContract.systems(systemId);

// Get component address by component ID
import components from './ids/components.json';

const componentId = components.Name.encodedID;
const componentAddress = await worldContract.components(componentId);
```

### Reading from Systems

Most systems have view functions for reading data. The `GetterSystem` is specifically designed for reading game state.

**GetterSystem Contract Address**: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`

#### Using Contract Instance (Recommended)

```typescript
import GetterSystemABI from './abi/GetterSystem.json';

// Option 1: Use direct contract address (faster, no World query needed)
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const getterSystem = new ethers.Contract(
  GETTER_SYSTEM_ADDRESS,
  GetterSystemABI.abi,
  provider
);

// Option 2: Get system address from World
const getterSystemId = systems.GetterSystem.encodedID;
const getterSystemAddress = await worldContract.systems(getterSystemId);
const getterSystem = new ethers.Contract(
  getterSystemAddress,
  GetterSystemABI.abi,
  provider
);

// Read Account data by ID
const accountId = ethers.BigNumber.from('123');
const accountData = await getterSystem.getAccount(accountId);
console.log('Account:', accountData.name, 'Room:', accountData.room);

// Read Kami data by ID
const kamiId = ethers.BigNumber.from('456');
const kamiData = await getterSystem.getKami(kamiId);
console.log('Kami:', kamiData.name, 'Level:', kamiData.level.toString());

// Read Kami data by index
const kamiIndex = 0;
const kamiDataByIndex = await getterSystem.getKamiByIndex(kamiIndex);
```

#### Using provider.call() (Alternative Pattern)

For more control or when you want to avoid creating contract instances:

```typescript
import { ethers, Interface } from 'ethers';
import GetterSystemABI from './abi/GetterSystem.json';

const provider = new ethers.providers.JsonRpcProvider(
  'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'
);
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const iface = new Interface(GetterSystemABI.abi);

// Get Kami by index
const kamiIndex = 0;
const encodedData = iface.encodeFunctionData('getKamiByIndex', [kamiIndex]);

const rawResult = await provider.call({
  to: GETTER_SYSTEM_ADDRESS,
  data: encodedData,
});

const decodedResult = iface.decodeFunctionResult('getKamiByIndex', rawResult);
const kamiData = decodedResult[0]; // First element is the KamiShape tuple
console.log('Kami Name:', kamiData.name);
console.log('Kami Level:', kamiData.level.toString());
```

#### Return Types

**AccountShape**:
```typescript
{
  index: uint32,
  name: string,
  currStamina: int32,
  room: uint32
}
```

**KamiShape**:
```typescript
{
  id: uint256,
  index: uint32,
  name: string,
  mediaURI: string,
  stats: {
    health: Stat,
    power: Stat,
    harmony: Stat,
    violence: Stat
  },
  traits: {
    face: uint32,
    hand: uint32,
    body: uint32,
    background: uint32,
    color: uint32
  },
  affinities: string[],
  account: uint256,
  level: uint256,
  xp: uint256,
  room: uint32,
  state: string
}
```

**Stat** (used in KamiStats):
```typescript
{
  base: int32,    // Base stat value
  shift: int32,  // Temporary stat modifier
  boost: int32,   // Permanent stat boost
  sync: int32     // Synchronized stat value
}
```

### Reading from Components

```typescript
import NameComponentABI from './abi/NameComponent.json';

// Get component address
const nameComponentId = components.Name.encodedID;
const nameComponentAddress = await worldContract.components(nameComponentId);
const nameComponent = new ethers.Contract(
  nameComponentAddress,
  NameComponentABI.abi,
  provider
);

// Read component value for an entity
const entityId = ethers.BigNumber.from('456');
const name = await nameComponent.getValue(entityId);
```

## Writing Transactions

Writing transactions requires:
1. A wallet with YOMI tokens for gas
2. The system contract instance
3. Calling the `execute` or `executeTyped` function

### Getting System Address

```typescript
// Get system address from World contract
const systemId = systems.AccountRegisterSystem.encodedID;
const systemAddress = await worldContract.systems(systemId);
```

### Using executeTyped (Recommended)

`executeTyped` provides type-safe function calls:

```typescript
import AccountRegisterSystemABI from './abi/AccountRegisterSystem.json';

const systemAddress = await worldContract.systems(
  systems.AccountRegisterSystem.encodedID
);
const system = new ethers.Contract(
  systemAddress,
  AccountRegisterSystemABI.abi,
  wallet
);

// Register an account
const operator = '0x...'; // Operator address
const name = 'PlayerName';
const tx = await system.executeTyped(operator, name);
await tx.wait();
```

### Using execute (Generic)

For systems without `executeTyped` or for custom encoding:

```typescript
// Encode function call manually
const iface = new ethers.utils.Interface(AccountRegisterSystemABI.abi);
const encodedData = iface.encodeFunctionData('executeTyped', [
  operator,
  name,
]);

// Execute via generic execute function
const tx = await system.execute(encodedData);
await tx.wait();
```

### Transaction Flow

1. **Estimate Gas** (optional but recommended):
```typescript
const gasEstimate = await system.estimateGas.executeTyped(operator, name);
```

2. **Send Transaction**:
```typescript
const tx = await system.executeTyped(operator, name, {
  gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
});
```

3. **Wait for Confirmation**:
```typescript
const receipt = await tx.wait();
console.log('Transaction confirmed:', receipt.transactionHash);
```

4. **Handle Errors**:
```typescript
try {
  const tx = await system.executeTyped(operator, name);
  await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough YOMI for gas');
  } else if (error.code === 'USER_REJECTED') {
    console.error('User rejected transaction');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

## Systems Reference

### Account Systems

#### AccountRegisterSystem
**ID**: `system.account.register`  
**Encoded ID**: `0xf38c56f8ddc37f3e83e43016bac5aaa338ebb49ca02232452bd2f5c79a34a067`

Register a new account in the game.

**executeTyped(operator: address, name: string)**
- `operator`: The operator address for the account
- `name`: The name for the account

```typescript
await accountRegisterSystem.executeTyped(operatorAddress, 'MyAccount');
```

#### AccountMoveSystem
**ID**: `system.account.move`  
**Encoded ID**: `0xf9b303531494d4003467a5e0d14c8770502040183c6facf992ad01c7e317eaab`

Move an account to a different room.

**executeTyped(toIndex: uint32)**
- `toIndex`: The room index to move to

```typescript
await accountMoveSystem.executeTyped(roomIndex);
```

#### AccountSetNameSystem
**ID**: `system.account.set.name`  
**Encoded ID**: `0x93677c34c7dd974fe23e0f36ff741599f16a73b51e6d50fc3527179131f5b9ea`

Set the name of an account.

**executeTyped(name: string)**
- `name`: The new name for the account

```typescript
await accountSetNameSystem.executeTyped('NewName');
```

#### AccountSetOperatorSystem
**ID**: `system.account.set.operator`  
**Encoded ID**: `0x30e8932dc8e2362f4722824362c3a0895f6dbaa7f643b37560c1b38ea682d667`

Set the operator address for an account.

**executeTyped(operator: address)**
- `operator`: The new operator address

```typescript
await accountSetOperatorSystem.executeTyped(operatorAddress);
```

#### AccountSetFarcasterDataSystem
**ID**: `system.account.set.farcaster`  
**Encoded ID**: `0xd34161e46727cb8efc2f04f8bd1b9f57ad4d38cf0467c0a23e3986643574408c`

Set Farcaster data for an account.

**executeTyped(farcasterData: bytes)**
- `farcasterData`: Encoded Farcaster data

```typescript
await accountSetFarcasterDataSystem.executeTyped(farcasterData);
```

#### AccountFundSystem
**ID**: `system.account.fund`  
**Encoded ID**: `0x9816b9182de6b2d9e18f3e53b9e08c41dc11106023754512fa722daf78b05896`

Fund an account with tokens.

**executeTyped(amount: uint256)**
- `amount`: The amount to fund

```typescript
await accountFundSystem.executeTyped(ethers.utils.parseEther('1.0'));
```

#### AccountUseItemSystem
**ID**: `system.account.use.item`  
**Encoded ID**: `0x02594d17a5ffc4ba72c65c5616374156e960547eac12113df1f60b0b21d9e2d5`

Use an item from account inventory.

**executeTyped(itemIndex: uint32, amount: uint32)**
- `itemIndex`: The index of the item to use
- `amount`: The amount to use

```typescript
await accountUseItemSystem.executeTyped(itemIndex, amount);
```

### Kami Systems

#### KamiGachaMintSystem
**ID**: `system.kami.gacha.mint`  
**Encoded ID**: `0xe919eba3e723393aaec69cce26171484c43f9b021996e42df1f9164699f6717c`

Mint a new Kami through the gacha system.

**executeTyped(amount: uint256)**
- `amount`: The amount to mint

```typescript
await kamiGachaMintSystem.executeTyped(1);
```

#### KamiGachaRerollSystem
**ID**: `system.kami.gacha.reroll`  
**Encoded ID**: `0x9bfb5984bcacdb14759602922d795519912e64eb01c6899a41eb65b994d68857`

Reroll a gacha result.

**executeTyped(kamiId: uint256)**
- `kamiId`: The ID of the Kami to reroll

```typescript
await kamiGachaRerollSystem.executeTyped(kamiId);
```

#### KamiLevelSystem
**ID**: `system.kami.level`  
**Encoded ID**: `0x5b84b4f4f45a066d7e7527ce4cf36c4c8a56da7c1b163d1139e1934b9f2d3a23`

Level up a Kami.

**executeTyped(kamiId: uint256)**
- `kamiId`: The ID of the Kami to level up

```typescript
await kamiLevelSystem.executeTyped(kamiId);
```

#### KamiNameSystem
**ID**: `system.kami.name`  
**Encoded ID**: `0x505672a725488aecfa1148696bfa9cb13566e8c99737b5816f221964050681b3`

Set the name of a Kami.

**executeTyped(id: uint256, name: string)**
- `id`: The Kami ID
- `name`: The new name

```typescript
await kamiNameSystem.executeTyped(kamiId, 'MyKami');
```

#### KamiUseItemSystem
**ID**: `system.kami.use.item`  
**Encoded ID**: `0xb1262e41ad8db7bdcc4c52640b856c24cd1713a44079d2d0c4b692eceebf3f09`

Use an item on a Kami.

**executeTyped(kamiId: uint256, itemIndex: uint32, amount: uint32)**
- `kamiId`: The Kami ID
- `itemIndex`: The item index
- `amount`: The amount to use

```typescript
await kamiUseItemSystem.executeTyped(kamiId, itemIndex, amount);
```

### Quest Systems

#### QuestAcceptSystem
**ID**: `system.quest.accept`  
**Encoded ID**: `0xe186a0d9134f37176fc5f797b772b3195045e28b488cc7008850e59f580d9332`

Accept a quest.

**executeTyped(assignerID: uint256, index: uint32)**
- `assignerID`: The ID of the quest assigner
- `index`: The quest index

```typescript
await questAcceptSystem.executeTyped(assignerId, questIndex);
```

#### QuestCompleteSystem
**ID**: `system.quest.complete`  
**Encoded ID**: `0x3da8800d2554808dee6ceb605560b5e8808c44e6aa2b2b7fd73c5142f69a5bb1`

Complete a quest.

**executeTyped(questId: uint256)**
- `questId`: The quest ID to complete

```typescript
await questCompleteSystem.executeTyped(questId);
```

#### QuestDropSystem
**ID**: `system.Quest.Drop`  
**Encoded ID**: `0x25839c49564951b26d22f483bbfd37bb41e67b657cfa5a4de5b292c87ad2a5ee`

Drop a quest.

**executeTyped(questId: uint256)**
- `questId`: The quest ID to drop

```typescript
await questDropSystem.executeTyped(questId);
```

### Friend Systems

#### FriendRequestSystem
**ID**: `system.friend.request`  
**Encoded ID**: `0x3d00bbede376f2b6f60d2a6336b80889c091f789b681a236ebb478fc2d902972`

Send a friend request.

**executeTyped(targetAccountId: uint256)**
- `targetAccountId`: The target account ID

```typescript
await friendRequestSystem.executeTyped(targetAccountId);
```

#### FriendAcceptSystem
**ID**: `system.friend.accept`  
**Encoded ID**: `0x51d78698a2ed611fb47d78de3c9b8d6f19a46f8f7e8d86ccee946e7053d62c76`

Accept a friend request.

**executeTyped(requesterAccountId: uint256)**
- `requesterAccountId`: The requester account ID

```typescript
await friendAcceptSystem.executeTyped(requesterAccountId);
```

#### FriendCancelSystem
**ID**: `system.friend.cancel`  
**Encoded ID**: `0x1e0f076aa402b2fecc2a89096fd2b6754e207e5c8384541b5da47f7d05ef3ae4`

Cancel a friend request.

**executeTyped(targetAccountId: uint256)**
- `targetAccountId`: The target account ID

```typescript
await friendCancelSystem.executeTyped(targetAccountId);
```

#### FriendBlockSystem
**ID**: `system.friend.block`  
**Encoded ID**: `0xe4636dc3b46e13d0b7b0e1649628116d21a8f73e6af5716ae028eaf79da93ad8`

Block a friend.

**executeTyped(targetAccountId: uint256)**
- `targetAccountId`: The account ID to block

```typescript
await friendBlockSystem.executeTyped(targetAccountId);
```

### Skill Systems

#### SkillUpgradeSystem
**ID**: `system.skill.upgrade`  
**Encoded ID**: `0x09cef0a10b68723b6093265abba0776ad700c0f456c34e1d9ee5a33dcc15545d`

Upgrade a skill.

**executeTyped(skillIndex: uint32)**
- `skillIndex`: The skill index to upgrade

```typescript
await skillUpgradeSystem.executeTyped(skillIndex);
```

#### SkillResetSystem
**ID**: `system.skill.reset`  
**Encoded ID**: `0x5ebda31a66d1c7f5af30bf0d2453f4ff34f83b1e7ed5e5e5438ae01ea678a254`

Reset skills.

**executeTyped()**
- No parameters

```typescript
await skillResetSystem.executeTyped();
```

### Harvest Systems

#### HarvestStartSystem
**ID**: `system.harvest.start`  
**Encoded ID**: `0x889a517f187477a50ab38d2b87c697dd40cb524faa7a48fe1ce59620bb8d6203`

Start a harvest.

**executeTyped(nodeIndex: uint32)**
- `nodeIndex`: The node index to harvest

```typescript
await harvestStartSystem.executeTyped(nodeIndex);
```

#### HarvestStopSystem
**ID**: `system.harvest.stop`  
**Encoded ID**: `0x2ce6930d030ce775e29350c0200df30632bef67d7b0c72df15cbe7b4be763912`

Stop a harvest.

**executeTyped(nodeIndex: uint32)**
- `nodeIndex`: The node index to stop harvesting

```typescript
await harvestStopSystem.executeTyped(nodeIndex);
```

#### HarvestCollectSystem
**ID**: `system.harvest.collect`  
**Encoded ID**: `0x8493c9d75b152fc52d462c6389b227634dbf7dab0534ecb90e9cc85ad4e98145`

Collect harvest rewards.

**executeTyped(nodeIndex: uint32)**
- `nodeIndex`: The node index to collect from

```typescript
await harvestCollectSystem.executeTyped(nodeIndex);
```

#### HarvestLiquidateSystem
**ID**: `system.harvest.liquidate`  
**Encoded ID**: `0x743810742beaf8b355d13d6badc55ccd4d31b7c3c930a2eb0339cd37362aff02`

Liquidate a harvest.

**executeTyped(nodeIndex: uint32)**
- `nodeIndex`: The node index to liquidate

```typescript
await harvestLiquidateSystem.executeTyped(nodeIndex);
```

### Trading Systems

#### ListingSellSystem
**ID**: `system.listing.sell`  
**Encoded ID**: `0x0e59fe3ceb2e7941afae9ca62f352498ff65857afc78f41aa6817b36c1b9adb7`

Create a listing to sell items.

**executeTyped(itemIndex: uint32, amount: uint32, price: uint256)**
- `itemIndex`: The item index to sell
- `amount`: The amount to sell
- `price`: The price per item

```typescript
await listingSellSystem.executeTyped(itemIndex, amount, price);
```

#### ListingBuySystem
**ID**: `system.listing.buy`  
**Encoded ID**: `0xef71c1277e98d72c027c8f894066ed774855edbd43ded8811c7bc5bd166a6320`

Buy items from a listing.

**executeTyped(merchantIndex: uint32, itemIndices: uint32[], amts: uint32[])**
- `merchantIndex`: The merchant index
- `itemIndices`: Array of item indices to buy
- `amts`: Array of amounts to buy

```typescript
await listingBuySystem.executeTyped(merchantIndex, [itemIndex1, itemIndex2], [1, 2]);
```

### Other Systems

#### CraftSystem
**ID**: `system.craft`  
**Encoded ID**: `0x91c8ca5f3d3d3a29a32ee18a732d1a758b78b1a39fd4442a9e86c11882a3ddf3`

Craft an item.

**executeTyped(recipeIndex: uint32)**
- `recipeIndex`: The recipe index to craft

```typescript
await craftSystem.executeTyped(recipeIndex);
```

#### GoalContributeSystem
**ID**: `system.goal.contribute`  
**Encoded ID**: `0x72c41d81fb1503526635c627e773b3a92eeb5c05254c828dc6bd736582519759`

Contribute to a goal.

**executeTyped(goalIndex: uint32, amt: uint256)**
- `goalIndex`: The goal index
- `amt`: The contribution amount

```typescript
await goalContributeSystem.executeTyped(goalIndex, amount);
```

#### GoalClaimSystem
**ID**: `system.goal.claim`  
**Encoded ID**: `0xe6f0765b0495731df1c8acd30f6caa1d39fbb7ea39a1978d095300c816a9683d`

Claim goal rewards.

**executeTyped(goalIndex: uint32)**
- `goalIndex`: The goal index to claim

```typescript
await goalClaimSystem.executeTyped(goalIndex);
```

#### RelationshipAdvanceSystem
**ID**: `system.relationship.advance`  
**Encoded ID**: `0xed2c7bf596a173ec086ba5707977b7f4720b67a93bc4b1bfe938da0b7e53c941`

Advance a relationship.

**executeTyped(targetId: uint256)**
- `targetId`: The target entity ID

```typescript
await relationshipAdvanceSystem.executeTyped(targetId);
```

#### ScavengeClaimSystem
**ID**: `system.scavenge.claim`  
**Encoded ID**: `0x688e3fa170b8b4e4646c37eeea4c877c977d801ff735c03cec4eb263a8be10c5`

Claim scavenge rewards.

**executeTyped(nodeIndex: uint32)**
- `nodeIndex`: The node index to claim from

```typescript
await scavengeClaimSystem.executeTyped(nodeIndex);
```

#### ItemBurnSystem
**ID**: `system.item.burn`  
**Encoded ID**: `0xbdaba8a0568bc1028eb8feaf4fc4a55c21a880db12b9226780cc53ca27825618`

Burn an item.

**executeTyped(itemIndex: uint32, amount: uint32)**
- `itemIndex`: The item index to burn
- `amount`: The amount to burn

```typescript
await itemBurnSystem.executeTyped(itemIndex, amount);
```

#### DroptableRevealSystem
**ID**: `system.droptable.item.reveal`  
**Encoded ID**: `0xe63e35fb18d6b703fb244bb211f40fa74f8c94730911eee3b90f33c5348211ae`

Reveal a droptable item.

**executeTyped(droptableId: uint256)**
- `droptableId`: The droptable ID

```typescript
await droptableRevealSystem.executeTyped(droptableId);
```

#### EchoKamisSystem
**ID**: `system.echo.kamis`  
**Encoded ID**: `0x048b2e771fd71b035d2e2eef061bf6327834cb83e983441c1b82227c42bcd030`

Echo kamis in a room.

**executeTyped(roomIndex: uint32)**
- `roomIndex`: The room index

```typescript
await echoKamisSystem.executeTyped(roomIndex);
```

#### EchoRoomSystem
**ID**: `system.echo.room`  
**Encoded ID**: `0x2d1514b5fef7843953693554a578305b838b35b0568bff18d1f9e83bc8170ebb`

Echo room information.

**executeTyped(roomIndex: uint32)**
- `roomIndex`: The room index

```typescript
await echoRoomSystem.executeTyped(roomIndex);
```

#### GetterSystem
**ID**: `system.getter`  
**Encoded ID**: `0xde291686da058fbcb5e9a4b6a8b07d5decdc9964821cd22748ad21dd0f623d31`  
**Contract Address**: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`

Read-only system for querying game state. This system provides view functions to retrieve account and Kami data.

**getAccount(id: uint256)**: Returns AccountShape with account information
- `id`: The account entity ID
- Returns: `AccountShape` containing index, name, current stamina, and room

**getKami(id: uint256)**: Returns complete Kami data structure
- `id`: The Kami entity ID
- Returns: `KamiShape` with all Kami information including stats, traits, affinities, level, XP, etc.

**getKamiByIndex(index: uint32)**: Returns Kami data by index
- `index`: The Kami index (0-based)
- Returns: `KamiShape` with all Kami information
- Throws: "Kami not found" if index doesn't exist

```typescript
// Get account data
const accountId = ethers.BigNumber.from('123');
const account = await getterSystem.getAccount(accountId);
console.log(account.name, account.room);

// Get Kami by ID
const kamiId = ethers.BigNumber.from('456');
const kami = await getterSystem.getKami(kamiId);
console.log(kami.name, kami.level.toString());

// Get Kami by index
const kamiByIndex = await getterSystem.getKamiByIndex(0);
console.log(kamiByIndex.name, kamiByIndex.stats.health.base.toString());
```

## Components Reference

Components store game state data. Key components include:

### Identity Components
- `AddressOwnerComponent`: Owner address mapping
- `AddressOperatorComponent`: Operator address mapping
- `IDRoomComponent`: Room ID for entities
- `IDParentComponent`: Parent entity ID
- `IDTypeComponent`: Entity type

### Stat Components
- `HealthComponent`: Health stat
- `PowerComponent`: Power stat
- `HarmonyComponent`: Harmony stat
- `ViolenceComponent`: Violence stat
- `StaminaComponent`: Stamina stat
- `SlotsComponent`: Inventory slots

### Gameplay Components
- `LevelComponent`: Entity level
- `ExperienceComponent`: Experience points
- `NameComponent`: Entity name
- `StateComponent`: Entity state
- `LocationComponent`: Entity location
- `RarityComponent`: Item/Kami rarity

### Index Components
- `KamiIndex`: Kami index
- `ItemIndex`: Item index
- `RoomIndex`: Room index
- `QuestIndex`: Quest index
- `SkillIndex`: Skill index
- `AccountIndex`: Account index

### Time Components
- `TimeComponent`: General time
- `TimeLastActionComponent`: Last action timestamp
- `TimeStartComponent`: Start time
- `TimeResetComponent`: Reset time
- `TimelockComponent`: Timelock data

See `ids/components.json` for the complete list of components and their encoded IDs.

## Code Examples

### Complete Example: Register Account and Mint Kami

```typescript
import { ethers } from 'ethers';
import WorldABI from './abi/World.json';
import AccountRegisterSystemABI from './abi/AccountRegisterSystem.json';
import KamiGachaMintSystemABI from './abi/KamiGachaMintSystem.json';
import systems from './ids/systems.json';

// Setup
const provider = new ethers.providers.JsonRpcProvider('https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz');
const wallet = new ethers.Wallet(privateKey, provider);
const worldAddress = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7'; // World contract address
const world = new ethers.Contract(worldAddress, WorldABI.abi, wallet);

// Step 1: Register Account
const accountRegisterSystemAddress = await world.systems(
  systems.AccountRegisterSystem.encodedID
);
const accountRegisterSystem = new ethers.Contract(
  accountRegisterSystemAddress,
  AccountRegisterSystemABI.abi,
  wallet
);

const operatorAddress = wallet.address;
const accountName = 'MyAccount';
const registerTx = await accountRegisterSystem.executeTyped(
  operatorAddress,
  accountName
);
await registerTx.wait();
console.log('Account registered!');

// Step 2: Mint Kami
const kamiGachaMintSystemAddress = await world.systems(
  systems.KamiGachaMintSystem.encodedID
);
const kamiGachaMintSystem = new ethers.Contract(
  kamiGachaMintSystemAddress,
  KamiGachaMintSystemABI.abi,
  wallet
);

const mintTx = await kamiGachaMintSystem.executeTyped(1);
const receipt = await mintTx.wait();
console.log('Kami minted!', receipt.transactionHash);
```

### Example: Read Account and Kami Data

```typescript
import GetterSystemABI from './abi/GetterSystem.json';

// Use direct contract address (faster)
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const getterSystem = new ethers.Contract(
  GETTER_SYSTEM_ADDRESS,
  GetterSystemABI.abi,
  provider // Use provider, not wallet for reads
);

// Get Account by ID
const accountId = ethers.BigNumber.from('123');
const account = await getterSystem.getAccount(accountId);
console.log('Account Name:', account.name);
console.log('Account Index:', account.index);
console.log('Current Stamina:', account.currStamina.toString());
console.log('Room:', account.room);

// Get Kami by ID
const kamiId = ethers.BigNumber.from('456');
const kami = await getterSystem.getKami(kamiId);
console.log('Kami Name:', kami.name);
console.log('Kami Level:', kami.level.toString());
console.log('Kami XP:', kami.xp.toString());
console.log('Health:', kami.stats.health.base.toString());
console.log('Power:', kami.stats.power.base.toString());
console.log('Traits:', {
  face: kami.traits.face,
  hand: kami.traits.hand,
  body: kami.traits.body,
  background: kami.traits.background,
  color: kami.traits.color
});
console.log('Affinities:', kami.affinities);

// Get Kami by index
const kamiByIndex = await getterSystem.getKamiByIndex(0);
console.log('Kami by Index:', kamiByIndex.name);
```

### Example: Accept Quest

```typescript
import QuestAcceptSystemABI from './abi/QuestAcceptSystem.json';

const questAcceptSystemAddress = await world.systems(
  systems.QuestAcceptSystem.encodedID
);
const questAcceptSystem = new ethers.Contract(
  questAcceptSystemAddress,
  QuestAcceptSystemABI.abi,
  wallet
);

const assignerId = ethers.BigNumber.from('456');
const questIndex = 0;

const tx = await questAcceptSystem.executeTyped(assignerId, questIndex);
await tx.wait();
console.log('Quest accepted!');
```

### Example: Buy Items from Listing

```typescript
import ListingBuySystemABI from './abi/ListingBuySystem.json';

const listingBuySystemAddress = await world.systems(
  systems.ListingBuySystem.encodedID
);
const listingBuySystem = new ethers.Contract(
  listingBuySystemAddress,
  ListingBuySystemABI.abi,
  wallet
);

const merchantIndex = 0;
const itemIndices = [1, 2, 3];
const amounts = [1, 2, 1];

const tx = await listingBuySystem.executeTyped(
  merchantIndex,
  itemIndices,
  amounts
);
await tx.wait();
console.log('Items purchased!');
```

### Example: Using provider.call() Pattern

This pattern is useful when you want more control or want to avoid creating contract instances:

```typescript
import { ethers, Interface } from 'ethers';
import GetterSystemABI from './abi/GetterSystem.json';

const provider = new ethers.providers.JsonRpcProvider(
  'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'
);
const GETTER_SYSTEM_ADDRESS = '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const iface = new Interface(GetterSystemABI.abi);

// Get Account
const accountId = ethers.BigNumber.from('123');
const accountEncoded = iface.encodeFunctionData('getAccount', [accountId]);
const accountResult = await provider.call({
  to: GETTER_SYSTEM_ADDRESS,
  data: accountEncoded,
});
const account = iface.decodeFunctionResult('getAccount', accountResult)[0];
console.log('Account:', account.name);

// Get Kami by Index
const kamiIndex = 0;
const kamiEncoded = iface.encodeFunctionData('getKamiByIndex', [kamiIndex]);
const kamiResult = await provider.call({
  to: GETTER_SYSTEM_ADDRESS,
  data: kamiEncoded,
});
const kami = iface.decodeFunctionResult('getKamiByIndex', kamiResult)[0];
console.log('Kami:', kami.name, 'Level:', kami.level.toString());
```

### Example: Using viem

```typescript
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Define Yominet chain (replace with actual values)
const yominetChain = {
  id: 12345, // Replace with actual chain ID
  name: 'Yominet',
  network: 'yominet',
  nativeCurrency: {
    decimals: 18,
    name: 'YOMI',
    symbol: 'YOMI',
  },
  rpcUrls: {
    default: {
      http: ['https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz'],
    },
  },
};

const account = privateKeyToAccount('0x...');
const publicClient = createPublicClient({
  chain: yominetChain,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: yominetChain,
  transport: http(),
});

// Read from World
const worldAddress = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const systemAddress = await publicClient.readContract({
  address: worldAddress,
  abi: WorldABI.abi,
  functionName: 'systems',
  args: [systems.AccountRegisterSystem.encodedID],
});

// Write transaction
const hash = await walletClient.writeContract({
  address: systemAddress,
  abi: AccountRegisterSystemABI.abi,
  functionName: 'executeTyped',
  args: [account.address, 'MyAccount'],
});

// Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log('Transaction confirmed:', receipt.transactionHash);
```

## Error Handling

### Common Errors

1. **Insufficient Funds**: Ensure wallet has enough YOMI for gas
2. **Unauthorized**: Check that the caller has permission
3. **Invalid Parameters**: Verify parameter types and values
4. **System Deprecated**: System may have been deprecated

### Error Handling Pattern

```typescript
try {
  const tx = await system.executeTyped(...args);
  const receipt = await tx.wait();
  return receipt;
} catch (error) {
  if (error.reason) {
    console.error('Transaction reverted:', error.reason);
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough YOMI for gas');
  } else {
    console.error('Transaction failed:', error);
  }
  throw error;
}
```

## Best Practices

1. **Always use `executeTyped` when available** - It provides type safety
2. **Estimate gas before transactions** - Prevents failed transactions
3. **Handle errors gracefully** - Provide user-friendly error messages
4. **Use read-only providers for queries** - Saves gas and is faster
5. **Cache system addresses** - Reduces RPC calls
6. **Wait for confirmations** - Don't assume transactions are immediate
7. **Validate inputs client-side** - Catch errors before sending transactions

## Formulas Reference

For quick access to all game formulas and calculations, see **[KAMIGOTCHI_FORMULAS.md](./KAMIGOTCHI_FORMULAS.md)**.

This reference file contains:
- Experience and leveling formulas
- Harvesting calculations
- Affinity bonus formulas
- Build tier information
- Quick reference tables

## Network Information

### Yominet Network Configuration

**RPC URL**: `https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz`

**World Contract Address**: `0x2729174c265dbBd8416C6449E0E813E88f43D0E7`

**GetterSystem Contract Address**: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`

**Note**: Additional network details (Chain ID, Block Explorer URL, etc.) should be configured based on your Yominet network setup.

## License

[Add your license information here]

## Support

For issues and questions, please refer to the project repository or contact the development team.


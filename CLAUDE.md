# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains ABIs and a TypeScript API server for interacting with the Kamigotchi on-chain game built on the MUD framework, deployed on Yominet.

**Key Addresses:**
- World Contract: `0x2729174c265dbBd8416C6449E0E813E88f43D0E7`
- GetterSystem: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`
- RPC: `https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz`

## Repository Structure

```
kamigotchi-abis/
├── abi/                    # ABI JSON files for all contracts (*System.json, *Component.json)
├── ids/
│   ├── systems.json        # System IDs with encodedID hashes
│   └── components.json     # Component IDs with encodedID hashes
├── mapping/
│   ├── nodeNames.txt       # Node name mappings
│   ├── kami_trait_registry.json  # Kami trait definitions
│   └── levels.csv          # Level XP requirements
└── app/                    # TypeScript Express API server
    └── src/
        ├── services/       # Business logic (kamiService, accountService, farmingService)
        ├── routes/         # Express routes
        ├── utils/          # Mapping utilities
        └── test/           # Test scripts
```

## App Development Commands

```bash
cd app
npm install          # Install dependencies
npm run dev          # Run dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm run start        # Run compiled server
npm test             # Test Kami retrieval
npm run test:account # Test account Kami retrieval
```

## Architecture

### MUD Framework Pattern
- **World Contract**: Central registry managing all systems and components
- **Systems**: Executable contracts with game logic, called via `executeTyped()`
- **Components**: Data storage contracts, read via `getValue(entityId)`

### API Server Data Flow
```
Contract Call → Raw KamiShape/AccountShape → Mapping Functions → Enriched Response
```

The app uses ethers.js v6 to interact with contracts. Services fetch raw data from GetterSystem, then enrich it using mapping files (traits, levels, node names).

### System Interaction Pattern
```typescript
// Get system address from World
const systemId = systems.AccountRegisterSystem.encodedID;
const systemAddress = await worldContract.systems(systemId);
// Call system
await system.executeTyped(operator, name);
```

### Reading Data Pattern
```typescript
// Direct GetterSystem call (preferred)
const getterSystem = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI.abi, provider);
const kamiData = await getterSystem.getKamiByIndex(0);
const accountData = await getterSystem.getAccount(accountId);
```

## Key Game Concepts

- **Kami**: The main entity type (pets) with stats, traits, affinities, levels
- **Harvesting**: Kami collect MUSU from nodes; affected by Power, Intensity, Affinity
- **Affinity**: Type matchup bonuses based on Kami body/hand types vs node type
- **Skills**: Upgradeable abilities in skill trees (Harvester, Guardian, Enlightened, Predator)

See `KAMIGOTCHI_FORMULAS.md` for detailed game mechanics calculations.

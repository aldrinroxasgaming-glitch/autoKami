# Kamigotchi App

Backend API and services for interacting with the Kamigotchi World contract.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Build the project:
```bash
npm run build
```

## Development

Run in development mode with hot reload:
```bash
npm run dev
```

The API server will start on `http://localhost:3000` (or PORT from .env).

### API Endpoints

- `GET /health` - Health check
- `GET /api/kami/:id` - Get Kami by entity ID
- `GET /api/kami/index/:index` - Get Kami by index
- `GET /api/account/:accountId/kamis` - Get all Kamis for an account
- `POST /api/transaction/execute` - Execute system call transaction
- `GET /api/farming/calculate/:kamiId` - Calculate farming stats
- `POST /api/farming/calculate` - Calculate farming stats with custom params

See [PHASE3_STATUS.md](./PHASE3_STATUS.md) for detailed API documentation.

## Testing

### Test Kami Data Retrieval
```bash
npm test
```

This will:
- Retrieve a Kami by index
- Retrieve a Kami by ID
- Verify all mappings are working correctly

### Test Account-based Kami Retrieval
```bash
npm run test:account
```

This will:
- Retrieve all Kamis owned by an account ID
- Display the count and sample data
- Verify the IDOwnsKamiComponent query works correctly

**Note**: Update the `accountId` in `src/test/account-kamis.test.ts` with a real account ID for testing.

## Project Structure

```
app/
├── src/
│   ├── index.ts                # Express API server
│   ├── routes/
│   │   ├── kamiRoutes.ts       # Kami API routes
│   │   ├── accountRoutes.ts    # Account API routes
│   │   ├── transactionRoutes.ts # Transaction API routes
│   │   └── farmingRoutes.ts    # Farming calculation routes
│   ├── services/
│   │   ├── kamiService.ts      # Kami data retrieval service
│   │   ├── accountService.ts   # Account-based Kami retrieval
│   │   ├── transactionService.ts # System call transaction execution
│   │   └── farmingService.ts  # Farming/regeneration calculations
│   ├── utils/
│   │   └── mappings.ts         # Mapping utilities for nodes, levels, traits
│   └── test/
│       ├── kami-retrieval.test.ts  # Test script
│       └── account-kamis.test.ts   # Account retrieval test
├── package.json
└── tsconfig.json
```

## Features

### ✅ Completed

- **Kami Data Retrieval**: Retrieve Kami data by ID or index
- **Account-based Kami Retrieval**: Get all Kamis owned by an account ID
- **Data Mapping**: 
  - Node names mapped to room indices
  - Trait registry (body, hands, face, background, color) with stats
  - Level data with XP requirements
  - Affinities mapped from body/hand trait types
- **Real Data**: All functions use actual contract calls, no mock data

### ✅ Phase 3 Complete

- **API Endpoints**: REST API server with Express
  - GET `/api/kami/:id` - Get Kami by entity ID
  - GET `/api/kami/index/:index` - Get Kami by index
  - GET `/api/account/:accountId/kamis` - Get all Kamis for an account
  - POST `/api/transaction/execute` - Execute system call transactions
  - GET/POST `/api/farming/calculate` - Calculate farming stats and regeneration

- **Transaction Service**: Execute system calls (harvest, move, etc.)
- **Farming Calculations**: Harvest output, affinity bonuses, regeneration times

See [PHASE3_STATUS.md](./PHASE3_STATUS.md) for details.


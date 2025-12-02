# Phase 3: API Endpoints, Transactions & Farming Calculations - COMPLETE ✅

## Implementation

### API Server: `src/index.ts`

Express server with CORS enabled, running on port 3000 (configurable via PORT env var).

**Endpoints**:
- `GET /health` - Health check
- `GET /api/kami/:id` - Get Kami by entity ID
- `GET /api/kami/index/:index` - Get Kami by index
- `GET /api/account/:accountId/kamis` - Get all Kamis for an account
- `POST /api/transaction/execute` - Execute system call transaction
- `GET /api/farming/calculate/:kamiId` - Calculate farming stats
- `POST /api/farming/calculate` - Calculate farming stats with custom params

### Transaction Service: `src/services/transactionService.ts`

**Function**: `executeSystemCall(params: ExecuteSystemCallParams)`

**Features**:
- Gets system address from World contract using system ID
- Loads system ABI automatically
- Supports both `executeTyped()` and `execute()` methods
- Handles wallet signing with private key
- Returns transaction hash

**Supported Systems**:
- HarvestStartSystem, HarvestStopSystem, HarvestCollectSystem, HarvestLiquidateSystem
- AccountRegisterSystem, AccountMoveSystem, AccountSetNameSystem, AccountSetOperatorSystem
- KamiNameSystem, KamiLevelSystem, KamiUseItemSystem
- SkillUpgradeSystem, SkillResetSystem
- CraftSystem
- ListingSellSystem, ListingBuySystem

**Usage**:
```typescript
const result = await executeSystemCall({
  systemId: 'system.harvest.start',
  typedParams: [nodeIndex], // uint32
  privateKey: '0x...'
});
```

### Farming Service: `src/services/farmingService.ts`

**Functions**:
- `getFarmingStats(kamiId, nodeIndex?, duration?)` - Comprehensive farming stats
- `calculateHarvestOutput(kamiId, nodeIndex?, duration?)` - Harvest calculations only
- `calculateRegenerationTime(kamiId)` - Regeneration calculations only

**Calculations**:
1. **Harvest Output**:
   - Base MUSU/hour from Power stat
   - Intensity multiplier (ramps up over time)
   - Affinity bonus (based on body/hand type matchups with node)
   - Total MUSU/hour and estimated MUSU for duration

2. **Regeneration**:
   - Health regen/second (based on Harmony stat)
   - Stamina regen/second
   - Time to full health/stamina

3. **Affinity Bonus**:
   - Based on KAMIGOTCHI_FORMULAS.md
   - Body type match: +0.65 + fertilityBoost
   - Hand type match: +0.35 + fertilityBoost
   - Mismatches apply penalties

### Routes

**Kami Routes** (`src/routes/kamiRoutes.ts`):
- GET `/api/kami/:id` - Get by entity ID
- GET `/api/kami/index/:index` - Get by index

**Account Routes** (`src/routes/accountRoutes.ts`):
- GET `/api/account/:accountId/kamis` - Get all Kamis

**Transaction Routes** (`src/routes/transactionRoutes.ts`):
- POST `/api/transaction/execute` - Execute system call

**Farming Routes** (`src/routes/farmingRoutes.ts`):
- GET `/api/farming/calculate/:kamiId` - Calculate with query params
- POST `/api/farming/calculate` - Calculate with body params

**Harvest Routes** (`src/routes/harvestRoutes.ts`):
- POST `/api/harvest/start` - Start harvesting for a Kami
- POST `/api/harvest/stop` - Stop harvesting (by harvestId or kamiId)
- POST `/api/harvest/collect` - Collect without stopping
- GET `/api/harvest/status/:kamiId` - Check if Kami is harvesting

### Harvest Service: `src/services/harvestService.ts`

**Functions**:
- `startHarvest(params)` - Start harvesting at a node
- `stopHarvest(params)` - Stop harvesting by harvest entity ID
- `collectHarvest(params)` - Collect without stopping
- `stopHarvestByKamiId(kamiId, privateKey)` - Stop by looking up harvest ID
- `collectHarvestByKamiId(kamiId, privateKey)` - Collect by looking up harvest ID
- `getHarvestIdForKami(kamiId)` - Get active harvest entity ID for a Kami

**Key Insights**:
1. Stopping/collecting requires the **harvest entity ID**, not the Kami ID
2. The harvest entity ID is **deterministically computed** from the Kami ID using:
   ```
   harvestId = keccak256(abi.encodePacked("harvest", kamiID))
   ```
3. This allows direct lookup of harvest ID from Kami ID without needing an indexer

## Usage Examples

### Start API Server

```bash
npm run dev
# or
npm start
```

### API Calls

```bash
# Get Kami by ID
curl http://localhost:3000/api/kami/33115402895635757582071775276554103979325911423173491581495089897666480874332

# Get Kami by index
curl http://localhost:3000/api/kami/index/6609

# Get all Kamis for account
curl http://localhost:3000/api/account/428395918952713945797547645073977871254434031276/kamis

# Calculate farming stats
curl http://localhost:3000/api/farming/calculate/33115402895635757582071775276554103979325911423173491581495089897666480874332?nodeIndex=12&duration=3600

# Execute transaction (requires private key)
curl -X POST http://localhost:3000/api/transaction/execute \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "system.harvest.start",
    "typedParams": [12],
    "privateKey": "0x..."
  }'

# Start harvesting (dedicated harvest endpoint)
curl -X POST http://localhost:3000/api/harvest/start \
  -H "Content-Type: application/json" \
  -d '{
    "kamiId": "33115402895635757582071775276554103979325911423173491581495089897666480874332",
    "nodeIndex": 10,
    "privateKey": "0x..."
  }'

# Stop harvesting (by Kami ID - auto-looks up harvest entity)
curl -X POST http://localhost:3000/api/harvest/stop \
  -H "Content-Type: application/json" \
  -d '{
    "kamiId": "33115402895635757582071775276554103979325911423173491581495089897666480874332",
    "privateKey": "0x..."
  }'

# Check harvest status
curl http://localhost:3000/api/harvest/status/33115402895635757582071775276554103979325911423173491581495089897666480874332
```

## Verification

To test the API:

1. Start the server: `npm run dev`
2. Test health endpoint: `curl http://localhost:3000/health`
3. Test Kami retrieval endpoints with real IDs
4. Test farming calculations with real Kami IDs
5. Test transaction execution (requires valid private key with YOMI tokens)

## Next Steps

- [ ] Add authentication/authorization for transaction endpoints
- [ ] Add rate limiting
- [ ] Add request validation middleware
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add caching for frequently accessed data
- [ ] Add WebSocket support for real-time updates
- [ ] Enhance farming calculations with actual node data
- [ ] Add batch transaction support


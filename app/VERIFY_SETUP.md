# Setup Verification Guide

## Step 1: Install Dependencies

```bash
cd app
npm install
```

## Step 2: Test Kami Data Retrieval

Run the test script to verify everything works with real data:

```bash
npm test
```

This will:
1. Connect to the Yominet RPC
2. Call the GetterSystem contract at `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`
3. Retrieve Kami data by index (starting from 0)
4. Map all the data using the mapping files:
   - Node names from `mapping/nodeNames.txt`
   - Trait data from `mapping/kami_trait_registry.json`
   - Level data from `mapping/levels.csv`

## Expected Output

You should see:
- ✓ Success message with Kami data
- Full JSON output showing:
  - Basic info (id, name, level, state)
  - Stats (health, power, harmony, violence with base/shift/boost/sync)
  - Traits (face, hand, body, background, color) with names and types
  - Room information with mapped name
  - Level data with XP requirements
  - Affinities array

## Troubleshooting

### Error: "Failed to retrieve Kami by index"
- Check RPC connection: `https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz`
- Verify contract address: `0x12C0989A259471D89D1bA1BB95043D64DAF97c19`
- Try a different index (some may not exist)

### Error: "Cannot find module"
- Run `npm install` again
- Check that all files are in place:
  - `abi/GetterSystem.json`
  - `mapping/nodeNames.txt`
  - `mapping/levels.csv`
  - `mapping/kami_trait_registry.json`

### Error: "ENOENT" (file not found)
- Ensure you're running from the `app` directory
- Check that mapping files exist in `../mapping/` relative to `app/src/`

## Next Steps

Once this test passes, the Kami retrieval feature is 100% complete and ready for:
- API endpoint integration
- Account-based retrieval
- Frontend integration


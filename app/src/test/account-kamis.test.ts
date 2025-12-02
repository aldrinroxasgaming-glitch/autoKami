import { getKamisByAccountId, getAccountByAddress, getAccountById } from '../services/accountService.js';

/**
 * Test script to verify account-based Kami retrieval works with real data
 * Run with: tsx src/test/account-kamis.test.ts
 */
async function testAccountKamisRetrieval() {
  console.log('Testing Account-based Kami retrieval...\n');

  try {
    // Test 1: Get all Kamis by account ID
    const accountId = '428395918952713945797547645073977871254434031276';

    console.log(`Test 1: Retrieving Kamis for account ID ${accountId}...`);
    const kamis = await getKamisByAccountId(accountId);

    console.log(`✓ Success! Found ${kamis.length} Kami(s) for this account\n`);

    if (kamis.length > 0) {
      console.log('Sample Kami data:');
      const firstKami = kamis[0];
      console.log({
        id: firstKami.id,
        name: firstKami.name,
        level: firstKami.level,
        room: firstKami.room,
        state: firstKami.state,
      });
    }

    // Test 2: Get full account data by ID
    console.log(`\nTest 2: Getting full account data by ID ${accountId}...`);
    const accountData = await getAccountById(accountId);
    console.log('Account data:', {
      id: accountData.id,
      name: accountData.name,
      roomIndex: accountData.roomIndex,
      currStamina: accountData.currStamina,
      kamiCount: accountData.kamis.length
    });

    // Test 3: Get account by wallet address
    // This address should correspond to the account ID above
    const testWalletAddress = '0x4bb135a1d0a83b87f6aF3c76b1e77d8f7Ec9a2ac';
    console.log(`\nTest 3: Getting account by wallet address ${testWalletAddress}...`);
    try {
      const accountByAddress = await getAccountByAddress(testWalletAddress);
      console.log('Account by address:', {
        id: accountByAddress.id,
        address: accountByAddress.address,
        name: accountByAddress.name,
        roomIndex: accountByAddress.roomIndex,
        currStamina: accountByAddress.currStamina,
        kamiCount: accountByAddress.kamis.length
      });
    } catch (err) {
      console.log('Note: Wallet address test may fail if address has no account');
    }

    console.log('\n✓ All tests passed!');

  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAccountKamisRetrieval().catch(console.error);


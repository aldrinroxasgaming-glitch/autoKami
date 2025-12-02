import { getKamiByIndex, getKamiById } from '../services/kamiService.js';

/**
 * Test script to verify Kami data retrieval works with real data
 * Run with: npm test
 */
async function testKamiRetrieval() {
  console.log('Testing Kami data retrieval...\n');

  try {
    // Test 1: Get Kami by index (starting from 0)
    console.log('Test 1: Retrieving Kami by index 8191..');
    const kamiByIndex = await getKamiByIndex(8191);
    console.log('✓ Success! Retrieved Kami:', {
      id: kamiByIndex.id,
      name: kamiByIndex.name,
      level: kamiByIndex.level,
      room: kamiByIndex.room,
      state: kamiByIndex.state,
    });
    console.log('Full data:', JSON.stringify(kamiByIndex, null, 2));
    console.log('\n');

    // Test 2: Get Kami by ID (using the ID from test 1)
    if (kamiByIndex.id) {
      console.log('Test 2: Retrieving Kami by ID...');
      const kamiById = await getKamiById(kamiByIndex.id);
      console.log('✓ Success! Retrieved Kami:', {
        id: kamiById.id,
        name: kamiById.name,
        level: kamiById.level,
      });
      console.log('\n');
    }

    // Test 3: Verify mappings are working
    console.log('Test 3: Verifying mappings...');
    console.log('Room name:', kamiByIndex.room.name);
    console.log('Body trait:', kamiByIndex.traits.body);
    console.log('Hand trait:', kamiByIndex.traits.hand);
    console.log('Face trait:', kamiByIndex.traits.face);
    console.log('Level data:', kamiByIndex.levelData);
    console.log('\n✓ All tests passed!');

  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testKamiRetrieval().catch(console.error);


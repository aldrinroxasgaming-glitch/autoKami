import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testRefreshEndpoint() {
    console.log('🧪 Testing /api/kamigotchis/refresh endpoint\n');

    try {
        const response = await axios.post(`${API_URL}/kamigotchis/refresh`, {
            privyUserId: 'test-privy-user-123' // This will create/get user and refresh their kamis
        });

        console.log('✅ Refresh successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('❌ Request failed');
            console.error('Status:', error.response?.status);
            console.error('Error:', JSON.stringify(error.response?.data, null, 2));
        } else {
            console.error('❌ Unexpected error:', error);
        }
    }
}

testRefreshEndpoint();

import { getOrCreateUser, logSystemEvent, getSystemLogs } from '../services/supabaseService.js';

const TEST_PRIVY_ID = 'test-logger-user-direct';

async function testLoggingFlow() {
    console.log('🧪 Testing System Logging Flow (Direct Service Calls)\n');

    try {
        // 1. Setup User
        const user = await getOrCreateUser(TEST_PRIVY_ID);
        console.log('✅ User setup complete:', user.id);

        // 2. Generate Logs
        console.log('Generating test logs...');
        
        await logSystemEvent({
            user_id: user.id,
            action: 'test_action',
            status: 'info',
            message: 'Test info log entry'
        });

        await logSystemEvent({
            user_id: user.id,
            action: 'test_action',
            status: 'success',
            message: 'Test success log entry',
            metadata: { test: true }
        });

        await logSystemEvent({
            user_id: user.id,
            action: 'test_action',
            status: 'error',
            message: 'Test error log entry'
        });

        console.log('✅ Generated 3 logs');

        // 3. Fetch Logs
        console.log('Fetching System Logs...');
        const logs = await getSystemLogs(user.id);

        console.log(`✅ Retrieved ${logs.length} logs`);

        if (logs.length === 0) {
            console.error('❌ No logs found! Logging failed.');
            return;
        }

        // 4. Verify Logs
        console.log('\n📋 Recent Logs:');
        logs.slice(0, 5).forEach((log: any) => {
            console.log(`[${log.created_at}] [${log.status.toUpperCase()}] ${log.action}: ${log.message}`);
        });

        // Check for specific log messages
        const hasInfo = logs.some((l: any) => l.message === 'Test info log entry');
        const hasSuccess = logs.some((l: any) => l.message === 'Test success log entry');
        const hasError = logs.some((l: any) => l.message === 'Test error log entry');

        if (hasInfo && hasSuccess && hasError) {
            console.log('\n✅ Found all test logs!');
        } else {
            console.error('\n❌ Missing some test logs');
            if (!hasInfo) console.error('- Missing info log');
            if (!hasSuccess) console.error('- Missing success log');
            if (!hasError) console.error('- Missing error log');
        }

        console.log('\n🎉 Logging Flow Test Complete!');

    } catch (error) {
        console.error('❌ Test Failed:', error instanceof Error ? error.message : error);
    }
}

testLoggingFlow();

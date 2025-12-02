import { telegram } from '../services/telegram.js';

async function main() {
  console.log('Testing Telegram Service...');

  // Test Info Log
  console.log('Sending log message...');
  const logResult = await telegram.sendLog('This is a test log message from the Kami Automation System.', {
    script: 'testTelegram.ts',
    status: 'running'
  });
  console.log('Log send result:', logResult);

  // Test Error Log
  console.log('Sending error message...');
  const errorResult = await telegram.sendError('This is a simulated error for testing purposes.', new Error('Simulated fatal error'));
  console.log('Error send result:', errorResult);
}

main();

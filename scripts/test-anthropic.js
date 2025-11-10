const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

async function testAnthropic() {
  console.log('🤖 Testing Anthropic API...');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "Hello from Claude!"' }],
    });

    console.log('✅ Anthropic API connected!');
    console.log('🤖 Response:', response.content[0].text);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAnthropic();

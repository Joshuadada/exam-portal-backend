import { registerAs } from '@nestjs/config';

// export default registerAs('anthropic', () => ({
//   apiKey: process.env.ANTHROPIC_API_KEY,
//   model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
//   temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE ?? "0.3") || 0.3,
//   maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? "4000", 10) || 4000,
// }));


export default registerAs('anthropic', () => ({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
  temperature: Number(process.env.ANTHROPIC_TEMPERATURE ?? 0.3),
  maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 4000),
}));

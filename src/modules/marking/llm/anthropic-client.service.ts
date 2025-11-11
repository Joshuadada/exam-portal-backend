import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicClientService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('anthropic.apiKey'),
    });
    this.model = this.configService.get<string>('anthropic.model') || 'claude-sonnet-4-20250514';
    this.temperature = this.configService.get<number>('anthropic.temperature') || 0.3;
    this.maxTokens = this.configService.get<number>('anthropic.maxTokens') ?? 4000;
  }

  async complete(prompt: string, systemPrompt?: string) {
    const startTime = Date.now();

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt || this.getDefaultSystemPrompt(),
      messages: [{ role: 'user', content: prompt }],
    });

    const processingTime = Date.now() - startTime;
    const content = response.content[0];

    return {
      text: content.type === 'text' ? content.text : '',
      rawResponse: response,
      processingTime,
      model: this.model,
    };
  }

  private getDefaultSystemPrompt(): string {
    return `You are an expert academic examiner. Evaluate student answers objectively and provide fair, constructive feedback. Always respond with valid JSON only, no markdown formatting.`;
  }
}

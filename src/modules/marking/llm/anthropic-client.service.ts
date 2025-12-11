import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicClientService {
  private readonly logger = new Logger(AnthropicClientService.name);
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  // constructor(private configService: ConfigService) {
  //   this.client = new Anthropic({
  //     apiKey: this.configService.get<string>('anthropic.apiKey'),
  //   });
  //   this.model = this.configService.get<string>('anthropic.model');
  //   this.temperature = this.configService.get<number>('anthropic.temperature');
  //   this.maxTokens = this.configService.get<number>('anthropic.maxTokens');

  //   this.logger.log(`Initialized Anthropic client with model: ${this.model}`);
  // }

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('anthropic.apiKey');
  
    if (!apiKey) {
      throw new Error('Anthropic API key is missing. Set ANTHROPIC_API_KEY in the environment.');
    }
  
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  
    this.model = this.configService.get<string>('anthropic.model')!;
    this.temperature = this.configService.get<number>('anthropic.temperature')!;
    this.maxTokens = this.configService.get<number>('anthropic.maxTokens')!;
  }
  
  

  async complete(prompt: string, systemPrompt?: string) {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt || this.getDefaultSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const processingTime = Date.now() - startTime;
      const content = response.content[0];

      this.logger.debug(`LLM response received in ${processingTime}ms`);

      return {
        text: content.type === 'text' ? content.text : '',
        rawResponse: response,
        processingTime,
        model: this.model,
      };
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are an expert academic examiner with years of experience in fair and consistent marking. Your role is to:

1. Evaluate student answers objectively against marking guides
2. Identify key concepts and understanding demonstrated
3. Award marks fairly based on rubrics
4. Provide constructive, specific feedback
5. Recognize partial understanding and award appropriate credit
6. Flag answers that need human expert review
7. Maintain academic integrity and consistency

You must be:
- Fair and unbiased
- Thorough in evaluation
- Clear in feedback
- Consistent with marking standards
- Honest about confidence levels

Always respond with valid JSON only, no additional text or markdown formatting.`;
  }

  getModel(): string {
    return this.model;
  }
}

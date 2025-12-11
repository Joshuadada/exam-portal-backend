import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarkingController } from './marking.controller';
import { MarkingService } from './marking.service';
import { MarkingRepository } from './marking.repository';
import { LLMMarkingService } from './llm/llm-marking.service';
import { AnthropicClientService } from './llm/anthropic-client.service';
import { PromptBuilderService } from './llm/prompt-builder.service';

@Module({
  imports: [ConfigModule],
  controllers: [MarkingController],
  providers: [
    MarkingService,
    MarkingRepository,
    LLMMarkingService,
    AnthropicClientService,
    PromptBuilderService,
  ],
  exports: [MarkingService, LLMMarkingService],
})
export class MarkingModule {}
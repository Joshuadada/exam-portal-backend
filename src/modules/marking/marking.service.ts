import { Injectable } from '@nestjs/common';
import { MarkingRepository } from './marking.repository';
import { LLMMarkingService } from './llm/llm-marking.service';

@Injectable()
export class MarkingService {
  constructor(
    private readonly repository: MarkingRepository,
    private readonly llmMarkingService: LLMMarkingService,
  ) {}

  async markSingleAnswer(answerId: string, guide: any) {
    const answer = { id: answerId, max_marks: 20 }; // TODO: Get from DB
    const result = await this.llmMarkingService.markAnswer(answer, guide);
    await this.repository.saveMarkingResult(result);
    return result;
  }

  async getMarkingResults(attemptId: string) {
    return this.repository.getResultsByAttemptId(attemptId);
  }
}

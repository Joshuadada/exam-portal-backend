import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MarkingService } from './marking.service';

@Controller('marking')
export class MarkingController {
  constructor(private readonly service: MarkingService) {}

  @Post('test')
  async testMarking(@Body() body: { answerId: string; guideId: string }) {
    // TODO: Get guide from DB
    const testGuide = {
      id: body.guideId,
      model_answer: 'Test model answer',
      key_points: [{ point: 'Test point', marks: 5, required: true }],
      evaluation_criteria: {
        content_accuracy: 'Test',
        completeness: 'Test',
        clarity: 'Test',
        technical_correctness: 'Test',
      },
      content_accuracy_weight: 0.4,
      completeness_weight: 0.3,
      clarity_weight: 0.15,
      technical_correctness_weight: 0.15,
    };

    return this.service.markSingleAnswer(body.answerId, testGuide);
  }

  @Get('result/:attemptId')
  async getResults(@Param('attemptId') attemptId: string) {
    return this.service.getMarkingResults(attemptId);
  }
}

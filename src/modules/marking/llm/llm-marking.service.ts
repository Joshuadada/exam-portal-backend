import { Injectable, Logger } from '@nestjs/common';
import { AnthropicClientService } from './anthropic-client.service';
import { PromptBuilderService } from './prompt-builder.service';

@Injectable()
export class LLMMarkingService {
  private readonly logger = new Logger(LLMMarkingService.name);

  constructor(
    private readonly anthropicClient: AnthropicClientService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async markAnswer(answer: any, guide: any): Promise<any> {
    this.logger.log(`Marking answer ${answer.id}`);

    const prompt = this.promptBuilder.buildMarkingPrompt(answer, guide);
    const response = await this.anthropicClient.complete(prompt);
    const parsed = this.parseResponse(response.text);

    const awardedMarks = Math.min(
      Math.max(0, parsed.awarded_marks),
      answer.max_marks,
    );

    const requiresReview = this.shouldRequireReview(
      parsed,
      awardedMarks,
      answer.max_marks,
    );

    return {
      student_answer_id: answer.id,
      marking_guide_id: guide.id,
      llm_model: response.model,
      llm_provider: 'anthropic',
      awarded_marks: awardedMarks,
      max_marks: answer.max_marks,
      confidence_score: parsed.confidence_score,
      content_accuracy_score: parsed.content_accuracy_score,
      completeness_score: parsed.completeness_score,
      clarity_score: parsed.clarity_score,
      technical_correctness_score: parsed.technical_correctness_score,
      feedback: parsed.feedback,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      key_points_identified: parsed.key_points_identified || [],
      missing_points: parsed.missing_points || [],
      requires_human_review: requiresReview,
      review_reason: requiresReview ? this.getReviewReason(parsed) : null,
      request_payload: { prompt },
      response_payload: response.rawResponse,
      processing_time_ms: response.processingTime,
    };
  }

  private parseResponse(responseText: string): any {
    let cleanText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    return JSON.parse(cleanText);
  }

  private shouldRequireReview(parsed: any, awarded: number, max: number): boolean {
    if (parsed.requires_human_review === true) return true;
    if (parsed.confidence_score < 0.7) return true;

    const percentage = (awarded / max) * 100;
    if (percentage >= 95 || percentage <= 20) return true;

    return false;
  }

  private getReviewReason(parsed: any): string {
    const reasons: string[] = []; // explicitly type the array
  
    if (parsed.review_reason) {
      reasons.push(parsed.review_reason);
    }
  
    if (parsed.confidence_score !== undefined && parsed.confidence_score < 0.7) {
      reasons.push(`Low confidence (${(parsed.confidence_score * 100).toFixed(1)}%)`);
    }
  
    return reasons.length > 0 ? reasons.join('; ') : 'Flagged for review';
  }
  
  
}

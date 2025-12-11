import { Injectable, Logger } from '@nestjs/common';
import { AnthropicClientService } from './anthropic-client.service';
import { PromptBuilderService, MarkingGuide, StudentAnswer } from './prompt-builder.service';

export interface MarkingResult {
  student_answer_id: string;
  marking_guide_id: string;
  llm_model: string;
  llm_provider: string;
  awarded_marks: number;
  max_marks: number;
  confidence_score: number;
  content_accuracy_score: number;
  completeness_score: number;
  clarity_score: number;
  technical_correctness_score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  key_points_identified: any[];
  missing_points: string[];
  requires_human_review: boolean;
  review_reason: string | null;
  request_payload: any;
  response_payload: any;
  processing_time_ms: number;
}

@Injectable()
export class LLMMarkingService {
  private readonly logger = new Logger(LLMMarkingService.name);

  constructor(
    private readonly anthropicClient: AnthropicClientService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async markAnswer(
    answer: StudentAnswer,
    guide: MarkingGuide,
  ): Promise<MarkingResult> {
    this.logger.log(`Marking answer ${answer.id} for question ${answer.question_id}`);

    try {
      // Build the marking prompt
      const prompt = this.promptBuilder.buildMarkingPrompt(answer, guide);

      // Call LLM
      const response = await this.anthropicClient.complete(prompt);

      // Parse response
      const parsedResult = this.parseResponse(response.text);

      // Validate and cap marks
      const awardedMarks = Math.min(
        Math.max(0, parsedResult.awarded_marks),
        answer.max_marks,
      );

      // Determine if review is needed
      const requiresReview = this.shouldRequireReview(
        parsedResult,
        awardedMarks,
        answer.max_marks,
      );

      // Build final result
      const result: MarkingResult = {
        student_answer_id: answer.id,
        marking_guide_id: guide.id,
        llm_model: response.model,
        llm_provider: 'anthropic',
        awarded_marks: awardedMarks,
        max_marks: answer.max_marks,
        confidence_score: parsedResult.confidence_score,
        content_accuracy_score: parsedResult.content_accuracy_score,
        completeness_score: parsedResult.completeness_score,
        clarity_score: parsedResult.clarity_score,
        technical_correctness_score: parsedResult.technical_correctness_score,
        feedback: parsedResult.feedback,
        strengths: parsedResult.strengths || [],
        weaknesses: parsedResult.weaknesses || [],
        key_points_identified: parsedResult.key_points_identified || [],
        missing_points: parsedResult.missing_points || [],
        requires_human_review: requiresReview,
        review_reason: requiresReview ? this.getReviewReason(parsedResult, awardedMarks, answer.max_marks) : null,
        request_payload: { prompt },
        response_payload: response.rawResponse,
        processing_time_ms: response.processingTime,
      };

      this.logger.log(
        `Marked answer ${answer.id}: ${awardedMarks}/${answer.max_marks} (confidence: ${parsedResult.confidence_score.toFixed(2)})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error marking answer ${answer.id}:`, error);
      throw error;
    }
  }

  private parseResponse(responseText: string): any {
    try {
      // Remove any markdown formatting if present
      let cleanText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to find JSON object in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanText);

      // Validate required fields
      if (typeof parsed.awarded_marks !== 'number') {
        throw new Error('Missing or invalid awarded_marks');
      }

      if (typeof parsed.confidence_score !== 'number') {
        throw new Error('Missing or invalid confidence_score');
      }

      if (!parsed.feedback) {
        throw new Error('Missing feedback');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse LLM response:', error);
      this.logger.debug('Response text:', responseText);
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }

  private shouldRequireReview(
    parsed: any,
    awardedMarks: number,
    maxMarks: number,
  ): boolean {
    // Check if LLM flagged for review
    if (parsed.requires_human_review === true) {
      return true;
    }

    // Low confidence
    if (parsed.confidence_score < 0.7) {
      return true;
    }

    // Borderline score (within 5% of key thresholds)
    const percentage = (awardedMarks / maxMarks) * 100;
    const borderlineThresholds = [50, 60, 70, 80, 90];
    for (const threshold of borderlineThresholds) {
      if (Math.abs(percentage - threshold) <= 5) {
        return true;
      }
    }

    // Very high or very low score
    if (percentage >= 95 || percentage <= 20) {
      return true;
    }

    return false;
  }

  // private getReviewReason(parsed: any, awarded: number, max: number): string {
  //   const reasons = [];

  //   if (parsed.requires_human_review && parsed.review_reason) {
  //     reasons.push(parsed.review_reason);
  //   }

  //   if (parsed.confidence_score < 0.7) {
  //     reasons.push(`Low confidence (${(parsed.confidence_score * 100).toFixed(1)}%)`);
  //   }

  //   const percentage = (awarded / max) * 100;
  //   if (percentage >= 95) {
  //     reasons.push('Exceptionally high score requires verification');
  //   }
  //   if (percentage <= 20) {
  //     reasons.push('Very low score requires verification');
  //   }

  //   // Check borderline
  //   const borderlineThresholds = [50, 60, 70, 80, 90];
  //   for (const threshold of borderlineThresholds) {
  //     if (Math.abs(percentage - threshold) <= 5) {
  //       reasons.push(`Borderline score near ${threshold}% threshold`);
  //       break;
  //     }
  //   }

  //   return reasons.length > 0 ? reasons.join('; ') : 'Flagged for quality assurance review';
  // }

  private getReviewReason(parsed: any, awarded: number, max: number): string {
    const reasons: string[] = [];
  
    // Safety guard for parsed object
    if (!parsed || typeof parsed !== 'object') {
      return 'Invalid evaluation data provided';
    }
  
    // Human review flag
    if (parsed.requires_human_review && parsed.review_reason) {
      reasons.push(parsed.review_reason);
    }
  
    // Confidence score safety check
    if (typeof parsed.confidence_score === 'number') {
      if (parsed.confidence_score < 0.7) {
        reasons.push(`Low confidence (${(parsed.confidence_score * 100).toFixed(1)}%)`);
      }
    }
  
    // Safety check for scored values
    if (typeof awarded === 'number' && typeof max === 'number' && max > 0) {
      const percentage = (awarded / max) * 100;
  
      if (percentage >= 95) {
        reasons.push('Exceptionally high score requires verification');
      }
      if (percentage <= 20) {
        reasons.push('Very low score requires verification');
      }
  
      const borderlineThresholds = [50, 60, 70, 80, 90];
      for (const threshold of borderlineThresholds) {
        if (Math.abs(percentage - threshold) <= 5) {
          reasons.push(`Borderline score near ${threshold}% threshold`);
          break;
        }
      }
    } else {
      reasons.push('Invalid scoring values');
    }
  
    return reasons.length > 0 ? reasons.join('; ') : 'Flagged for quality assurance review';
  }
  
}

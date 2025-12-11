import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MarkingRepository } from './marking.repository';
import { LLMMarkingService } from './llm/llm-marking.service';
import { UserRole } from '../../shared/enums/user-role.enum';
import { AttemptStatus } from '../../shared/enums/attempt-status.enum';
import { ReviewMarkingDto } from './dto/review-marking.dto';

@Injectable()
export class MarkingService {
  private readonly logger = new Logger(MarkingService.name);

  constructor(
    private readonly repository: MarkingRepository,
    private readonly llmMarkingService: LLMMarkingService,
  ) {}

  async markSingleAnswer(answerId: string, guideId: string) {
    this.logger.log(`Marking single answer: ${answerId}`);

    // This would need actual implementations to fetch answer and guide
    // For now, returning a placeholder
    throw new BadRequestException(
      'Please use batch marking or provide full answer and guide objects',
    );
  }

  async batchMarkAttempt(attemptId: string, submissionsService: any, guidesService: any) {
    this.logger.log(`Starting batch marking for attempt: ${attemptId}`);

    // Get attempt details
    const attempt = await submissionsService.getAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Exam must be submitted before marking');
    }

    // Get all answers for this attempt
    const answers = await submissionsService.getAnswersByAttemptId(attemptId);

    //const results = [];
    const results: any[] = [];
    let totalMarks = 0;
    let requiresReviewCount = 0;

    // Mark each answer
    for (const answer of answers) {
      try {
        const guide = await guidesService.findByQuestionId(answer.question_id);

        if (!guide) {
          this.logger.warn(
            `No marking guide found for question ${answer.question_id}`,
          );
          continue;
        }

        const result = await this.llmMarkingService.markAnswer(answer, guide);
        await this.repository.saveMarkingResult(result);

        results.push(result);
        totalMarks += result.awarded_marks;

        if (result.requires_human_review) {
          requiresReviewCount++;
        }
      } catch (error) {
        this.logger.error(`Error marking answer ${answer.id}:`, error);
        // Continue with other answers
      }
    }

    // Calculate total score and update attempt
    const totalPossible = answers.reduce(
      (sum, a) => sum + parseFloat(a.max_marks),
      0,
    );
    const percentage = (totalMarks / totalPossible) * 100;
    const grade = this.calculateGrade(percentage);

    await submissionsService.updateAttemptScore(attemptId, {
      total_score: totalMarks,
      percentage,
      grade,
      status: AttemptStatus.GRADED,
    });

    this.logger.log(
      `Batch marking complete. ${results.length}/${answers.length} marked, ${requiresReviewCount} require review`,
    );

    return {
      attemptId,
      totalAnswers: answers.length,
      markedAnswers: results.length,
      requiresReview: requiresReviewCount,
      totalScore: totalMarks,
      totalPossible,
      percentage,
      grade,
    };
  }

  async getMarkingResults(
    attemptId: string,
    userId: string,
    userRole: UserRole,
    submissionsService: any,
  ) {
    const attempt = await submissionsService.getAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    // Students can only view their own results
    if (userRole === UserRole.STUDENT && attempt.student_id !== userId) {
      throw new ForbiddenException('You can only view your own results');
    }

    const results = await this.repository.getResultsByAttemptId(attemptId);

    return {
      attempt,
      results,
    };
  }

  async getReviewQueue(lecturerId: string, userRole: UserRole) {
    // Admins see all, lecturers see only their exams
    const queue = await this.repository.getReviewQueue(
      userRole === UserRole.ADMIN ? undefined : lecturerId,
    );

    return {
      total: queue.length,
      items: queue,
    };
  }

  async reviewMarking(
    markingId: string,
    reviewDto: ReviewMarkingDto,
    reviewerId: string,
  ) {
    const marking = await this.repository.findById(markingId);
    if (!marking) {
      throw new NotFoundException('Marking result not found');
    }

    // Save review
    const review = await this.repository.saveReview({
      llm_marking_id: markingId,
      reviewer_id: reviewerId,
      review_status: reviewDto.status,
      final_marks: reviewDto.finalMarks,
      reviewer_comments: reviewDto.comments,
      llm_accuracy_rating: reviewDto.accuracyRating,
    });

    // Update marking result if modified
    if (reviewDto.status === 'modified') {
      await this.repository.updateMarkingResult(markingId, {
        awarded_marks: reviewDto.finalMarks,
        requires_human_review: false,
      });

      // Would need to recalculate attempt totals here
      // await this.recalculateAttemptScore(marking.student_answer_id, submissionsService);
    }

    this.logger.log(
      `Marking ${markingId} reviewed with status: ${reviewDto.status}`,
    );

    return review;
  }

  async getMarkingStatistics(examId: string) {
    return this.repository.getExamStatistics(examId);
  }

  async getReviewStatistics(lecturerId?: string) {
    return this.repository.getReviewStatistics(lecturerId);
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}

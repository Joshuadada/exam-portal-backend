import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MarkingService } from './marking.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { BatchMarkDto } from './dto/batch-mark.dto';
import { ReviewMarkingDto } from './dto/review-marking.dto';
import { MarkAnswerDto } from './dto/mark-answer.dto';

@ApiTags('marking')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('marking')
export class MarkingController {
  constructor(private readonly markingService: MarkingService) {}

  @Post('answer')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark a single answer using LLM' })
  @ApiResponse({ status: 201, description: 'Answer marked successfully' })
  async markAnswer(@Body() markAnswerDto: MarkAnswerDto) {
    return this.markingService.markSingleAnswer(
      markAnswerDto.answerId,
      markAnswerDto.guideId,
    );
  }

  @Post('batch')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch mark all answers for an exam attempt' })
  @ApiResponse({
    status: 200,
    description: 'Batch marking completed',
    schema: {
      example: {
        success: true,
        data: {
          attemptId: '550e8400-e29b-41d4-a716-446655440000',
          totalAnswers: 5,
          markedAnswers: 5,
          requiresReview: 1,
          totalScore: 78,
          totalPossible: 100,
          percentage: 78,
          grade: 'C',
        },
      },
    },
  })
  async batchMark(
    @Body() batchMarkDto: BatchMarkDto,
    // Note: You'll need to inject SubmissionsService and MarkingGuidesService here
  ) {
    // This requires dependency injection of other services
    // For now, returning a note
    return {
      message:
        'Batch marking endpoint. Requires SubmissionsService and MarkingGuidesService injection.',
      attemptId: batchMarkDto.attemptId,
    };
  }

  @Get('result/:attemptId')
  @Roles(UserRole.LECTURER, UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get marking results for an attempt' })
  @ApiResponse({
    status: 200,
    description: 'Results retrieved successfully',
  })
  async getMarkingResults(
    @Param('attemptId') attemptId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    // Requires SubmissionsService injection
    return {
      message: 'Get results endpoint. Requires SubmissionsService injection.',
      attemptId,
    };
  }

  @Get('review-queue')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get answers flagged for human review' })
  @ApiResponse({
    status: 200,
    description: 'Review queue retrieved',
  })
  async getReviewQueue(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.markingService.getReviewQueue(userId, userRole);
  }

  @Patch('review/:markingId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Review and modify LLM marking' })
  @ApiResponse({
    status: 200,
    description: 'Review submitted successfully',
  })
  async reviewMarking(
    @Param('markingId') markingId: string,
    @Body() reviewDto: ReviewMarkingDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.markingService.reviewMarking(markingId, reviewDto, reviewerId);
  }

  @Get('statistics/exam/:examId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get marking statistics for an exam' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    schema: {
      example: {
        avg_confidence: 0.82,
        total_marked: 45,
        review_count: 8,
        avg_processing_time: 2340,
        avg_percentage: 73.4,
        very_low_confidence: 2,
        low_confidence: 6,
        high_confidence: 37,
      },
    },
  })
  async getStatistics(@Param('examId') examId: string) {
    return this.markingService.getMarkingStatistics(examId);
  }

  @Get('statistics/reviews')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get review statistics' })
  async getReviewStatistics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.markingService.getReviewStatistics(
      userRole === UserRole.ADMIN ? undefined : userId,
    );
  }
}

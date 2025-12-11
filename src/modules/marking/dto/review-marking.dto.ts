import { IsEnum, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewStatus {
  APPROVED = 'approved',
  MODIFIED = 'modified',
  REJECTED = 'rejected',
}

export class ReviewMarkingDto {
  @ApiProperty({ 
    description: 'Review decision',
    enum: ReviewStatus,
    example: ReviewStatus.MODIFIED
  })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiProperty({ 
    description: 'Final marks after review',
    example: 18
  })
  @IsNumber()
  @Min(0)
  finalMarks: number;

  @ApiPropertyOptional({ 
    description: 'Reviewer comments',
    example: 'LLM was too harsh on the complexity analysis section'
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiProperty({ 
    description: 'Rating of LLM accuracy (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  accuracyRating: number;
}

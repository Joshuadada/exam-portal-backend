import {
  IsUUID,
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KeyPointDto {
  @ApiProperty({ example: 'Definition of dynamic programming' })
  @IsString()
  point: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  marks: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ example: ['optimization', 'subproblems'] })
  @IsArray()
  @IsOptional()
  keywords?: string[];
}

export class CommonMistakeDto {
  @ApiProperty({ example: 'Confusing with divide-and-conquer' })
  @IsString()
  mistake: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  deduction: number;
}

export class PartialCreditRuleDto {
  @ApiProperty({ example: 'Correct definition but missing one property' })
  @IsString()
  condition: string;

  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  credit_percentage: number;
}

export class MarkingRubricDto {
  @ApiProperty()
  @IsObject()
  excellent: { criteria: string; range: [number, number] };

  @ApiProperty()
  @IsObject()
  good: { criteria: string; range: [number, number] };

  @ApiProperty()
  @IsObject()
  satisfactory: { criteria: string; range: [number, number] };

  @ApiProperty()
  @IsObject()
  poor: { criteria: string; range: [number, number] };
}

export class EvaluationCriteriaDto {
  @ApiProperty({ example: 'Correct explanation of DP concepts' })
  @IsString()
  content_accuracy: string;

  @ApiProperty({ example: 'All required elements present' })
  @IsString()
  completeness: string;

  @ApiProperty({ example: 'Well-structured explanation' })
  @IsString()
  clarity: string;

  @ApiProperty({ example: 'Accurate terminology' })
  @IsString()
  technical_correctness: string;
}

export class CreateMarkingGuideDto {
  @ApiProperty({ description: 'Question UUID' })
  @IsUUID()
  question_id: string;

  @ApiProperty({ example: 'Dynamic programming is an optimization technique...' })
  @IsString()
  model_answer: string;

  @ApiProperty({ type: [KeyPointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyPointDto)
  key_points: KeyPointDto[];

  @ApiProperty({ type: MarkingRubricDto })
  @IsObject()
  @ValidateNested()
  @Type(() => MarkingRubricDto)
  marking_rubric: MarkingRubricDto;

  @ApiProperty({ type: EvaluationCriteriaDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EvaluationCriteriaDto)
  evaluation_criteria: EvaluationCriteriaDto;

  @ApiPropertyOptional({ example: 0.40, description: 'Weight for content accuracy (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  content_accuracy_weight?: number;

  @ApiPropertyOptional({ example: 0.30 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  completeness_weight?: number;

  @ApiPropertyOptional({ example: 0.15 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  clarity_weight?: number;

  @ApiPropertyOptional({ example: 0.15 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  technical_correctness_weight?: number;

  @ApiPropertyOptional({ type: [CommonMistakeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommonMistakeDto)
  @IsOptional()
  common_mistakes?: CommonMistakeDto[];

  @ApiPropertyOptional({ type: [PartialCreditRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialCreditRuleDto)
  @IsOptional()
  partial_credit_rules?: PartialCreditRuleDto[];

  @ApiPropertyOptional({ example: ['dynamic programming', 'optimization'] })
  @IsArray()
  @IsOptional()
  keywords?: string[];
}

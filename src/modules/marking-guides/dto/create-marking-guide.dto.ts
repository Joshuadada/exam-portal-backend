import { IsUUID, IsString, IsArray, IsObject, IsOptional, IsNumber } from 'class-validator';

export class KeyPointDto {
  @IsString()
  point: string;

  @IsNumber()
  marks: number;

  required: boolean;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}

export class CreateMarkingGuideDto {
  @IsUUID()
  question_id: string;

  @IsString()
  model_answer: string;

  @IsArray()
  key_points: KeyPointDto[];

  @IsObject()
  marking_rubric: any;

  @IsObject()
  evaluation_criteria: any;

  @IsNumber()
  @IsOptional()
  content_accuracy_weight?: number;

  @IsNumber()
  @IsOptional()
  completeness_weight?: number;

  @IsNumber()
  @IsOptional()
  clarity_weight?: number;

  @IsNumber()
  @IsOptional()
  technical_correctness_weight?: number;

  @IsArray()
  @IsOptional()
  common_mistakes?: any[];

  @IsArray()
  @IsOptional()
  keywords?: string[];
}

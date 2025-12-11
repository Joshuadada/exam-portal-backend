import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchMarkDto {
  @ApiProperty({ 
    description: 'Exam attempt ID to mark all answers',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;
}
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAnswerDto {
  @ApiProperty({ description: 'Student answer ID to mark' })
  @IsUUID()
  @IsNotEmpty()
  answerId: string;

  @ApiProperty({ description: 'Marking guide ID to use' })
  @IsUUID()
  @IsNotEmpty()
  guideId: string;
}
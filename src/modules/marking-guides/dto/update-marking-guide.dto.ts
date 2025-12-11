import { PartialType } from '@nestjs/swagger';
import { CreateMarkingGuideDto } from './create-marking-guide.dto';

export class UpdateMarkingGuideDto extends PartialType(CreateMarkingGuideDto) {}
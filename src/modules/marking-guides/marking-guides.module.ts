import { Module } from '@nestjs/common';
import { MarkingGuidesController } from './marking-guides.controller';
import { MarkingGuidesService } from './marking-guides.service';
import { MarkingGuidesRepository } from './marking-guides.repository';

@Module({
  controllers: [MarkingGuidesController],
  providers: [MarkingGuidesService, MarkingGuidesRepository],
  exports: [MarkingGuidesService],
})
export class MarkingGuidesModule {}

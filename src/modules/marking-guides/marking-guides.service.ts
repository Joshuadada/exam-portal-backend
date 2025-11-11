import { Injectable, NotFoundException } from '@nestjs/common';
import { MarkingGuidesRepository } from './marking-guides.repository';

@Injectable()
export class MarkingGuidesService {
  constructor(private readonly repository: MarkingGuidesRepository) {}

  async create(createDto: any, createdBy: string) {
    return this.repository.create({
      ...createDto,
      created_by: createdBy,
    });
  }

  async getByQuestionId(questionId: string) {
    const guide = await this.repository.findByQuestionId(questionId);
    if (!guide) {
      throw new NotFoundException('Marking guide not found');
    }
    return guide;
  }
}

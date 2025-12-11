import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MarkingGuidesRepository } from './marking-guides.repository';
import { CreateMarkingGuideDto } from './dto/create-marking-guide.dto';
import { UpdateMarkingGuideDto } from './dto/update-marking-guide.dto';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class MarkingGuidesService {
  constructor(private readonly repository: MarkingGuidesRepository) {}

  async create(createDto: CreateMarkingGuideDto, createdBy: string) {
    // Check if guide already exists for this question
    const existing = await this.repository.findByQuestionId(
      createDto.question_id,
    );

    if (existing) {
      throw new BadRequestException(
        'Marking guide already exists for this question. Use update or create new version.',
      );
    }

    // Validate weights sum to 1.0
    const totalWeight =
      (createDto.content_accuracy_weight || 0.4) +
      (createDto.completeness_weight || 0.3) +
      (createDto.clarity_weight || 0.15) +
      (createDto.technical_correctness_weight || 0.15);

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new BadRequestException(
        'Weight values must sum to 1.0 (currently: ' + totalWeight + ')',
      );
    }

    // Validate key points total marks
    const totalMarks = createDto.key_points.reduce(
      (sum, kp) => sum + kp.marks,
      0,
    );

    // Log warning if marks seem unusual but don't block
    if (totalMarks < 5 || totalMarks > 100) {
      console.warn(
        `Unusual total marks (${totalMarks}) for marking guide. Question: ${createDto.question_id}`,
      );
    }

    return this.repository.create({
      ...createDto,
      created_by: createdBy,
    });
  }

  async findAll(filters: any = {}, userId?: string, userRole?: UserRole) {
    // Lecturers see only their guides unless admin
    if (userRole === UserRole.LECTURER) {
      filters.created_by = userId;
    }

    return this.repository.findAll(filters);
  }

  async findById(id: string) {
    const guide = await this.repository.findById(id);
    if (!guide) {
      throw new NotFoundException('Marking guide not found');
    }
    return guide;
  }

  async findByQuestionId(questionId: string) {
    const guide = await this.repository.findByQuestionId(questionId);
    if (!guide) {
      throw new NotFoundException(
        'No active marking guide found for this question',
      );
    }
    return guide;
  }

  async findAllVersionsByQuestionId(questionId: string) {
    return this.repository.findAllByQuestionId(questionId);
  }

  async update(
    id: string,
    updateDto: UpdateMarkingGuideDto,
    userId: string,
    userRole: UserRole,
  ) {
    const guide = await this.findById(id);

    // Only creator or admin can update
    if (userRole !== UserRole.ADMIN && guide.created_by !== userId) {
      throw new ForbiddenException(
        'You can only update your own marking guides',
      );
    }

    // Validate weights if provided
    if (
      updateDto.content_accuracy_weight !== undefined ||
      updateDto.completeness_weight !== undefined ||
      updateDto.clarity_weight !== undefined ||
      updateDto.technical_correctness_weight !== undefined
    ) {
      const totalWeight =
        (updateDto.content_accuracy_weight ?? guide.content_accuracy_weight) +
        (updateDto.completeness_weight ?? guide.completeness_weight) +
        (updateDto.clarity_weight ?? guide.clarity_weight) +
        (updateDto.technical_correctness_weight ??
          guide.technical_correctness_weight);

      if (Math.abs(totalWeight - 1.0) > 0.01) {
        throw new BadRequestException('Weight values must sum to 1.0');
      }
    }

    return this.repository.update(id, updateDto);
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const guide = await this.findById(id);

    // Only creator or admin can delete
    if (userRole !== UserRole.ADMIN && guide.created_by !== userId) {
      throw new ForbiddenException(
        'You can only delete your own marking guides',
      );
    }

    return this.repository.delete(id);
  }

  async createNewVersion(
    questionId: string,
    createDto: CreateMarkingGuideDto,
    createdBy: string,
  ) {
    // Validate weights
    const totalWeight =
      (createDto.content_accuracy_weight || 0.4) +
      (createDto.completeness_weight || 0.3) +
      (createDto.clarity_weight || 0.15) +
      (createDto.technical_correctness_weight || 0.15);

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new BadRequestException('Weight values must sum to 1.0');
    }

    return this.repository.createVersion(questionId, {
      ...createDto,
      created_by: createdBy,
    });
  }

  async getStatistics(guideId: string) {
    await this.findById(guideId);
    return this.repository.getStatistics(guideId);
  }

  async validateGuide(guide: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!guide.model_answer || guide.model_answer.length < 10) {
      errors.push('Model answer must be at least 10 characters');
    }

    if (!guide.key_points || guide.key_points.length === 0) {
      errors.push('At least one key point is required');
    }

    // Check key points have marks
    if (guide.key_points) {
      guide.key_points.forEach((kp: any, idx: number) => {
        if (!kp.marks || kp.marks <= 0) {
          errors.push(`Key point ${idx + 1} must have marks > 0`);
        }
        if (!kp.point || kp.point.length < 5) {
          errors.push(`Key point ${idx + 1} must have description`);
        }
      });
    }

    // Check rubric
    if (!guide.marking_rubric) {
      errors.push('Marking rubric is required');
    } else {
      const requiredLevels = ['excellent', 'good', 'satisfactory', 'poor'];
      requiredLevels.forEach((level) => {
        if (!guide.marking_rubric[level]) {
          errors.push(`Rubric missing '${level}' level`);
        }
      });
    }

    // Check evaluation criteria
    if (!guide.evaluation_criteria) {
      errors.push('Evaluation criteria is required');
    } else {
      const requiredCriteria = [
        'content_accuracy',
        'completeness',
        'clarity',
        'technical_correctness',
      ];
      requiredCriteria.forEach((criterion) => {
        if (!guide.evaluation_criteria[criterion]) {
          errors.push(`Evaluation criteria missing '${criterion}'`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

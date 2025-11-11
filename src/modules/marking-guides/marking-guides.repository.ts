import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class MarkingGuidesRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: any) {
    const query = `
      INSERT INTO marking_guides (
        question_id, model_answer, key_points, marking_rubric,
        evaluation_criteria, content_accuracy_weight, completeness_weight,
        clarity_weight, technical_correctness_weight, common_mistakes,
        keywords, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      data.question_id,
      data.model_answer,
      JSON.stringify(data.key_points),
      JSON.stringify(data.marking_rubric),
      JSON.stringify(data.evaluation_criteria),
      data.content_accuracy_weight || 0.40,
      data.completeness_weight || 0.30,
      data.clarity_weight || 0.15,
      data.technical_correctness_weight || 0.15,
      JSON.stringify(data.common_mistakes || []),
      data.keywords || [],
      data.created_by,
    ]);

    return result.rows[0];
  }

  async findByQuestionId(questionId: string) {
    const query = `
      SELECT * FROM marking_guides 
      WHERE question_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.db.query(query, [questionId]);
    return result.rows[0];
  }
}

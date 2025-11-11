import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class MarkingRepository {
  constructor(private readonly db: DatabaseService) {}

  async saveMarkingResult(result: any) {
    const query = `
      INSERT INTO llm_marking_results (
        student_answer_id, marking_guide_id, llm_model, llm_provider,
        awarded_marks, max_marks, confidence_score,
        content_accuracy_score, completeness_score,
        clarity_score, technical_correctness_score,
        llm_feedback, strengths, weaknesses,
        key_points_identified, missing_points,
        requires_human_review, review_reason,
        llm_request_payload, llm_response_payload,
        processing_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const res = await this.db.query(query, [
      result.student_answer_id,
      result.marking_guide_id,
      result.llm_model,
      result.llm_provider,
      result.awarded_marks,
      result.max_marks,
      result.confidence_score,
      result.content_accuracy_score,
      result.completeness_score,
      result.clarity_score,
      result.technical_correctness_score,
      result.feedback,
      JSON.stringify(result.strengths),
      JSON.stringify(result.weaknesses),
      JSON.stringify(result.key_points_identified),
      JSON.stringify(result.missing_points),
      result.requires_human_review,
      result.review_reason,
      JSON.stringify(result.request_payload),
      JSON.stringify(result.response_payload),
      result.processing_time_ms,
    ]);

    return res.rows[0];
  }

  async getResultsByAttemptId(attemptId: string) {
    const query = `
      SELECT lmr.*, q.question_number, q.question_text, sa.answer_text
      FROM llm_marking_results lmr
      JOIN student_answers sa ON lmr.student_answer_id = sa.id
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.attempt_id = $1
      ORDER BY q.question_number
    `;

    const result = await this.db.query(query, [attemptId]);
    return result.rows;
  }
}

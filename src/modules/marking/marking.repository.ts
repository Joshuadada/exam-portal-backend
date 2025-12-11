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

  async findById(id: string) {
    const query = `SELECT * FROM llm_marking_results WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async updateMarkingResult(id: string, updates: any) {
    const query = `
      UPDATE llm_marking_results
      SET awarded_marks = $2, requires_human_review = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [
      id,
      updates.awarded_marks,
      updates.requires_human_review,
    ]);

    return result.rows[0];
  }

  async getResultsByAttemptId(attemptId: string) {
    const query = `
      SELECT 
        lmr.*,
        q.question_number,
        q.question_text,
        q.max_marks as question_max_marks,
        sa.answer_text
      FROM llm_marking_results lmr
      JOIN student_answers sa ON lmr.student_answer_id = sa.id
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.attempt_id = $1
      ORDER BY q.question_number
    `;

    const result = await this.db.query(query, [attemptId]);
    return result.rows.map((row) => this.parseJsonFields(row));
  }

  async getReviewQueue(lecturerId?: string) {
    let query = `
      SELECT 
        lmr.*,
        sa.answer_text,
        q.question_text,
        q.question_number,
        e.exam_title,
        u.full_name as student_name,
        c.course_name
      FROM llm_marking_results lmr
      JOIN student_answers sa ON lmr.student_answer_id = sa.id
      JOIN exam_attempts ea ON sa.attempt_id = ea.id
      JOIN questions q ON sa.question_id = q.id
      JOIN exams e ON q.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON ea.student_id = u.id
      WHERE lmr.requires_human_review = true
    `;

    //const params = [];
    const params: any[] = [];
    if (lecturerId) {
      query += ' AND e.created_by = $1';
      params.push(lecturerId);
    }

    query += ' ORDER BY lmr.created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows.map((row) => this.parseJsonFields(row));
  }

  async saveReview(review: any) {
    const query = `
      INSERT INTO marking_reviews (
        llm_marking_id, reviewer_id, review_status,
        final_marks, reviewer_comments, llm_accuracy_rating
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      review.llm_marking_id,
      review.reviewer_id,
      review.review_status,
      review.final_marks,
      review.reviewer_comments,
      review.llm_accuracy_rating,
    ]);

    return result.rows[0];
  }

  async getExamStatistics(examId: string) {
    const query = `
      SELECT 
        AVG(lmr.confidence_score) as avg_confidence,
        COUNT(*) as total_marked,
        SUM(CASE WHEN lmr.requires_human_review THEN 1 END) as review_count,
        AVG(lmr.processing_time_ms) as avg_processing_time,
        AVG(lmr.awarded_marks / lmr.max_marks * 100) as avg_percentage,
        COUNT(CASE WHEN lmr.confidence_score < 0.5 THEN 1 END) as very_low_confidence,
        COUNT(CASE WHEN lmr.confidence_score BETWEEN 0.5 AND 0.7 THEN 1 END) as low_confidence,
        COUNT(CASE WHEN lmr.confidence_score > 0.9 THEN 1 END) as high_confidence
      FROM llm_marking_results lmr
      JOIN student_answers sa ON lmr.student_answer_id = sa.id
      JOIN exam_attempts ea ON sa.attempt_id = ea.id
      WHERE ea.exam_id = $1
    `;

    const result = await this.db.query(query, [examId]);
    return result.rows[0];
  }

  async getReviewStatistics(lecturerId?: string) {
    let query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(mr.llm_accuracy_rating) as avg_accuracy_rating,
        COUNT(CASE WHEN mr.review_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN mr.review_status = 'modified' THEN 1 END) as modified_count,
        COUNT(CASE WHEN mr.review_status = 'rejected' THEN 1 END) as rejected_count,
        AVG(ABS(mr.final_marks - lmr.awarded_marks)) as avg_marks_difference
      FROM marking_reviews mr
      JOIN llm_marking_results lmr ON mr.llm_marking_id = lmr.id
      JOIN student_answers sa ON lmr.student_answer_id = sa.id
      JOIN exam_attempts ea ON sa.attempt_id = ea.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE 1=1
    `;

    //const params = [];
    const params: any[] = [];
    if (lecturerId) {
      query += ' AND e.created_by = $1';
      params.push(lecturerId);
    }

    const result = await this.db.query(query, params);
    return result.rows[0];
  }

  private parseJsonFields(row: any) {
    if (!row) return null;

    return {
      ...row,
      strengths:
        typeof row.strengths === 'string'
          ? JSON.parse(row.strengths)
          : row.strengths,
      weaknesses:
        typeof row.weaknesses === 'string'
          ? JSON.parse(row.weaknesses)
          : row.weaknesses,
      key_points_identified:
        typeof row.key_points_identified === 'string'
          ? JSON.parse(row.key_points_identified)
          : row.key_points_identified,
      missing_points:
        typeof row.missing_points === 'string'
          ? JSON.parse(row.missing_points)
          : row.missing_points,
    };
  }
}

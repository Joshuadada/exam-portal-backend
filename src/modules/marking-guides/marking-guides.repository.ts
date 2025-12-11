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
        partial_credit_rules, keywords, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
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
      JSON.stringify(data.partial_credit_rules || []),
      data.keywords || [],
      data.created_by,
    ]);

    return this.parseJsonFields(result.rows[0]);
  }

  async findAll(filters: any = {}) {
    let query = `
      SELECT mg.*, q.question_text, q.question_number, q.max_marks,
        e.exam_title, u.full_name as created_by_name
      FROM marking_guides mg
      LEFT JOIN questions q ON mg.question_id = q.id
      LEFT JOIN exams e ON q.exam_id = e.id
      LEFT JOIN users u ON mg.created_by = u.id
      WHERE mg.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    // if (filters.question_id) {
    //   query += ` AND mg.question_id = $${paramCount}`;
    //   params.push(filters.question_id);
    //   paramCount++;
    // }

    // if (filters.exam_id) {
    //   query += ` AND q.exam_id = $${paramCount}`;
    //   params.push(filters.exam_id);
    //   paramCount++;
    // }

    // if (filters.created_by) {
    //   query += ` AND mg.created_by = $${paramCount}`;
    //   params.push(filters.created_by);
    //   paramCount++;
    // }

    query += ` ORDER BY mg.created_at DESC`;

    const result = await this.db.query(query, params);
    return result.rows.map((row) => this.parseJsonFields(row));
  }

  async findById(id: string) {
    const query = `
      SELECT mg.*, q.question_text, q.question_number, q.max_marks,
        e.exam_title, e.exam_id, u.full_name as created_by_name
      FROM marking_guides mg
      LEFT JOIN questions q ON mg.question_id = q.id
      LEFT JOIN exams e ON q.exam_id = e.id
      LEFT JOIN users u ON mg.created_by = u.id
      WHERE mg.id = $1
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  async findByQuestionId(questionId: string) {
    const query = `
      SELECT * FROM marking_guides 
      WHERE question_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [questionId]);
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  async findAllByQuestionId(questionId: string) {
    const query = `
      SELECT mg.*, u.full_name as created_by_name
      FROM marking_guides mg
      LEFT JOIN users u ON mg.created_by = u.id
      WHERE mg.question_id = $1
      ORDER BY mg.guide_version DESC, mg.created_at DESC
    `;

    const result = await this.db.query(query, [questionId]);
    return result.rows.map((row) => this.parseJsonFields(row));
  }

  // async update(id: string, data: any) {
  //   const updates = [];
  //   const params = [];
  //   let paramCount = 1;

  //   if (data.model_answer !== undefined) {
  //     updates.push(`model_answer = $${paramCount}`);
  //     params.push(data.model_answer);
  //     paramCount++;
  //   }

  //   // if (data.key_points !== undefined) {
  //   //   updates.push(`key_points = $${paramCount}`);
  //   //   params.push(JSON.stringify(data.key_points));
  //   //   paramCount++;
  //   // }

  //   // if (data.marking_rubric !== undefined) {
  //   //   updates.push(`marking_rubric = $${paramCount}`);
  //   //   params.push(JSON.stringify(data.marking_rubric));
  //   //   paramCount++;
  //   // }

  //   // if (data.evaluation_criteria !== undefined) {
  //   //   updates.push(`evaluation_criteria = $${paramCount}`);
  //   //   params.push(JSON.stringify(data.evaluation_criteria));
  //   //   paramCount++;
  //   // }

  //   // if (data.content_accuracy_weight !== undefined) {
  //   //   updates.push(`content_accuracy_weight = $${paramCount}`);
  //   //   params.push(data.content_accuracy_weight);
  //   //   paramCount++;
  //   // }

  //   // if (data.completeness_weight !== undefined) {
  //   //   updates.push(`completeness_weight = $${paramCount}`);
  //   //   params.push(data.completeness_weight);
  //   //   paramCount++;
  //   // }

  //   // if (data.clarity_weight !== undefined) {
  //   //   updates.push(`clarity_weight = $${paramCount}`);
  //   //   params.push(data.clarity_weight);
  //   //   paramCount++;
  //   // }

  //   // if (data.technical_correctness_weight !== undefined) {
  //   //   updates.push(`technical_correctness_weight = $${paramCount}`);
  //   //   params.push(data.technical_correctness_weight);
  //   //   paramCount++;
  //   // }

  //   // if (data.common_mistakes !== undefined) {
  //   //   updates.push(`common_mistakes = $${paramCount}`);
  //   //   params.push(JSON.stringify(data.common_mistakes));
  //   //   paramCount++;
  //   // }

  //   // if (data.partial_credit_rules !== undefined) {
  //   //   updates.push(`partial_credit_rules = $${paramCount}`);
  //   //   params.push(JSON.stringify(data.partial_credit_rules));
  //   //   paramCount++;
  //   // }

  //   // if (data.keywords !== undefined) {
  //   //   updates.push(`keywords = $${paramCount}`);
  //   //   params.push(data.keywords);
  //   //   paramCount++;
  //   // }

  //   if (updates.length === 0) {
  //     return this.findById(id);
  //   }

  //   // updates.push(`updated_at = NOW()`);
  //   // params.push(id);

  //   const query = `
  //     UPDATE marking_guides
  //     SET ${updates.join(', ')}
  //     WHERE id = $${paramCount}
  //     RETURNING *
  //   `;

  //   const result = await this.db.query(query, params);
  //   return this.parseJsonFields(result.rows[0]);
  // }

  async update(id: string, data: any) {
    // const updates = [];
    // const params = [];
    const updates: string[] = [];
    const params: any[] = [];

    let paramCount = 1;
  
    if (data.model_answer !== undefined) {
      updates.push(`model_answer = $${paramCount}`);
      params.push(data.model_answer);
      paramCount++;
    }
  
    if (data.key_points !== undefined) {
      updates.push(`key_points = $${paramCount}`);
      params.push(JSON.stringify(data.key_points));
      paramCount++;
    }
  
    if (data.marking_rubric !== undefined) {
      updates.push(`marking_rubric = $${paramCount}`);
      params.push(JSON.stringify(data.marking_rubric));
      paramCount++;
    }
  
    if (data.evaluation_criteria !== undefined) {
      updates.push(`evaluation_criteria = $${paramCount}`);
      params.push(JSON.stringify(data.evaluation_criteria));
      paramCount++;
    }
  
    if (data.content_accuracy_weight !== undefined) {
      updates.push(`content_accuracy_weight = $${paramCount}`);
      params.push(data.content_accuracy_weight);
      paramCount++;
    }
  
    if (data.completeness_weight !== undefined) {
      updates.push(`completeness_weight = $${paramCount}`);
      params.push(data.completeness_weight);
      paramCount++;
    }
  
    if (data.clarity_weight !== undefined) {
      updates.push(`clarity_weight = $${paramCount}`);
      params.push(data.clarity_weight);
      paramCount++;
    }
  
    if (data.technical_correctness_weight !== undefined) {
      updates.push(`technical_correctness_weight = $${paramCount}`);
      params.push(data.technical_correctness_weight);
      paramCount++;
    }
  
    if (data.common_mistakes !== undefined) {
      updates.push(`common_mistakes = $${paramCount}`);
      params.push(JSON.stringify(data.common_mistakes));
      paramCount++;
    }
  
    if (data.partial_credit_rules !== undefined) {
      updates.push(`partial_credit_rules = $${paramCount}`);
      params.push(JSON.stringify(data.partial_credit_rules));
      paramCount++;
    }
  
    if (data.keywords !== undefined) {
      updates.push(`keywords = $${paramCount}`);
      params.push(JSON.stringify(data.keywords)); // FIXED ✔
      paramCount++;
    }
  
    // If nothing to update, return existing
    if (updates.length === 0) {
      return this.findById(id);
    }
  
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
  
    // Add ID as the last param – CRITICAL FIX ✔
    params.push(id);
  
    const query = `
      UPDATE marking_guides
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
  
    const result = await this.db.query(query, params);
    return this.parseJsonFields(result.rows[0]);
  }
  

  async delete(id: string) {
    // Soft delete
    const query = `
      UPDATE marking_guides
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async hardDelete(id: string) {
    const query = `DELETE FROM marking_guides WHERE id = $1 RETURNING *`;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async createVersion(questionId: string, data: any) {
    // Get current max version for this question
    const versionQuery = `
      SELECT MAX(guide_version) as max_version 
      FROM marking_guides 
      WHERE question_id = $1
    `;
    const versionResult = await this.db.query(versionQuery, [questionId]);
    const nextVersion = (versionResult.rows[0]?.max_version || 0) + 1;

    // Deactivate current active guide
    await this.db.query(
      `UPDATE marking_guides SET is_active = false WHERE question_id = $1 AND is_active = true`,
      [questionId],
    );

    // Create new version
    const query = `
      INSERT INTO marking_guides (
        question_id, guide_version, model_answer, key_points, marking_rubric,
        evaluation_criteria, content_accuracy_weight, completeness_weight,
        clarity_weight, technical_correctness_weight, common_mistakes,
        partial_credit_rules, keywords, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      questionId,
      nextVersion,
      data.model_answer,
      JSON.stringify(data.key_points),
      JSON.stringify(data.marking_rubric),
      JSON.stringify(data.evaluation_criteria),
      data.content_accuracy_weight || 0.40,
      data.completeness_weight || 0.30,
      data.clarity_weight || 0.15,
      data.technical_correctness_weight || 0.15,
      JSON.stringify(data.common_mistakes || []),
      JSON.stringify(data.partial_credit_rules || []),
      data.keywords || [],
      data.created_by,
    ]);

    return this.parseJsonFields(result.rows[0]);
  }

  async getStatistics(guideId: string) {
    const query = `
      SELECT 
        COUNT(DISTINCT lmr.id) as times_used,
        AVG(lmr.confidence_score) as avg_confidence,
        AVG(lmr.awarded_marks / lmr.max_marks * 100) as avg_score_percentage,
        COUNT(CASE WHEN lmr.requires_human_review THEN 1 END) as review_count
      FROM marking_guides mg
      LEFT JOIN llm_marking_results lmr ON lmr.marking_guide_id = mg.id
      WHERE mg.id = $1
      GROUP BY mg.id
    `;

    const result = await this.db.query(query, [guideId]);
    return result.rows[0] || {
      times_used: 0,
      avg_confidence: null,
      avg_score_percentage: null,
      review_count: 0,
    };
  }

  private parseJsonFields(row: any) {
    if (!row) return null;

    return {
      ...row,
      key_points:
        typeof row.key_points === 'string'
          ? JSON.parse(row.key_points)
          : row.key_points,
      marking_rubric:
        typeof row.marking_rubric === 'string'
          ? JSON.parse(row.marking_rubric)
          : row.marking_rubric,
      evaluation_criteria:
        typeof row.evaluation_criteria === 'string'
          ? JSON.parse(row.evaluation_criteria)
          : row.evaluation_criteria,
      common_mistakes:
        typeof row.common_mistakes === 'string'
          ? JSON.parse(row.common_mistakes)
          : row.common_mistakes,
      partial_credit_rules:
        typeof row.partial_credit_rules === 'string'
          ? JSON.parse(row.partial_credit_rules)
          : row.partial_credit_rules,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(userData: any) {
    const query = `
      INSERT INTO users (email, password_hash, full_name, role, department, student_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, role, department, student_id, created_at
    `;

    const result = await this.db.query(query, [
      userData.email,
      userData.password_hash,
      userData.full_name,
      userData.role,
      userData.department || null,
      userData.student_id || null,
    ]);

    return result.rows[0];
  }

  async findByEmail(email: string) {
    const query = `
      SELECT id, email, password_hash, full_name, role, department, student_id, is_active
      FROM users
      WHERE email = $1 AND is_active = true
    `;

    const result = await this.db.query(query, [email]);
    return result.rows[0];
  }

  async findById(id: string) {
    const query = `
      SELECT id, email, full_name, role, department, student_id, created_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  async updatePassword(userId: string, passwordHash: string) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email
    `;

    const result = await this.db.query(query, [passwordHash, userId]);
    return result.rows[0];
  }
}

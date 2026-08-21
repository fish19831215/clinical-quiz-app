import { NextRequest, NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const { userId, quizId, score, answers } = await req.json();

    if (!userId || quizId === undefined || score === undefined || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: '請輸入所有必填欄位 (userId, quizId, score, answers)' }, { status: 400 });
    }

    // Begin database transaction
    await client.query('BEGIN');

    // 1. Insert into user_attempts
    const attemptResult = await client.query(
      'INSERT INTO user_attempts (user_id, quiz_id, score) VALUES ($1, $2, $3) RETURNING id',
      [userId, quizId, score]
    );
    const attemptId = attemptResult.rows[0].id;

    // 2. Insert into user_answers for each answered question
    for (const ans of answers) {
      await client.query(
        'INSERT INTO user_answers (attempt_id, question_id, selected_option, is_correct, score_earned) VALUES ($1, $2, $3, $4, $5)',
        [attemptId, ans.questionId, ans.selectedOption, ans.isCorrect, ans.scoreEarned]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      attemptId,
      message: '測驗紀錄已成功儲存'
    }, { status: 201 });

  } catch (error) {
    // Rollback in case of database failures
    await client.query('ROLLBACK');
    console.error('Attempts recording API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法儲存答題紀錄' },
      { status: 500 }
    );
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Optional GET to fetch recent attempts for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少用戶編號 (userId)' }, { status: 400 });
    }

    // Fetch user highest scores per quiz
    const result = await query(
      `SELECT quiz_id, MAX(score) as max_score, COUNT(id) as attempts_count 
       FROM user_attempts 
       WHERE user_id = $1 
       GROUP BY quiz_id`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      attemptsSummary: result.rows
    });
  } catch (error) {
    console.error('Attempts GET API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法獲取用戶紀錄' },
      { status: 500 }
    );
  }
}

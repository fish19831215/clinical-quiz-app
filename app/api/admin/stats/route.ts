import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Total Registered Users
    const usersCountResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCountResult.rows[0].count, 10);

    // 2. Total Attempts
    const attemptsCountResult = await query('SELECT COUNT(*) as count FROM user_attempts');
    const totalAttempts = parseInt(attemptsCountResult.rows[0].count, 10);

    // 3. Average Score and Attempts count per Quiz
    const quizStatsResult = await query(`
      SELECT 
        q.id as quiz_id,
        q.title,
        COALESCE(ROUND(AVG(ua.score), 1), 0) as avg_score,
        COUNT(ua.id) as attempts_count
      FROM quizzes q
      LEFT JOIN user_attempts ua ON q.id = ua.quiz_id
      GROUP BY q.id, q.title
      ORDER BY q.id
    `);
    const quizStats = quizStatsResult.rows;

    // 4. Clinical Weakness Statistics: error rate per scene
    const weaknessResult = await query(`
      SELECT 
        s.scene_title,
        q.quiz_id,
        qz.title as quiz_title,
        COUNT(ua.id) as total_answers,
        SUM(CASE WHEN ua.is_correct = false THEN 1 ELSE 0 END) as wrong_answers,
        COALESCE(
          ROUND(
            (SUM(CASE WHEN ua.is_correct = false THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ua.id), 0)) * 100, 
            1
          ), 
          0
        ) as error_rate
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      JOIN scenes s ON q.scene_id = s.id
      JOIN quizzes qz ON q.quiz_id = qz.id
      GROUP BY s.id, s.scene_title, q.quiz_id, qz.title
      ORDER BY error_rate DESC
      LIMIT 5;
    `);
    const weaknesses = weaknessResult.rows;

    // 5. Recent attempts list
    const recentResult = await query(`
      SELECT 
        ua.score,
        ua.completed_at,
        u.name,
        u.department,
        q.title as quiz_title
      FROM user_attempts ua
      JOIN users u ON ua.user_id = u.id
      JOIN quizzes q ON ua.quiz_id = q.id
      ORDER BY ua.completed_at DESC
      LIMIT 10;
    `);
    const recentAttempts = recentResult.rows;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalAttempts,
        quizStats,
        weaknesses,
        recentAttempts
      }
    });

  } catch (error) {
    console.error('Admin Stats API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法載入儀表板數據' },
      { status: 500 }
    );
  }
}

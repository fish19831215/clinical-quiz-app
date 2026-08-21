import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Query users with their maximum score for each of the three quizzes
    const sql = `
      SELECT 
        u.staff_id,
        u.name,
        u.department,
        COALESCE(MAX(CASE WHEN ua.quiz_id = 1 THEN ua.score END), -1) as quiz_1_score,
        COALESCE(MAX(CASE WHEN ua.quiz_id = 2 THEN ua.score END), -1) as quiz_2_score,
        COALESCE(MAX(CASE WHEN ua.quiz_id = 3 THEN ua.score END), -1) as quiz_3_score,
        COUNT(ua.id) as total_attempts,
        MAX(ua.completed_at) as last_attempt_at
      FROM users u
      LEFT JOIN user_attempts ua ON u.id = ua.user_id
      GROUP BY u.id, u.staff_id, u.name, u.department
      ORDER BY u.department, u.staff_id;
    `;

    const result = await query(sql);

    // 2. Format the result as CSV text
    const headers = ['工號', '姓名', '服務單位', '心導管照護最高分', '呼吸道感染最高分', '化學治療評估最高分', '累計測驗次數', '最後測驗時間'];
    
    const rows = result.rows.map(row => {
      const q1 = row.quiz_1_score === -1 ? '未受測' : `${row.quiz_1_score}分`;
      const q2 = row.quiz_2_score === -1 ? '未受測' : `${row.quiz_2_score}分`;
      const q3 = row.quiz_3_score === -1 ? '未受測' : `${row.quiz_3_score}分`;
      const lastAttempt = row.last_attempt_at 
        ? new Date(row.last_attempt_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
        : '無';

      return [
        row.staff_id,
        row.name,
        row.department,
        q1,
        q2,
        q3,
        row.total_attempts,
        lastAttempt
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    // Add UTF-8 BOM (\ufeff) to prevent MS Excel from displaying garbled Traditional Chinese text
    const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');

    // 3. Return the CSV response with proper file headers
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="clinical_quiz_report.csv"',
      },
    });

  } catch (error) {
    console.error('Admin Export API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法匯出報表' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizIdStr = searchParams.get('quizId');

    if (!quizIdStr) {
      return NextResponse.json({ error: '缺少主題編號 (quizId)' }, { status: 400 });
    }

    const quizId = parseInt(quizIdStr, 10);

    // 1. Get Quiz info
    const quizResult = await query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return NextResponse.json({ error: '找不到指定的主題測驗' }, { status: 404 });
    }
    const quiz = quizResult.rows[0];

    // 2. Fetch random scenes for this quiz
    // Postgres LIMIT matches the quiz configuration (total_scenes_per_quiz = 3)
    const limit = quiz.total_scenes_per_quiz || 3;
    const scenesResult = await query(
      'SELECT id, scene_title, scenario_description, media_type, media_url FROM scenes WHERE quiz_id = $1 ORDER BY RANDOM() LIMIT $2',
      [quizId, limit]
    );

    if (scenesResult.rows.length === 0) {
      return NextResponse.json({ error: '此主題尚無情境場景庫' }, { status: 404 });
    }

    const scenes = scenesResult.rows;
    const sceneIds = scenes.map(s => s.id);

    // 3. Fetch questions linked to these chosen scenes, ordered by their layout order
    const questionsResult = await query(
      'SELECT id, scene_id, sub_question_order, question_text, options, correct_option, explanation, points FROM questions WHERE scene_id = ANY($1) ORDER BY scene_id, sub_question_order',
      [sceneIds]
    );

    const questions = questionsResult.rows;

    // 4. Structure the payload grouping questions by their scenes
    const structuredScenes = scenes.map(scene => {
      return {
        ...scene,
        questions: questions.filter(q => q.scene_id === scene.id)
      };
    });

    // Count total actual questions returned (should be sum of all sub-questions)
    const totalQuestionsCount = questions.length;

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        total_score: quiz.total_score
      },
      scenes: structuredScenes,
      totalQuestions: totalQuestionsCount
    });
  } catch (error) {
    console.error('Quiz Config API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法載入測驗' },
      { status: 500 }
    );
  }
}

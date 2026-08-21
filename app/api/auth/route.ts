import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { staffId, name, department } = await req.json();

    if (!staffId || !name || !department) {
      return NextResponse.json(
        { error: '請輸入所有必填欄位 (工號、姓名、單位)' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const checkResult = await query(
      'SELECT id, staff_id, name, department FROM users WHERE staff_id = $1',
      [staffId.trim().toUpperCase()]
    );

    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      // Update name/dept if they have changed
      if (user.name !== name || user.department !== department) {
        await query(
          'UPDATE users SET name = $1, department = $2 WHERE id = $3',
          [name.trim(), department.trim(), user.id]
        );
        user.name = name.trim();
        user.department = department.trim();
      }
      return NextResponse.json({ success: true, user });
    }

    // 2. Create new user
    const insertResult = await query(
      'INSERT INTO users (staff_id, name, department) VALUES ($1, $2, $3) RETURNING id, staff_id, name, department',
      [staffId.trim().toUpperCase(), name.trim(), department.trim()]
    );

    const newUser = insertResult.rows[0];
    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Authentication API error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤，無法完成登入' },
      { status: 500 }
    );
  }
}

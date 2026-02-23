import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createFamilySchema } from "@/schemas/family";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 既に家族に所属していないか確認
    const { data: existingMember } = await supabase
      .from("family_members")
      .select("id")
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "既に家族に所属しています" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createFamilySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }

    const { familyName, displayName, childName, childBirthDate } = parsed.data;

    // UUID を事前生成（INSERT 後の SELECT が RLS で弾かれるのを回避）
    const familyId = randomUUID();

    // 家族作成
    const { error: familyError } = await supabase
      .from("families")
      .insert({ id: familyId, name: familyName });

    if (familyError) {
      console.error("Family insert error:", familyError);
      return NextResponse.json(
        { error: "家族の作成に失敗しました", detail: familyError.message },
        { status: 500 }
      );
    }

    // メンバー追加（owner） — これ以降 my_family_id() が有効になる
    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        user_id: user.id,
        role: "owner" as const,
        display_name: displayName,
      });

    if (memberError) {
      console.error("Member insert error:", memberError);
      return NextResponse.json(
        { error: "メンバー登録に失敗しました", detail: memberError.message },
        { status: 500 }
      );
    }

    // 子ども情報（入力がある場合）
    let child = null;
    if (childName || childBirthDate) {
      const { data: childData } = await supabase
        .from("children")
        .insert({
          family_id: familyId,
          name: childName || null,
          birth_date: childBirthDate || null,
        })
        .select()
        .single();
      child = childData;
    }

    // プロフィール upsert
    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        display_name: displayName,
      },
      { onConflict: "user_id" }
    );

    return NextResponse.json({
      family: { id: familyId, name: familyName },
      child,
    });
  } catch (error) {
    console.error("Family creation error:", error);
    return NextResponse.json(
      { error: "家族の作成に失敗しました" },
      { status: 500 }
    );
  }
}

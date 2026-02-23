import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyId } from "@/lib/supabase/family";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const familyId = await getMyFamilyId(supabase);
    if (!familyId) {
      return NextResponse.json(
        { error: "家族が設定されていません" },
        { status: 400 }
      );
    }

    // owner 権限チェック
    const { data: member } = await supabase
      .from("family_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "owner") {
      return NextResponse.json(
        { error: "招待リンクはオーナーのみ発行できます" },
        { status: 403 }
      );
    }

    // トークン生成
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: invitation, error } = await supabase
      .from("family_invitations")
      .insert({
        family_id: familyId,
        invited_by: user.id,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "招待リンクの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: invitation.token,
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    console.error("Invite creation error:", error);
    return NextResponse.json(
      { error: "招待リンクの作成に失敗しました" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { userId } = await params;

    // 自分自身は削除不可（オーナーの場合）
    if (userId === user.id) {
      // 自分が owner かチェック
      const { data: myMember } = await supabase
        .from("family_members")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (myMember?.role === "owner") {
        return NextResponse.json(
          { error: "オーナーは自分自身を削除できません" },
          { status: 400 }
        );
      }
    }

    // owner 権限チェック（自分以外を削除する場合）
    if (userId !== user.id) {
      const { data: myMember } = await supabase
        .from("family_members")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (myMember?.role !== "owner") {
        return NextResponse.json(
          { error: "メンバーの削除はオーナーのみ可能です" },
          { status: 403 }
        );
      }
    }

    // RLS の DELETE ポリシーで制御される
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: "メンバーの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member delete error:", error);
    return NextResponse.json(
      { error: "メンバーの削除に失敗しました" },
      { status: 500 }
    );
  }
}

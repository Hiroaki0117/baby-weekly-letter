import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyFamilyId } from "@/lib/supabase/family";

export async function GET() {
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

    // RLS で自分の家族のメンバーのみ返る
    const { data: members, error } = await supabase
      .from("family_members")
      .select("id, user_id, role, display_name, joined_at")
      .order("joined_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "メンバーの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Members fetch error:", error);
    return NextResponse.json(
      { error: "メンバーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

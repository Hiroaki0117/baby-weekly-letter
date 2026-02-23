import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinFamilySchema } from "@/schemas/family";

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
    const parsed = joinFamilySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "無効なリクエストです" },
        { status: 400 }
      );
    }

    const { token, displayName } = parsed.data;

    // トークン検証（RLS をバイパスするため、招待テーブルは公開SELECTが必要）
    // ただし family_invitations の RLS は family_id ベースなので、
    // 未参加ユーザーは見えない。ここではトークンで直接検索する必要があるため
    // service role が必要だが、anon key でも token が一致すれば問題ない設計にする。
    // → 実際は RLS により未参加ユーザーはこのテーブルを読めないため、
    //   招待検証用の RLS ポリシーを追加するか、別のアプローチが必要。
    //   ここでは supabase.rpc() で検証関数を呼ぶ方式を採用。

    // 招待トークンの検証は RPC 関数で実行
    // まず直接クエリを試みる（招待テーブルのSELECTポリシーにトークン検証を追加済みの場合）
    // Fallback: API内で検証ロジックを実行

    // 招待情報を取得（サーバー側なのでRLSの制約を受ける）
    // family_invitations は family_id ベースの RLS なので未参加ユーザーは読めない
    // → この問題を解決するため、トークンベースのSELECTポリシーを追加する必要がある
    // マイグレーションで追加済みと想定

    // 招待の検証を行うために、一時的にRPCを使う代わりに
    // family_invitations に token ベースの SELECT ポリシーを追加するアプローチ

    // Note: この API はオンボーディング前のユーザーが呼ぶため、
    // my_family_id() が NULL になる。招待テーブルの RLS に
    // トークン一致条件のポリシーを追加する必要がある。
    // → マイグレーションに追記する

    // 暫定: supabase の auth.admin を使わず、PostgreSQL 関数で検証
    const { data: invitation, error: invError } = await supabase.rpc(
      "verify_invitation",
      { invite_token: token }
    );

    const invitationRows = invitation as
      | { family_id: string; family_name: string }[]
      | null;

    if (invError || !invitationRows || invitationRows.length === 0) {
      return NextResponse.json(
        { error: "招待リンクが無効または期限切れです" },
        { status: 400 }
      );
    }

    const familyId = invitationRows[0].family_id;

    // メンバー数チェック
    const { count } = await supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId);

    if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: "家族のメンバー数が上限（5人）に達しています" },
        { status: 400 }
      );
    }

    // family_members に追加
    const { error: joinError } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        user_id: user.id,
        role: "member" as const,
        display_name: displayName || null,
      });

    if (joinError) {
      return NextResponse.json(
        { error: "家族への参加に失敗しました" },
        { status: 500 }
      );
    }

    // 招待を使用済みに更新（RPC経由）
    await supabase.rpc("use_invitation", {
      invite_token: token,
      used_by_user: user.id,
    });

    // プロフィール upsert
    if (displayName) {
      await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          display_name: displayName,
        },
        { onConflict: "user_id" }
      );
    }

    // 家族情報を取得して返す
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .eq("id", familyId)
      .single();

    return NextResponse.json({ family });
  } catch (error) {
    console.error("Family join error:", error);
    return NextResponse.json(
      { error: "家族への参加に失敗しました" },
      { status: 500 }
    );
  }
}

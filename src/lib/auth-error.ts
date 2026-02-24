/**
 * Supabase Auth のエラーメッセージをユーザー向けの日本語に変換する
 */

const errorMap: Record<string, string> = {
  // ログイン
  "Invalid login credentials":
    "メールアドレスまたはパスワードが正しくありません",
  "Email not confirmed": "メールアドレスが確認されていません。確認メールをご確認ください",
  "Invalid Refresh Token: Refresh Token Not Found":
    "セッションの有効期限が切れました。再度ログインしてください",

  // サインアップ
  "User already registered": "このメールアドレスは既に登録されています",
  "Password should be at least 6 characters":
    "パスワードは6文字以上で入力してください",
  "Unable to validate email address: invalid format":
    "メールアドレスの形式が正しくありません",
  "Signup requires a valid password": "パスワードを入力してください",

  // レートリミット
  "For security purposes, you can only request this after":
    "セキュリティのため、しばらく時間をおいてから再度お試しください",

  // OAuth
  "OAuth error": "外部認証サービスとの連携に失敗しました。再度お試しください",
};

export function getAuthErrorMessage(error: { message: string }): string {
  // 完全一致
  if (errorMap[error.message]) {
    return errorMap[error.message];
  }

  // 部分一致（レートリミット等、動的な部分を含むメッセージ）
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.message.includes(key) || error.message.startsWith(key)) {
      return value;
    }
  }

  // マッチしない場合はフォールバック
  return "予期しないエラーが発生しました。しばらくしてから再度お試しください";
}

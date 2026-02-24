import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth-error";

describe("getAuthErrorMessage", () => {
  it("Invalid login credentials を日本語に変換する", () => {
    const result = getAuthErrorMessage({ message: "Invalid login credentials" });
    expect(result).toBe("メールアドレスまたはパスワードが正しくありません");
  });

  it("User already registered を日本語に変換する", () => {
    const result = getAuthErrorMessage({ message: "User already registered" });
    expect(result).toBe("このメールアドレスは既に登録されています");
  });

  it("Email not confirmed を日本語に変換する", () => {
    const result = getAuthErrorMessage({ message: "Email not confirmed" });
    expect(result).toBe("メールアドレスが確認されていません。確認メールをご確認ください");
  });

  it("レートリミットメッセージを部分一致で変換する", () => {
    const result = getAuthErrorMessage({
      message: "For security purposes, you can only request this after 60 seconds",
    });
    expect(result).toBe("セキュリティのため、しばらく時間をおいてから再度お試しください");
  });

  it("未知のエラーにはフォールバックメッセージを返す", () => {
    const result = getAuthErrorMessage({ message: "Some unknown error" });
    expect(result).toBe("予期しないエラーが発生しました。しばらくしてから再度お試しください");
  });
});

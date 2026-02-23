"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

type Member = {
  id: string;
  user_id: string;
  role: "owner" | "member";
  display_name: string | null;
  joined_at: string;
};

type MemberListProps = {
  isOwner: boolean;
  currentUserId: string;
};

export function MemberList({ isOwner, currentUserId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function load() {
      const res = await fetch("/api/family/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleRemove(userId: string) {
    if (!confirm("このメンバーを削除しますか？")) return;

    const res = await fetch(`/api/family/members/${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("メンバーを削除しました");
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } else {
      const data = await res.json();
      toast.error(data.error ?? "削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {(member.display_name ?? "?")[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {member.display_name ?? "未設定"}
                {member.user_id === currentUserId && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (あなた)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {member.role === "owner" ? "オーナー" : "メンバー"}
              </p>
            </div>
          </div>
          {isOwner &&
            member.user_id !== currentUserId &&
            member.role !== "owner" && (
              <button
                onClick={() => handleRemove(member.user_id)}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                削除
              </button>
            )}
        </div>
      ))}
    </div>
  );
}

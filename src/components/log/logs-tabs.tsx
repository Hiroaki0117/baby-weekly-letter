"use client";

export type LogsTab = "logs" | "weekly" | "monthly" | "report-settings";

type TopCategory = "records" | "reports";

type LogsTabsProps = {
  activeTab: LogsTab;
  onTabChange: (tab: LogsTab) => void;
};

const reportTabs: { key: LogsTab; label: string; icon: string }[] = [
  { key: "weekly", label: "週次通信", icon: "✉" },
  { key: "monthly", label: "月次まとめ", icon: "📖" },
  { key: "report-settings", label: "設定", icon: "⚙" },
];

function getTopCategory(tab: LogsTab): TopCategory {
  return tab === "logs" ? "records" : "reports";
}

export function LogsTabs({ activeTab, onTabChange }: LogsTabsProps) {
  const topCategory = getTopCategory(activeTab);

  function handleTopChange(category: TopCategory) {
    if (category === "records") {
      onTabChange("logs");
    } else {
      if (activeTab === "logs") {
        onTabChange("weekly");
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* 大項目タブ */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        <button
          onClick={() => handleTopChange("records")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            topCategory === "records"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📝 記録
        </button>
        <button
          onClick={() => handleTopChange("reports")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            topCategory === "reports"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ✉ 通信
        </button>
      </div>

      {/* 小項目タブ（通信カテゴリのみ） */}
      {topCategory === "reports" && (
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

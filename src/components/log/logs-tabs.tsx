"use client";

export type LogsTab = "logs" | "weekly" | "monthly";

type LogsTabsProps = {
  activeTab: LogsTab;
  onTabChange: (tab: LogsTab) => void;
};

const tabs: { key: LogsTab; label: string; icon: string }[] = [
  { key: "logs", label: "記録", icon: "📝" },
  { key: "weekly", label: "週次通信", icon: "✉" },
  { key: "monthly", label: "月次まとめ", icon: "📖" },
];

export function LogsTabs({ activeTab, onTabChange }: LogsTabsProps) {
  return (
    <div className="flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
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
  );
}

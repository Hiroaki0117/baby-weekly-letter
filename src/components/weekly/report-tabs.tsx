"use client";

type ReportTabsProps = {
  activeTab: "weekly" | "monthly";
  onTabChange: (tab: "weekly" | "monthly") => void;
};

export function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  return (
    <div className="flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
      <button
        onClick={() => onTabChange("weekly")}
        className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
          activeTab === "weekly"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="mr-1.5">✉</span>
        週次
      </button>
      <button
        onClick={() => onTabChange("monthly")}
        className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
          activeTab === "monthly"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="mr-1.5">📖</span>
        月次
      </button>
    </div>
  );
}

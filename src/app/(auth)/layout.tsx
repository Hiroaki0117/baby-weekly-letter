export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* 背景: ドット方眼紙 + ウォームグラデーション */}
      <div className="absolute inset-0 paper-grid opacity-60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 40%, oklch(0.93 0.06 5 / 0.5), transparent), radial-gradient(ellipse 60% 50% at 70% 60%, oklch(0.93 0.05 155 / 0.35), transparent)",
        }}
      />
      {/* 大きな透かし文字 */}
      <div
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
        aria-hidden
      >
        <span
          className="font-mincho text-[14rem] font-bold leading-none text-primary/5"
          style={{ letterSpacing: "-0.02em" }}
        >
          日
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}

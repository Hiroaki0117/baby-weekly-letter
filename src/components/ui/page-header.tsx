type Props = {
  englishLabel: string;
  title: string;
  children?: React.ReactNode;
};

export function PageHeader({ englishLabel, title, children }: Props) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {englishLabel}
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

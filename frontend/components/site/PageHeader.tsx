interface PageHeaderProps {
  eyebrow: string;
  title: string;
  intro: string;
}

export function PageHeader({ eyebrow, title, intro }: PageHeaderProps) {
  return (
    <section className="border-b border-slate-100 bg-brand-50 px-4 py-20">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-brand-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-[720px] text-balance text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-slate-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-[600px] text-lg leading-[1.6] text-slate-600">{intro}</p>
      </div>
    </section>
  );
}

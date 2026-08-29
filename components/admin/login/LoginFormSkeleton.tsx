export function LoginFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="space-y-2 lg:hidden">
        <div className="mx-auto h-11 w-11 rounded-xl bg-slate-200" />
        <div className="mx-auto h-5 w-40 rounded bg-slate-200" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
        <div className="mt-8 space-y-5">
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-11 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

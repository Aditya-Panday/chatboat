export default function HomePage() {
  return (
    <main className="min-h-full bg-slate-100 px-6 py-12 text-slate-800">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-[#1b4fd7] uppercase">
          Covers&All
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Chat widget server
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-slate-600">
          Embed this widget on any site with{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
            /widget.js
          </code>
          . The iframe UI lives at{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">
            /widget
          </code>
          .
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-[13px] leading-6 text-slate-100">
{`<script
  src="http://localhost:3001/widget.js"
  data-website="coversandall"
></script>`}
        </pre>
        <a
          href="/widget"
          className="mt-6 inline-flex rounded-full bg-[#1b4fd7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153fad]"
        >
          Open widget preview
        </a>
      </div>
    </main>
  );
}

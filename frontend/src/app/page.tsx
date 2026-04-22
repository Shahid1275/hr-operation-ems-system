import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: brand / value proposition */}
      <section className="relative flex min-h-[42vh] w-full flex-1 flex-col justify-center overflow-hidden bg-[#0c1929] px-8 py-12 md:min-h-screen md:px-12 lg:px-16">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[min(420px,80vw)] w-[min(420px,80vw)] rounded-full bg-sky-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Employee Management System
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            Streamline your workforce operations, track attendance, manage payroll, and empower your team securely.
          </p>
        </div>
      </section>

      {/* Right: portal selection */}
      <section className="flex min-h-[58vh] w-full flex-1 flex-col justify-center bg-white px-8 py-12 md:min-h-screen md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Select your portal to securely access the system.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            <Link
              href="/login?portal=admin"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:shadow-md"
            >
              <span>Admin Portal</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </Link>
            <Link
              href="/login?portal=employee"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:shadow-md"
            >
              <span>Employee Portal</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </Link>
          </div>

          <p className="mt-14 text-center text-xs text-slate-400 sm:text-sm">
            © {year} Employee Management System. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

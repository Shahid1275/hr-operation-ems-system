import Link from "next/link";
import { ChevronRight, Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Panel — Dark navy */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-[#0f1b2d] px-14 py-16">
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-blue-300">EMS</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Employee<br />Management<br />System
          </h1>
          <p className="text-base text-blue-300 leading-relaxed max-w-xs mx-auto">
            Streamline your workforce operations, track attendance, manage
            payroll, and empower your team securely.
          </p>
        </div>
        <p className="text-sm text-blue-400/60 absolute bottom-8">
          © {new Date().getFullYear()} Employee Management System. All rights reserved.
        </p>
      </div>

      {/* Right Panel — White */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500">
              Select your portal to securely access the system.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/login?portal=admin"
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-medium text-slate-900 transition-all hover:border-[#1a3a5c] hover:bg-white hover:shadow-sm group"
            >
              <span>Admin Portal</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#1a3a5c] transition-colors" />
            </Link>

            <Link
              href="/login?portal=employee"
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-medium text-slate-900 transition-all hover:border-[#1a3a5c] hover:bg-white hover:shadow-sm group"
            >
              <span>Employee Portal</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#1a3a5c] transition-colors" />
            </Link>
          </div>

          {/* Mobile copyright */}
          <p className="text-center text-xs text-slate-400 md:hidden">
            © {new Date().getFullYear()} Employee Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

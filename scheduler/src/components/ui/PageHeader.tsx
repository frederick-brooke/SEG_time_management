import { ReactNode } from "react";

export function PageHeader({ icon, title, subtitle }: { icon: ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(90,150,255,0.1)] flex items-center justify-center text-blue-300">
        {icon}
      </div>
      <div>
        <h1 className="lunar-page-title text-3xl">
          {title}
        </h1>
        <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
/**
 * SectionShell - Research Hub section wrapper with lucide-react icon support
 */
import React from "react";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  "data-tour"?: string;
}

export function SectionShell({ title, subtitle, icon, actions, children, ...rest }: Props) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
      {...rest}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            {icon ? <span className="text-muted-foreground">{icon}</span> : null}
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

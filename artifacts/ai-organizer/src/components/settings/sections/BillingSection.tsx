import React from "react";
import { SettingGroup, SettingCard } from "../primitives";

export default function BillingSection() {
  const plans = [
    { name: "Free", price: "€0", period: "/mo", features: ["5 projects","100MB storage","Community access","Basic AI features"], current: false },
    { name: "Researcher", price: "€12", period: "/mo", features: ["Unlimited projects","10GB storage","Priority support","Full AI suite","Reference manager","Collaboration tools"], current: true },
    { name: "Institution", price: "€49", period: "/mo", features: ["Everything in Researcher","50GB storage","Team management","SSO / SAML","Audit logs","SLA guarantee"], current: false },
  ];

  const invoices = [
    { date: "Feb 25, 2026", amount: "€12.00", status: "Paid" },
    { date: "Jan 25, 2026", amount: "€12.00", status: "Paid" },
    { date: "Dec 25, 2025", amount: "€12.00", status: "Paid" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <SettingGroup title="Current Plan">
        <div style={{ padding: "16px", background: "hsl(var(--primary) / 0.08)", borderRadius: "12px", border: "1px solid hsl(var(--primary) / 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "hsl(var(--primary))", fontWeight: 700, fontSize: "16px" }}>Researcher Plan</div>
              <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px", marginTop: "4px" }}>Renews on March 25, 2026 · €12/month</div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "20px", background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))", fontSize: "11px", fontWeight: 600 }}>Active</span>
          </div>
        </div>
      </SettingGroup>

      <SettingGroup title="Plans">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px" }}>
          {plans.map(p => (
            <div key={p.name} style={{ padding: "20px", borderRadius: "14px", border: `2px solid ${p.current ? "hsl(var(--primary))" : "hsl(var(--border))"}`, background: p.current ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.2)" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: p.current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px", margin: "8px 0" }}>
                <span style={{ fontSize: "26px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{p.price}</span>
                <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>{p.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: "12px", color: "hsl(var(--foreground) / 0.65)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "hsl(var(--primary))" }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: "100%", padding: "9px", borderRadius: "8px",
                border: p.current ? "none" : "1px solid hsl(var(--border))",
                background: p.current ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.3)",
                color: p.current ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                cursor: p.current ? "default" : "pointer", fontSize: "12px", fontWeight: 600,
              }}>
                {p.current ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Payment Method">
        <SettingCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "24px" }}>💳</span>
              <div>
                <div style={{ color: "hsl(var(--foreground))", fontSize: "13px", fontWeight: 500 }}>Visa ending in 4242</div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "11px" }}>Expires 08/2027</div>
              </div>
            </div>
            <button style={{ padding: "6px 14px", borderRadius: "7px", border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--muted-foreground))", cursor: "pointer", fontSize: "12px" }}>Update</button>
          </div>
        </SettingCard>
      </SettingGroup>

      <SettingGroup title="Billing History">
        <div style={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", overflow: "hidden" }}>
          {invoices.map((inv, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: i % 2 === 0 ? "hsl(var(--muted) / 0.15)" : "transparent", borderBottom: i < invoices.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none" }}>
              <div style={{ color: "hsl(var(--foreground) / 0.7)", fontSize: "12px" }}>{inv.date}</div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span style={{ color: "hsl(var(--foreground))", fontSize: "12px", fontWeight: 500 }}>{inv.amount}</span>
                <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "8px", background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}>{inv.status}</span>
                <button style={{ fontSize: "11px", color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer" }}>Download</button>
              </div>
            </div>
          ))}
        </div>
      </SettingGroup>
    </div>
  );
}

import type { CSSProperties, ReactNode } from "react";

type AspectRatioProps = {
  ratio?: number;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
};

export function AspectRatio({ ratio = 1, style, className, children }: AspectRatioProps) {
  const safeRatio = ratio > 0 ? ratio : 1;
  const paddingBottom = `${100 / safeRatio}%`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}

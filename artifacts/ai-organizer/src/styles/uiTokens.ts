import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";


export type TypographyToken = {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none";
};

export type SectionVariant = "default" | "glass" | "subtle" | "elevated";

export interface UiTokens {
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  elevation: {
    flat: string;
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    headingXL: TypographyToken;
    headingLG: TypographyToken;
    headingMD: TypographyToken;
    headingSM: TypographyToken;
    bodyLG: TypographyToken;
    bodyMD: TypographyToken;
    bodySM: TypographyToken;
    micro: TypographyToken;
    label: TypographyToken;
  };
  surfaces: {
    getSectionStyles: (variant?: SectionVariant) => {
      background: string;
      border: string;
      backdropFilter?: string;
      boxShadow?: string;
    };
  };
}

const spacingScale = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

const radiiScale = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

const elevationMap = {
  flat: "none",
  sm: "0 2px 6px rgba(0,0,0,0.04)",
  md: "0 8px 24px rgba(15,23,42,0.12)",
  lg: "0 18px 40px rgba(15,23,42,0.18)",
} as const;

const typographyBase: UiTokens["typography"] = {
  headingXL: {
    fontSize: "26px",
    lineHeight: "32px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  headingLG: {
    fontSize: "20px",
    lineHeight: "26px",
    fontWeight: 600,
  },
  headingMD: {
    fontSize: "17px",
    lineHeight: "22px",
    fontWeight: 600,
  },
  headingSM: {
    fontSize: "15px",
    lineHeight: "20px",
    fontWeight: 600,
  },
  bodyLG: {
    fontSize: "15px",
    lineHeight: "22px",
    fontWeight: 400,
  },
  bodyMD: {
    fontSize: "13.5px",
    lineHeight: "20px",
    fontWeight: 400,
  },
  bodySM: {
    fontSize: "12.5px",
    lineHeight: "18px",
    fontWeight: 400,
  },
  micro: {
    fontSize: "11px",
    lineHeight: "16px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  label: {
    fontSize: "12.5px",
    lineHeight: "18px",
    fontWeight: 600,
  },
};

function buildSectionStyle(_isDark: boolean, variant: SectionVariant = "default") {
  if (variant === "glass") {
    return {
      background: "hsl(var(--card) / 0.85)",
      border: "1px solid hsl(var(--border))",
      backdropFilter: "blur(18px)",
      boxShadow: elevationMap.md,
    };
  }
  if (variant === "subtle") {
    return {
      background: "hsl(var(--muted) / 0.4)",
      border: "1px solid hsl(var(--border) / 0.6)",
    };
  }
  if (variant === "elevated") {
    return {
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      boxShadow: elevationMap.lg,
    };
  }
  return {
    background: "hsl(var(--card) / 0.5)",
    border: "1px solid hsl(var(--border) / 0.5)",
  };
}

export function useUiTokens(): UiTokens {
  const { colors, isDark } = useTheme();

  return useMemo(() => ({
    spacing: spacingScale,
    radii: radiiScale,
    elevation: elevationMap,
    typography: typographyBase,
    surfaces: {
      getSectionStyles: (variant?: SectionVariant) => buildSectionStyle(isDark, variant),
    },
  }), [isDark, colors]);
}

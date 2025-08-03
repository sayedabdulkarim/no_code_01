import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      background: string;
      surface: string;
      primary: string;
      text: string;
      textSecondary: string;
      border: string;
    };
    spacing: {
      sm: string;
      md: string;
      lg: string;
    };
  }
}

export const darkTheme = {
  colors: {
    background: "#1e1e1e",
    surface: "#252526",
    primary: "#0066cc",
    text: "#cccccc",
    textSecondary: "#808080",
    border: "#404040",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
};

export const lightTheme = {
  colors: {
    background: "#f5f5f5",
    surface: "#ffffff",
    primary: "#0066cc",
    text: "#1e1e1e",
    textSecondary: "#666666",
    border: "#e0e0e0",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
};

import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      background: string;
      surface: string;
      primary: string;
      text: string;
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
    border: "#404040",
  },
  spacing: {
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
};

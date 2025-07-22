import prettier from "prettier/standalone";
import { Options } from "prettier";

export const formatCode = (code: string, language: string): string => {
  try {
    const options: Options = {
      parser: language,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      printWidth: 80,
    };

    return prettier.format(code, options);
  } catch (error) {
    console.warn("Code formatting failed:", error);
    return code; // Return original code if formatting fails
  }
};

export const getParserForFile = (filename: string): string => {
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".js")) return "babel";
  return "babel";
};

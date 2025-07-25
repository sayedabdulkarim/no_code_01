// Global type declarations
declare global {
  // Common event types
  type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  type ClickEvent = React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
  type SubmitEvent = React.FormEvent<HTMLFormElement>;
  
  // Common prop types
  interface BaseProps {
    className?: string;
    children?: React.ReactNode;
  }
  
  // Utility types
  type Optional<T> = T | undefined;
  type Nullable<T> = T | null;
  type Maybe<T> = T | null | undefined;
}

export {};

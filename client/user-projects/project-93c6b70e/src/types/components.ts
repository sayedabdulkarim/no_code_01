// Common component type patterns
import { ReactNode } from 'react';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export interface LoadingProps {
  className?: string;
}

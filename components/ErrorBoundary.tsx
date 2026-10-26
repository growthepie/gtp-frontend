"use client";

import { Component, ErrorInfo, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Rendered instead of the children after they throw; `reset` renders them again */
  fallback: (reset: () => void) => ReactNode;
};

type ErrorBoundaryState = { error: Error | null };

/**
 * Catches an error while rendering one section, so it shows `fallback` in its place instead of
 * taking down the whole page with the route's error.tsx.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    return this.state.error ? this.props.fallback(this.reset) : this.props.children;
  }
}

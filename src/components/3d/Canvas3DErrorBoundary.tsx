"use client";

// ================================================================
// CANVAS 3D ERROR BOUNDARY — Enhancement D
// Catches WebGL/Three.js errors and gracefully hides 3D content.
// Wrap around any dynamic-imported 3D component.
// ================================================================

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class Canvas3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log but don't crash — 3D is non-essential
    console.warn("[SparkForge 3D] WebGL/Three.js error caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? "Terjadi kesalahan tak terduga." };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Oops, ada kesalahan
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.message}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm active:scale-95"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

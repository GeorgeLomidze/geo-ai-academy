"use client";

import Link from "next/link";
import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { RefreshCcw } from "lucide-react";
import { ErrorState } from "@/components/error/ErrorState";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  retryKey: number;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    retryKey: 0,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState((current) => ({
      hasError: false,
      retryKey: current.retryKey + 1,
    }));
  };

  render() {
    const {
      children,
      title = "კონტენტის ჩატვირთვა ვერ მოხერხდა",
      description = "მონაცემების დროებით მიღება ვერ ხერხდება. სცადეთ თავიდან ან დაბრუნდით უსაფრთხო გვერდზე.",
      retryLabel = "თავიდან ცდა",
      actionHref,
      actionLabel,
      className,
    } = this.props;

    if (this.state.hasError) {
      return (
        <ErrorState
          title={title}
          description={description}
          className={className}
          actions={
            <>
              <Button
                type="button"
                className="rounded-xl bg-brand-primary text-black hover:bg-brand-primary-hover"
                onClick={this.handleRetry}
              >
                <RefreshCcw className="size-4" />
                {retryLabel}
              </Button>
              {actionHref && actionLabel ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={actionHref}>{actionLabel}</Link>
                </Button>
              ) : null}
            </>
          }
        />
      );
    }

    return <Fragment key={this.state.retryKey}>{children}</Fragment>;
  }
}

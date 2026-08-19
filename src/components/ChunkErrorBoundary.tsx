import { Component, type ReactNode } from "react";

const RELOAD_FLAG = "mimo_chunk_reload_once";

// 배포 직후 옛날 번들을 들고 있던 브라우저가 새 배포에 없는 청크를 요청하면 lazy 라우트
// import()가 실패한다 — 흔한 "Failed to fetch dynamically imported module" 에러.
// ErrorBoundary 없이는 그냥 하얀 화면으로 죽는다.
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Loading chunk|Importing a module script failed/i.test(message);
}

export class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
          <p className="text-sm text-muted-foreground">업데이트가 있어 새로고침이 필요해요.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-primary"
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

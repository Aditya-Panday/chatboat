export {};

declare global {
  interface Window {
    CoversAllChat?: {
      open: () => void;
      close: () => void;
      setContext: (partial: {
        pageType?: string;
        url?: string;
        title?: string;
        productId?: string;
        productName?: string;
        website?: string;
        pageSummary?: string;
        pageSignals?: Record<string, string | undefined>;
      }) => void;
      track: (event: {
        event: string;
        data?: Record<string, unknown>;
      }) => void;
    };
  }
}

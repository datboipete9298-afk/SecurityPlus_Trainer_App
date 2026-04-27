/** Minimal shapes for Vercel / Node serverless handlers (no @vercel/node required). */
export type VercelLikeRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

export type VercelLikeResponse = {
  status: (n: number) => VercelLikeResponse;
  json: (x: unknown) => void;
  setHeader?: (k: string, v: string) => void;
};

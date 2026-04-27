import { handleAiPost } from "./_shared";
import type { VercelLikeRequest, VercelLikeResponse } from "./vercelTypes";

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  await handleAiPost(req, res, "note-feedback");
}

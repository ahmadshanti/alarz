import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from "payload";
import { revalidatePath } from "next/cache";

/**
 * Re-render every page of both languages after content changes so edits show up immediately
 * ("layout" scope = /ar, /ar/products, /ar/story, … and the same for /en).
 * Skipped when req.context.disableRevalidate is set (seed script), and wrapped in
 * try/catch because revalidatePath throws outside a Next.js request (e.g. `payload run`).
 */
function revalidateSite(req: PayloadRequest) {
  if (req.context?.disableRevalidate) return;
  try {
    revalidatePath("/ar", "layout");
    revalidatePath("/en", "layout");
  } catch (err) {
    req.payload.logger.warn({ msg: "[revalidate] skipped", err });
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  revalidateSite(req);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateSite(req);
  return doc;
};

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  revalidateSite(req);
  return doc;
};

/** Spread into a content collection's config. */
export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
};

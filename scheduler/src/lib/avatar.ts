import { AVATAR_IMAGES } from "./shop-catalogue";

/**
 * Resolves a user's pfp field to a renderable image src.
 *
 * - "avatar:<key>"  → looks up the SVG data-URI from AVATAR_IMAGES
 * - normal URL      → returned as-is (uploaded photo / OAuth picture)
 * - null / undefined → returns null (caller should render initials)
 */
export function resolveAvatarSrc(pfp: string | null | undefined): string | null {
  if (!pfp) return null;
  if (pfp.startsWith("avatar:")) {
    const key = pfp.slice("avatar:".length);
    return AVATAR_IMAGES[key] ?? null;
  }
  return pfp;
}
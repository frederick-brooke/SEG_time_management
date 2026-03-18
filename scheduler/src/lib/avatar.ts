import { AVATAR_IMAGES } from "./shop-catalogue";
export function resolveAvatarSrc(pfp: string | null | undefined): string | null {
    if (!pfp) return null;
    if (pfp.startsWith("avatar:")) return AVATAR_IMAGES[pfp.slice(7)] ?? null;
    return pfp;
}
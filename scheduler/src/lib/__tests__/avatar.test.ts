import { resolveAvatarSrc } from "../avatar";
import { AVATAR_IMAGES } from "../shop-catalogue";

describe("resolveAvatarSrc", () => {
	it("returns null when pfp is null", () => {
		expect(resolveAvatarSrc(null)).toBeNull();
	});

	it("returns null when pfp is undefined", () => {
		expect(resolveAvatarSrc(undefined)).toBeNull();
	});

	it("returns null when pfp is an empty string", () => {
		expect(resolveAvatarSrc("")).toBeNull();
	});

	it("returns the mapped avatar image when pfp uses a valid avatar key", () => {
		const firstKey = Object.keys(AVATAR_IMAGES)[0];
		expect(resolveAvatarSrc(`avatar:${firstKey}`)).toBe(
			AVATAR_IMAGES[firstKey],
		);
	});

	it("returns null when pfp uses an unknown avatar key", () => {
		expect(resolveAvatarSrc("avatar:does-not-exist")).toBeNull();
	});

	it("returns normal URLs as-is", () => {
		const url = "https://example.com/photo.png";
		expect(resolveAvatarSrc(url)).toBe(url);
	});
});

/**
 * Tests for prisma singleton logic
 */

describe("prisma singleton", () => {
	const OLD_ENV = process.env.NODE_ENV;

	afterEach(() => {
		jest.resetModules(); // reset module cache
		Object.defineProperty(process.env, "NODE_ENV", {
			value: OLD_ENV,
			configurable: true,
		});
		delete (global as any).prisma;
	});

	it("creates a new PrismaClient if none exists (development)", async () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "development",
			configurable: true,
		});

		jest.resetModules();

		const mod = await import("../prisma");

		expect(mod.prisma).toBeDefined();
		expect((global as any).prisma).toBeDefined(); // assigned in dev
	});

	it("reuses existing global prisma instance in development", async () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "development",
			configurable: true,
		});

		const fakeClient = { fake: true };
		(global as any).prisma = fakeClient;

		jest.resetModules();

		const mod = await import("../prisma");

		expect(mod.prisma).toBe(fakeClient);
	});

	it("does not assign prisma to global in production", async () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "production",
			configurable: true,
		});

		jest.resetModules();

		const mod = await import("../prisma");

		expect(mod.prisma).toBeDefined();
		expect((global as any).prisma).toBeUndefined();
	});

	it("creates a new instance in production even if global exists", async () => {
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "production",
			configurable: true,
		});

		const fakeClient = { fake: true };
		(global as any).prisma = fakeClient;

		jest.resetModules();

		const mod = await import("../prisma");

		expect(mod.prisma).not.toBe(fakeClient);
	});
});

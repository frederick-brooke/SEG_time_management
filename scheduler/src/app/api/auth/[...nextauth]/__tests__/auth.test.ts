/**
 * Testing for auth/[nextauth] api route
 */

import { authOptions } from "@/lib/auth"; 

// Mocks

jest.mock('jose', () => ({}), { virtual: true });
jest.mock('@panva/hkdf', () => ({}), { virtual: true });
jest.mock('openid-client', () => ({}), { virtual: true });
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }), { virtual: true });
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}), { virtual: true });

// Tests

describe("Auth Configuration (Route Settings)", () => {
  it("Google Provider should be present", () => {
    const google = authOptions.providers.find(p => p.id === "google");
    expect(google).toBeDefined();
  });

  it("Should use JWT for session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("Should have correct calendar scopes", () => {
    const google: any = authOptions.providers.find(p => p.id === "google");
    const scope = google.options?.authorization?.params?.scope || google.authorization?.params?.scope || "";
    expect(scope).toContain('auth/calendar');
  });
});
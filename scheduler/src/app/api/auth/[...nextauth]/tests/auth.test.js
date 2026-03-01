import { GET, POST } from "../route";
import { authOptions } from "@/src/lib/auth";

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  compactDecrypt: jest.fn(),
}));
jest.mock('@panva/hkdf', () => ({}));
jest.mock('openid-client', () => ({
  Issuer: jest.fn(),
}));

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
  })),
}));

describe("Auth API Route", () => {
  it("should export GET and POST handlers", () => {
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
  });

  it("should be configured with Google Provider", () => {
    const googleProvider = authOptions.providers.find(
      (p) => p.id === "google"
    );
    expect(googleProvider).toBeDefined();
  });

  it("should have the correct scopes for Google Calendar access", () => {
    const googleProvider = authOptions.providers.find(p => p.id === "google");
    const target = googleProvider.options || googleProvider;
    const scope = target.authorization?.params?.scope || "";

    expect(scope).toContain('https://www.googleapis.com/auth/calendar');
    expect(scope).toContain("openid");
  });

  it("should include offline access and consent prompt", () => {
    const googleProvider = authOptions.providers.find(p => p.id === "google");
    const target = googleProvider.options || googleProvider;
    const params = target.authorization?.params || {};

    expect(params.access_type).toBe("offline");
    expect(params.prompt).toBe("consent");
  });

  describe("Callbacks", () => {
    it("jwt callback should attach access token if account is present", async () => {
      const token = {};
      const account = { access_token: "mock_token" };
      
      const result = await authOptions.callbacks.jwt({ token, account });
      expect(result.accessToken).toBe("mock_token");
    });

    it("session callback should pass the access token to the session object", async () => {
      const session = { user: {} };
      const token = { accessToken: "mock_token" };
      
      const result = await authOptions.callbacks.session({ session, token });
      expect(result.accessToken).toBe("mock_token");
    });
  });
});
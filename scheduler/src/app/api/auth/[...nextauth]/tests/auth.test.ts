import { GET, POST } from "../route";
import { authOptions } from "@/lib/auth"; 
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Mocks to prevent actual network/crypto calls during testing
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  compactDecrypt: jest.fn(),
}));

jest.mock('@panva/hkdf', () => ({}));

jest.mock('openid-client', () => ({
  Issuer: jest.fn(),
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
    const googleProvider: any = authOptions.providers.find(p => p.id === "google");
    // NextAuth providers can have options nested differently depending on version
    const target = googleProvider.options || googleProvider;
    const scope = target.authorization?.params?.scope || "";

    expect(scope).toContain('https://www.googleapis.com/auth/calendar');
    expect(scope).toContain("openid");
  });

  it("should include offline access and consent prompt", () => {
    const googleProvider: any = authOptions.providers.find(p => p.id === "google");
    const target = googleProvider.options || googleProvider;
    const params = target.authorization?.params || {};

    expect(params.access_type).toBe("offline");
    expect(params.prompt).toBe("consent");
  });

  describe("Callbacks", () => {
    it("jwt callback should attach access token if account is present", async () => {
      const token = {} as JWT;
      const account: any = { access_token: "mock_token" };
      
      if (authOptions.callbacks?.jwt) {
        // We use type casting 'as any' here because we are testing custom 
        // extensions to the JWT token that TS might not recognize by default
        const result = await authOptions.callbacks.jwt({ token, account, user: {} as any }) as any;
        expect(result.accessToken).toBe("mock_token");
      }
    });

    it("session callback should pass the access token to the session object", async () => {
      const session = { user: {} } as Session;
      const token = { accessToken: "mock_token" } as JWT;
      
      if (authOptions.callbacks?.session) {
        const result = await authOptions.callbacks.session({ session, token, user: {} as any }) as any;
        expect(result.accessToken).toBe("mock_token");
      }
    });
  });
});
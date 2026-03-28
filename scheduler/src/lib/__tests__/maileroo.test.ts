import type { MailOptions } from "@/lib/maileroo";


const MOCK_API_KEY = "test-api-key";
const MOCK_BASE_URL = "https://api.maileroo.com/send";
const MOCK_FROM = "no-reply@example.com";

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper: sets env vars and returns a fresh import of the module.
async function importMaileroo() {
  jest.resetModules();
  const mod = await import("@/lib/maileroo");
  return mod;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.MAILEROO_API_KEY = MOCK_API_KEY;
  process.env.MAILEROO_BASE_URL = MOCK_BASE_URL;
  process.env.MAILEROO_FROM = MOCK_FROM;
});

afterEach(() => {
  delete process.env.MAILEROO_API_KEY;
  delete process.env.MAILEROO_BASE_URL;
  delete process.env.MAILEROO_FROM;
});

// sendMail

describe("sendMail", () => {
  const baseOptions: MailOptions = {
    to: "recipient@example.com",
    subject: "Hello",
    text: "Plain text body",
    html: "<p>HTML body</p>",
  };

  it("returns error result when MAILEROO_API_KEY is not set", async () => {
    delete process.env.MAILEROO_API_KEY;
    const { sendMail } = await importMaileroo();

    const result = await sendMail(baseOptions);

    expect(result).toEqual({
      ok: false,
      status: 500,
      body: "Missing Maileroo API key",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls fetch with correct URL, method, and headers", async () => {
    const { sendMail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "sent" }),
    });

    await sendMail(baseOptions);

    expect(mockFetch).toHaveBeenCalledWith(
      MOCK_BASE_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MOCK_API_KEY}`,
        },
      })
    );
  });

  it("sends correct payload with default from address", async () => {
    const { sendMail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await sendMail(baseOptions);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      from: { address: MOCK_FROM },
      to: [{ address: "recipient@example.com" }],
      subject: "Hello",
      text: "Plain text body",
      html: "<p>HTML body</p>",
    });
  });

  it("uses provided from address over the default", async () => {
    const { sendMail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await sendMail({ ...baseOptions, from: "custom@example.com" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.from).toEqual({ address: "custom@example.com" });
  });

  it("returns ok result with parsed JSON body on success", async () => {
    const { sendMail } = await importMaileroo();
    const responseBody = { id: "abc123", status: "queued" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseBody,
    });

    const result = await sendMail(baseOptions);

    expect(result).toEqual({ ok: true, status: 200, body: responseBody });
  });

  it("returns not-ok result on API error response", async () => {
    const { sendMail } = await importMaileroo();
    const errorBody = { error: "Unauthorized" };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => errorBody,
    });

    const result = await sendMail(baseOptions);

    expect(result).toEqual({ ok: false, status: 401, body: errorBody });
  });

  it("falls back to text body when JSON parsing fails", async () => {
    const { sendMail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error("not json"); },
      text: async () => "Internal Server Error",
    });

    const result = await sendMail(baseOptions);

    expect(result).toEqual({ ok: false, status: 500, body: "Internal Server Error" });
  });

  it("sends correctly without optional text and html fields", async () => {
    const { sendMail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await sendMail({ to: "a@b.com", subject: "No body" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBeUndefined();
    expect(body.html).toBeUndefined();
  });
});

// sendPasswordResetEmail 

describe("sendPasswordResetEmail", () => {
  const baseParams = {
    to: "user@example.com",
    name: "Alice",
    resetUrl: "https://example.com/reset?token=abc",
  };

  it("sends an email with the correct subject", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail(baseParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toBe("Reset your password");
  });

  it("includes the user's name in the text body", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail(baseParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("Hi Alice,");
  });

  it("includes the reset URL in the text body", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail(baseParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain(baseParams.resetUrl);
  });

  it("includes the reset URL as a link in the HTML body", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail(baseParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.html).toContain(`href="${baseParams.resetUrl}"`);
  });

  it("falls back to 'there' when name is not provided", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail({ to: "user@example.com", resetUrl: baseParams.resetUrl });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("Hi there,");
    expect(body.html).toContain("Hi there,");
  });

  it("sends to the correct recipient", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    await sendPasswordResetEmail(baseParams);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toEqual([{ address: "user@example.com" }]);
  });

  it("returns the result from sendMail on success", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    const result = await sendPasswordResetEmail(baseParams);

    expect(result).toEqual({ ok: true, status: 200, body: {} });
  });

  it("returns the failure result and logs error when sending fails", async () => {
    const { sendPasswordResetEmail } = await importMaileroo();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    const result = await sendPasswordResetEmail(baseParams);

    expect(result.ok).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to send password reset email",
      expect.objectContaining({ ok: false })
    );
    consoleSpy.mockRestore();
  });
});

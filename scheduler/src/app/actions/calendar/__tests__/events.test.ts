import { createEvent } from "../events";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      create: (...args: any[]) => mockCreate(...args),
    },
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validFields = {
  title: "Lecture",
  start: "2026-04-01T10:00:00.000Z",
  end: "2026-04-01T11:00:00.000Z",
  category: "Lecture",
};

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

describe("createEvent — auth guard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws Unauthorized when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expect(createEvent(makeFormData(validFields))).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when session has no user", async () => {
    mockGetServerSession.mockResolvedValue({ user: null });
    await expect(createEvent(makeFormData(validFields))).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("throws Unauthorized when session user has no id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });
    await expect(createEvent(makeFormData(validFields))).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Successful creation
// ---------------------------------------------------------------------------

describe("createEvent — successful creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCreate.mockResolvedValue({});
  });

  it("calls prisma.event.create with correct data", async () => {
    await createEvent(makeFormData(validFields));

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        title: "Lecture",
        start: new Date("2026-04-01T10:00:00.000Z"),
        end: new Date("2026-04-01T11:00:00.000Z"),
        category: "Lecture",
        userId: "user-123",
      },
    });
  });

  it("uses the authenticated user's id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "different-user" } });
    await createEvent(makeFormData(validFields));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "different-user" }),
      }),
    );
  });

  it("parses start and end as Date objects", async () => {
    await createEvent(makeFormData(validFields));

    const { data } = mockCreate.mock.calls[0][0];
    expect(data.start).toBeInstanceOf(Date);
    expect(data.end).toBeInstanceOf(Date);
  });

  it("uses 'default' category when category field is missing", async () => {
    const { category: _, ...withoutCategory } = validFields;
    await createEvent(makeFormData(withoutCategory));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "default" }),
      }),
    );
  });

  it("uses provided category when present", async () => {
    await createEvent(makeFormData({ ...validFields, category: "Exam" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "Exam" }),
      }),
    );
  });

  it("uses 'default' category when category is an empty string", async () => {
    await createEvent(makeFormData({ ...validFields, category: "" }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "default" }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("createEvent — error handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
  });

  it("propagates errors thrown by prisma", async () => {
    mockCreate.mockRejectedValue(new Error("DB failure"));
    await expect(createEvent(makeFormData(validFields))).rejects.toThrow(
      "DB failure",
    );
  });
});
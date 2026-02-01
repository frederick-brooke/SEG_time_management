import { GET, POST, DELETE } from "../route";
import { getServerSession } from "next-auth/next";

jest.mock("next-auth/next", () => ({
  __esModule: true,
  default: jest.fn(() => ({})), 
  getServerSession: jest.fn(),
}));

jest.mock("googleapis", () => {
  const mEvents = {
    list: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  };
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(function() {
          return { setCredentials: jest.fn() };
        }),
      },
      calendar: jest.fn(() => ({
        events: mEvents,
      })),
    },
    _mEvents: mEvents, 
  };
});

import { google } from "googleapis";

describe("Calendar Events API Route", () => {

  const mockEvents = google.calendar().events;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEvents.list.mockResolvedValue({ data: { items: [] } });
    mockEvents.insert.mockResolvedValue({ data: {} });
    mockEvents.delete.mockResolvedValue({ data: {} });
  });

  it("GET: returns list of events when authenticated", async () => {
    getServerSession.mockResolvedValue({ accessToken: "token" });
    mockEvents.list.mockResolvedValueOnce({
      data: { items: [{ id: "123", summary: "Meeting" }] },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].summary).toBe("Meeting");
  });

  it("POST: inserts a new event correctly", async () => {
    getServerSession.mockResolvedValue({ accessToken: "token" });
    mockEvents.insert.mockResolvedValueOnce({ data: { id: "new_id" } });

    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ title: "Test", start: "2024-01-01T10:00", end: "2024-01-01T11:00" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "new_id" });
  });
});
// useEventDelete.test.ts
import { renderHook } from "@testing-library/react";
import { useEventDelete } from "../useEventDelete";
import { getDeleteConfirmMsg, deleteEventRequest } from "../eventDeleteApi";

jest.mock("../eventDeleteApi");

const mockGetDeleteConfirmMsg = getDeleteConfirmMsg as jest.Mock;
const mockDeleteEventRequest = deleteEventRequest as jest.Mock;

global.alert = jest.fn();
global.confirm = jest.fn();

const VALID_ID = "507f1f77bcf86cd799439011";
const BASE_EVENT = {
  id: VALID_ID,
  title: "Team Meeting",
  start: new Date("2024-06-15T10:00:00.000Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDeleteConfirmMsg.mockReturnValue("Remove only this specific occurrence?");
  (confirm as jest.Mock).mockReturnValue(true);
  mockDeleteEventRequest.mockResolvedValue({ ok: true });
});

function setup() {
  const refreshEvents = jest.fn().mockResolvedValue([]);
  const triggerUndo = jest.fn();
  const { result } = renderHook(() => useEventDelete(refreshEvents, triggerUndo));
  return { deleteEvent: result.current, refreshEvents, triggerUndo };
}

// ── ID validation ─────────────────────────────────────────────────────────

describe("ID validation", () => {
  it("alerts and returns false when id is missing", async () => {
    const { deleteEvent } = setup();
    const result = await deleteEvent({ ...BASE_EVENT, id: "" }, "single");
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("Invalid event ID"));
    expect(result).toBe(false);
  });

  it("alerts and returns false when id is not a valid ObjectId", async () => {
    const { deleteEvent } = setup();
    const result = await deleteEvent({ ...BASE_EVENT, id: "not-valid" }, "single");
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("Invalid event ID"));
    expect(result).toBe(false);
  });
});

// ── confirm dialog ────────────────────────────────────────────────────────

describe("confirm dialog", () => {
  it("returns false when user cancels confirm", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(false);
    const { deleteEvent } = setup();
    const result = await deleteEvent(BASE_EVENT, "single");
    expect(result).toBe(false);
    expect(mockDeleteEventRequest).not.toHaveBeenCalled();
  });

  it("passes the confirm message from getDeleteConfirmMsg", async () => {
    const { deleteEvent } = setup();
    await deleteEvent(BASE_EVENT, "series");
    expect(confirm).toHaveBeenCalledWith("Remove only this specific occurrence?");
  });
});

// ── deleteEventRequest call ───────────────────────────────────────────────

describe("deleteEventRequest", () => {
  it("calls deleteEventRequest with id, mode, and instanceDate", async () => {
    const { deleteEvent } = setup();
    await deleteEvent(BASE_EVENT, "single");
    expect(mockDeleteEventRequest).toHaveBeenCalledWith(
      VALID_ID,
      "single",
      "2024-06-15T10:00:00.000Z",
    );
  });

  it("converts string start date to ISO string", async () => {
    const { deleteEvent } = setup();
    await deleteEvent({ ...BASE_EVENT, start: "2024-06-15T10:00:00.000Z" }, "single");
    expect(mockDeleteEventRequest).toHaveBeenCalledWith(
      VALID_ID, "single", "2024-06-15T10:00:00.000Z",
    );
  });

  it("alerts and returns false when response is not ok", async () => {
    mockDeleteEventRequest.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not found" }),
    });
    const { deleteEvent } = setup();
    const result = await deleteEvent(BASE_EVENT, "single");
    expect(alert).toHaveBeenCalledWith("Not found");
    expect(result).toBe(false);
  });
});

// ── success path ──────────────────────────────────────────────────────────

describe("success path", () => {
  it("calls triggerUndo and refreshEvents on success", async () => {
    const { deleteEvent, triggerUndo, refreshEvents } = setup();
    await deleteEvent(BASE_EVENT, "single");
    
    // FIX: Include the second argument "single" to match the hook implementation
    expect(triggerUndo).toHaveBeenCalledWith(BASE_EVENT, "single");
    
    expect(refreshEvents).toHaveBeenCalled();
  });

  it("returns true on success", async () => {
    const { deleteEvent } = setup();
    const result = await deleteEvent(BASE_EVENT, "single");
    expect(result).toBe(true);
  });
  
  // Optional: Add a test to ensure "series" maps to "full" for triggerUndo
  it("calls triggerUndo with 'full' mode when deleting a series", async () => {
    const { deleteEvent, triggerUndo } = setup();
    await deleteEvent(BASE_EVENT, "series");
    
    expect(triggerUndo).toHaveBeenCalledWith(BASE_EVENT, "full");
  });
});
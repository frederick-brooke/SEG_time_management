// taskEditApi.test.ts
import { patchTask } from "../taskEditApi";
import type { TaskFormData } from "@/components/tasks/TaskForm";

global.fetch = jest.fn();

const BASE_FORM: TaskFormData = {
  name: "Test Task",
  description: "A description",
  dueDate: "2024-06-15",
  url: "https://example.com",
  subtasks: "",
  durationHours: "1",
  durationMinutes: "30",
  examId: "exam1",
  priority: "High",
  bufferDays: 2,
  isRecurring: false,
  recurrence: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockResolvedValue({ ok: true });
});

// patchTask: fetch call

describe("patchTask", () => {
  it("calls fetch with PATCH method and correct URL", async () => {
    await patchTask("task123", BASE_FORM);
    expect(fetch).toHaveBeenCalledWith(
      "/api/tasks/task123",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("sets Content-Type header", async () => {
    await patchTask("task123", BASE_FORM);
    const options = (fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns the fetch response", async () => {
    const mockResponse = { ok: true, status: 200 };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    const result = await patchTask("task123", BASE_FORM);
    expect(result).toBe(mockResponse);
  });
});

// patchTask: duration math

describe("patchTask duration", () => {
  it("converts hours and minutes to total minutes", async () => {
    await patchTask("task123", { ...BASE_FORM, durationHours: "1", durationMinutes: "30" });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.duration).toBe(90);
  });

  it("defaults missing hours/minutes to 0", async () => {
    await patchTask("task123", { ...BASE_FORM, durationHours: "", durationMinutes: "" });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.duration).toBe(0);
  });
});

// patchTask: nullable fields

describe("patchTask nullable fields", () => {
  it("sends null when dueDate is falsy", async () => {
    await patchTask("task123", { ...BASE_FORM, dueDate: null });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.dueDate).toBeNull();
  });

  it("sends null when url is falsy", async () => {
    await patchTask("task123", { ...BASE_FORM, url: "" });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.url).toBeNull();
  });
});

// patchTask: parseSubtasks

describe("patchTask subtasks parsing", () => {
  it("splits a comma-separated string into an array", async () => {
    await patchTask("task123", { ...BASE_FORM, subtasks: "a, b, c" });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.subtasks).toEqual(["a", "b", "c"]);
  });

  it("filters out empty entries from string", async () => {
    await patchTask("task123", { ...BASE_FORM, subtasks: "a,,b, " });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.subtasks).toEqual(["a", "b"]);
  });

  it("returns empty array for empty string", async () => {
    await patchTask("task123", { ...BASE_FORM, subtasks: "" });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.subtasks).toEqual([]);
  });

  it("passes through an array directly", async () => {
    await patchTask("task123", { ...BASE_FORM, subtasks: ["x", "y"] as any });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.subtasks).toEqual(["x", "y"]);
  });

  it("returns empty array when subtasks is null/undefined", async () => {
    await patchTask("task123", { ...BASE_FORM, subtasks: null as any });
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.subtasks).toEqual([]);
  });
});
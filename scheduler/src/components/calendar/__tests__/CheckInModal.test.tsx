import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CheckInModal from "../CheckInModal";

// Mocks 
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setIsModalOpen: jest.fn(),
  }),
}));

const mockOnDone = jest.fn();

const mockTasks = [
  {
    id: "t1", title: "Write report", duration: 60, priority: "High",
    scheduledDate: "2030-01-07T10:00:00", event: null,
  },
  {
    id: "t2", title: "Review PR", duration: 30, priority: "Medium",
    scheduledDate: "2030-01-07T11:00:00", event: { title: "Sprint Review" },
  },
];

function mockFetchGet(tasks = mockTasks) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    json: () => Promise.resolve({ tasks }),
  } as any);
}

function mockFetchGetThenPost(tasks = mockTasks, postResponse = { tasksToReschedule: [] }) {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ json: () => Promise.resolve({ tasks }) } as any)
    .mockResolvedValueOnce({ json: () => Promise.resolve(postResponse) } as any);
}

async function renderAndWait(onDone = mockOnDone) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<CheckInModal onDone={onDone} />);
  });
  return result!;
}

beforeEach(() => jest.clearAllMocks());

// Loading / empty state

describe("CheckInModal — loading and empty state", () => {
  it("renders nothing when tasks array is empty", async () => {
    mockFetchGet([]);
    await renderAndWait();
    expect(screen.queryByText("Daily Check-in")).not.toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    render(<CheckInModal onDone={mockOnDone} />);
    expect(screen.queryByText("Daily Check-in")).not.toBeInTheDocument();
  });

  it("renders nothing when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    await renderAndWait();
    expect(screen.queryByText("Daily Check-in")).not.toBeInTheDocument();
  });
});

// Header 

describe("CheckInModal — header", () => {
  it("shows the title and subtitle", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText("Daily Check-in")).toBeInTheDocument();
    expect(screen.getByText("How did you get on with these tasks?")).toBeInTheDocument();
  });

  it("shows 0 of N marked initially", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText(`0 of ${mockTasks.length} marked`)).toBeInTheDocument();
  });

  it("shows 0% initially", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("updates marked count when task is completed", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    expect(screen.getByText("1 of 2 marked")).toBeInTheDocument();
  });

  it("shows 50% when one of two tasks is marked completed", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});

// Task list 

describe("CheckInModal — task list", () => {
  it("renders all tasks", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText("Review PR")).toBeInTheDocument();
  });

  it("shows task duration", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText("60m")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
  });

  it("shows event title badge when task has a linked event", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText(/Sprint Review/i)).toBeInTheDocument();
  });

  it("does not show event badge when task has no event", async () => {
    mockFetchGet([{ ...mockTasks[0], event: null }]);
    await renderAndWait();
    expect(screen.queryByText(/🔗/)).not.toBeInTheDocument();
  });

  it("shows High priority in red", async () => {
    mockFetchGet();
    await renderAndWait();
    const badge = screen.getByText("High");
    expect(badge.className).toContain("text-red-500");
  });

  it("shows Medium priority in orange", async () => {
    mockFetchGet();
    await renderAndWait();
    const badge = screen.getByText("Medium");
    expect(badge.className).toContain("text-orange-500");
  });

  it("shows Low priority in green", async () => {
    mockFetchGet([{ ...mockTasks[0], priority: "Low" }]);
    await renderAndWait();
    const badge = screen.getByText("Low");
    expect(badge.className).toContain("text-green-500");
  });
});

// Status buttons 

describe("CheckInModal — status buttons", () => {
  it("renders Done, Partial, and Missed buttons for each task", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    expect(screen.getByText(/✅ Done/i)).toBeInTheDocument();
    expect(screen.getByText(/⏳ Partial/i)).toBeInTheDocument();
    expect(screen.getByText(/❌ Missed/i)).toBeInTheDocument();
  });

  it("marks task as completed when Done is clicked", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/✅ Done/i));
    const card = screen.getByText("Write report").closest("div[class*='rounded-2xl']")!;
    expect(card.className).toContain("border-green-200");
  });

  it("marks task as partial when Partial is clicked", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    const card = screen.getByText("Write report").closest("div[class*='rounded-2xl']")!;
    expect(card.className).toContain("border-amber-200");
  });

  it("marks task as missed when Missed is clicked", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/❌ Missed/i));
    const card = screen.getByText("Write report").closest("div[class*='rounded-2xl']")!;
    expect(card.className).toContain("border-red-100");
  });

  it("allows changing status from completed to missed", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/✅ Done/i));
    fireEvent.click(screen.getByText(/❌ Missed/i));
    const card = screen.getByText("Write report").closest("div[class*='rounded-2xl']")!;
    expect(card.className).toContain("border-red-100");
  });
});

// Partial progress slider 

describe("CheckInModal — partial progress slider", () => {
  it("shows slider when task is marked partial", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("does not show slider for non-partial tasks", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("shows remaining minutes based on progress", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    // default progress is 100, so remaining is 0
    expect(screen.getByText(/0m remaining will be rescheduled/i)).toBeInTheDocument();
  });

  it("updates remaining minutes when slider changes", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "50" } });
    expect(screen.getByText(/30m remaining will be rescheduled/i)).toBeInTheDocument();
  });

  it("shows progress percentage from slider", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "75" } });
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("hides slider when status changes from partial to completed", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    fireEvent.click(screen.getByText(/✅ Done/i));
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});

// Footer 

describe("CheckInModal — footer", () => {
  it("shows prompt to mark all tasks when not all answered", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText(/Mark all 2 tasks to continue/i)).toBeInTheDocument();
  });

  it("hides prompt when all tasks are answered", async () => {
    mockFetchGet([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/✅ Done/i));
    expect(screen.queryByText(/Mark all/i)).not.toBeInTheDocument();
  });

  it("disables submit button when not all tasks answered", async () => {
    mockFetchGet();
    await renderAndWait();
    expect(screen.getByText("Submit Check-in")).toBeDisabled();
  });

  it("enables submit button when all tasks answered", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    fireEvent.click(screen.getAllByText(/✅ Done/i)[1]);
    expect(screen.getByText("Submit Check-in")).not.toBeDisabled();
  });

  it("shows Saving while submitting", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    fireEvent.click(screen.getAllByText(/✅ Done/i)[1]);
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByText("Submit Check-in"));
    expect(await screen.findByText("Saving…")).toBeInTheDocument();
  });

  it("calls onDone with tasksToReschedule after successful submit", async () => {
    const tasksToReschedule = [{ id: "t1", remainingDuration: 30 }];
    mockFetchGetThenPost(mockTasks, { tasksToReschedule });
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    fireEvent.click(screen.getAllByText(/✅ Done/i)[1]);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Check-in"));
    });

    expect(mockOnDone).toHaveBeenCalledWith(tasksToReschedule);
  });

  it("sends correct entries to POST including partial progress", async () => {
    mockFetchGetThenPost([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/⏳ Partial/i));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "50" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Check-in"));
    });

    const postCall = (global.fetch as jest.Mock).mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    expect(body.entries[0]).toEqual({ taskId: "t1", status: "partial", progress: 50 });
  });

  it("sends progress 100 for completed tasks", async () => {
    mockFetchGetThenPost([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/✅ Done/i));

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Check-in"));
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(body.entries[0]).toEqual({ taskId: "t1", status: "completed", progress: 100 });
  });

  it("sends progress 0 for missed tasks", async () => {
    mockFetchGetThenPost([mockTasks[0]]);
    await renderAndWait();
    fireEvent.click(screen.getByText(/❌ Missed/i));

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Check-in"));
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(body.entries[0]).toEqual({ taskId: "t1", status: "missed", progress: 0 });
  });

  it("hides modal and calls onDone with empty array on remind me later", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getByText(/Remind me later/i));
    expect(mockOnDone).toHaveBeenCalledWith([]);
    expect(screen.queryByText("Daily Check-in")).not.toBeInTheDocument();
  });

  it("handles POST error gracefully without crashing", async () => {
    mockFetchGet();
    await renderAndWait();
    fireEvent.click(screen.getAllByText(/✅ Done/i)[0]);
    fireEvent.click(screen.getAllByText(/✅ Done/i)[1]);
    global.fetch = jest.fn().mockRejectedValue(new Error("POST failed"));

    await act(async () => {
      fireEvent.click(screen.getByText("Submit Check-in"));
    });

    expect(screen.getByText("Submit Check-in")).toBeInTheDocument();
  });
});
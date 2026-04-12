import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuickScheduleModal from "../QuickScheduleModal";

// Mocks

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setIsModalOpen: jest.fn(),
  }),
}));

jest.mock("date-fns", () => ({
  format: (_date: Date, fmt: string) =>
    fmt === "yyyy-MM-dd" ? "2026-03-23" : "09:00",
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

// Fixtures

const task = { id: "task-123", title: "Write unit tests" };

const defaultProps = {
  task,
  onClose: jest.fn(),
  onSaved: jest.fn(),
};

function renderModal(props = {}) {
  return render(<QuickScheduleModal {...defaultProps} {...props} />);
}

// Rendering

describe("QuickScheduleModal — rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the task title", () => {
    renderModal();
    expect(screen.getByText("Write unit tests")).toBeInTheDocument();
  });

  it("renders the date input with today's date as default", () => {
    renderModal();
    expect(screen.getByDisplayValue("2026-03-23")).toBeInTheDocument();
  });

  it("renders the time input with current time as default", () => {
    renderModal();
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
  });

  it("renders the Schedule Task button", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Schedule Task" })).toBeInTheDocument();
  });

  it("renders the close button", () => {
    renderModal();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });
});

// onClose behaviour

describe("QuickScheduleModal — onClose", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onClose when the ✕ button is clicked", () => {
    renderModal();
    fireEvent.click(screen.getByText("✕"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    renderModal();
    // The outermost fixed div is the backdrop
    const backdrop = screen
      .getByText("Schedule Task", { selector: "h3" })
      .closest(".fixed")!;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal card is clicked", () => {
    renderModal();
    const card = screen.getByText("Schedule Task", { selector: "h3" }).closest("div")!;
    fireEvent.click(card);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});

// handleSchedule — guard: missing inputs

describe("QuickScheduleModal — handleSchedule guard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not call fetch when date is empty", async () => {
    renderModal();
    // Clear the date input
    fireEvent.change(screen.getByDisplayValue("2026-03-23"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("does not call fetch when time is empty", async () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue("09:00"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("does not call onSaved when inputs are missing", async () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue("2026-03-23"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(defaultProps.onSaved).not.toHaveBeenCalled();
    });
  });
});

// handleSchedule — successful submission

describe("QuickScheduleModal — handleSchedule success", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls fetch with the correct endpoint and method", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tasks/task-123",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("sends Content-Type application/json header", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  it("sends scheduledDate and scheduledTime in the body", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(body).toHaveProperty("scheduledDate");
      expect(body).toHaveProperty("scheduledTime");
    });
  });

  it("scheduledDate is midnight (00:00:00) for the selected date", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const date = new Date(body.scheduledDate);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });
  });

  it("scheduledTime reflects the selected hour and minute", async () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue("09:00"), {
      target: { value: "14:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      const time = new Date(body.scheduledTime);
      expect(time.getHours()).toBe(14);
      expect(time.getMinutes()).toBe(30);
    });
  });

  it("calls onSaved after successful fetch", async () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(defaultProps.onSaved).toHaveBeenCalledTimes(1);
    });
  });

  it("uses the task id from props in the fetch URL", async () => {
    render(
      <QuickScheduleModal
        task={{ id: "different-id", title: "Other Task" }}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Schedule Task" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tasks/different-id",
        expect.any(Object),
      );
    });
  });
});
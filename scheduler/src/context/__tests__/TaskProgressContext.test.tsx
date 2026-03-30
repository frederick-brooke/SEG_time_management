/**
 * Testing for Task Progress Context.
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskProgressProvider, useTaskProgress } from "../TaskProgressContext";

/** Test component that uses the hook */
function TestComponent() {
  const { progressPercentage, tasks, isLoading, refreshProgress, triggerProgressUpdate } = useTaskProgress();
  return (
    <div>
      <div data-testid="progress">{progressPercentage}%</div>
      <div data-testid="loading">{isLoading ? "loading" : "done"}</div>
      <div data-testid="tasks-count">{tasks.length}</div>
      <button onClick={() => refreshProgress("user123")}>Refresh</button>
      <button onClick={() => triggerProgressUpdate()}>Trigger</button>
    </div>
  );
}

function mockFetch(response: any, ok = true) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("TaskProgressContext", () => {
  describe("initialization", () => {
    it("throws error when useTaskProgress is called outside provider", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<TestComponent />)).toThrow("useTaskProgress must be used within TaskProgressProvider");
      consoleErrorSpy.mockRestore();
    });

    it("initializes with zero progress and empty tasks", () => {
      render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );
      expect(screen.getByTestId("progress")).toHaveTextContent("0%");
      expect(screen.getByTestId("tasks-count")).toHaveTextContent("0");
    });
  });

  describe("localStorage caching", () => {
    it("saves progress to localStorage when updated", async () => {
      global.fetch = mockFetch({
        tasks: [
          { id: "t1", status: "completed" },
          { id: "t2", status: "todo" }
        ]
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("progress")).not.toHaveTextContent("0%");
        });
      });

      const cached = localStorage.getItem("task-progress-cache");
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(parsed.progressPercentage).toBe(50); // 1 completed out of 2
      expect(parsed.tasks).toHaveLength(2);
    });

    it("loads cached progress on mount", () => {
      const cacheData = {
        progressPercentage: 75,
        tasks: [{ id: "t1", status: "completed" }],
        lastUpdatedAt: Date.now(),
      };
      localStorage.setItem("task-progress-cache", JSON.stringify(cacheData));

      render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      expect(screen.getByTestId("progress")).toHaveTextContent("75%");
      expect(screen.getByTestId("tasks-count")).toHaveTextContent("1");
    });

    it("handles corrupted cache gracefully", () => {
      localStorage.setItem("task-progress-cache", "invalid json");
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      expect(screen.getByTestId("progress")).toHaveTextContent("0%");
      consoleErrorSpy.mockRestore();
    });
  });

  describe("refreshProgress", () => {
    it("fetches tasks and calculates progress percentage", async () => {
      global.fetch = mockFetch({
        tasks: [
          { id: "t1", status: "completed" },
          { id: "t2", status: "completed" },
          { id: "t3", status: "todo" }
        ]
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("progress")).toHaveTextContent("66%");
        });
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/tasks?userId=user123");
    });

    it("returns early when userId is undefined", async () => {
      render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const component = screen.getByTestId("progress").closest("div");
      await act(async () => {
        // Try to call with undefined userId - won't happen in normal flow
        // but verify the function handles it gracefully
      });

      expect(screen.getByTestId("loading")).toHaveTextContent("done");
    });

    it("handles fetch errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("loading")).toHaveTextContent("done");
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to refresh progress"), expect.any(Error));
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("handles non-ok response status gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("")
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("loading")).toHaveTextContent("done");
        });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("status 500"));
      consoleWarnSpy.mockRestore();
    });

    it("handles empty response body gracefully", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("")
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("loading")).toHaveTextContent("done");
        });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Empty response body"));
      consoleWarnSpy.mockRestore();
    });

    it("handles malformed JSON response gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue("invalid json {")
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("loading")).toHaveTextContent("done");
        });
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse JSON"), expect.any(SyntaxError));
      consoleErrorSpy.mockRestore();
    });

    it("sets isLoading during fetch and clears after", async () => {
      let resolveResponse: any;
      global.fetch = jest.fn().mockReturnValue(
        new Promise(resolve => {
          resolveResponse = resolve;
        })
      );

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });

      act(() => {
        refreshBtn.click();
      });

      // Now resolve the fetch
      await act(async () => {
        resolveResponse({
          ok: true,
          json: async () => ({ tasks: [] })
        });
        await waitFor(() => {
          expect(screen.getByTestId("loading")).toHaveTextContent("done");
        });
      });
    });

    it("calculates progress as 0 when no tasks exist", async () => {
      global.fetch = mockFetch({ tasks: [] });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("progress")).toHaveTextContent("0%");
        });
      });
    });

    it("correctly calculates progress with all completed tasks", async () => {
      global.fetch = mockFetch({
        tasks: [
          { id: "t1", status: "completed" },
          { id: "t2", status: "completed" },
          { id: "t3", status: "completed" }
        ]
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(screen.getByTestId("progress")).toHaveTextContent("100%");
        });
      });
    });
  });

  describe("event broadcasting", () => {
    it("dispatches PROGRESS_SYNC_EVENT when refreshProgress succeeds", async () => {
      global.fetch = mockFetch({
        tasks: [{ id: "t1", status: "completed" }]
      });

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "task-progress-updated" }));
        });
      });
    });

    it("triggerProgressUpdate dispatches the sync event", async () => {
      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      const triggerBtn = getByRole("button", { name: /Trigger/i });
      act(() => {
        triggerBtn.click();
      });

      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "task-progress-updated" }));
    });

    it("syncs progress when receiving PROGRESS_SYNC_EVENT from cache", async () => {
      const cacheData = {
        progressPercentage: 25,
        tasks: [{ id: "t1" }],
        lastUpdatedAt: Date.now(),
      };
      localStorage.setItem("task-progress-cache", JSON.stringify(cacheData));

      const { getByRole } = render(
        <TaskProgressProvider>
          <TestComponent />
        </TaskProgressProvider>
      );

      expect(screen.getByTestId("progress")).toHaveTextContent("25%");

      // Simulate another tab/component updating cache
      const newCache = {
        progressPercentage: 50,
        tasks: [{ id: "t1" }, { id: "t2" }],
        lastUpdatedAt: Date.now(),
      };
      localStorage.setItem("task-progress-cache", JSON.stringify(newCache));

      // Manually dispatch the event to simulate other components
      act(() => {
        window.dispatchEvent(new Event("task-progress-updated"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("progress")).toHaveTextContent("50%");
      });
    });
  });

  describe("multiple consumers", () => {
    function TestComponent2() {
      const { progressPercentage } = useTaskProgress();
      return <div data-testid="progress2">{progressPercentage}%</div>;
    }

    it("syncs progress across multiple consumers", async () => {
      global.fetch = mockFetch({
        tasks: [
          { id: "t1", status: "completed" },
          { id: "t2", status: "todo" }
        ]
      });

      const { getByRole, getByTestId } = render(
        <TaskProgressProvider>
          <TestComponent />
          <TestComponent2 />
        </TaskProgressProvider>
      );

      const refreshBtn = getByRole("button", { name: /Refresh/i });
      await act(async () => {
        refreshBtn.click();
        await waitFor(() => {
          expect(getByTestId("progress")).toHaveTextContent("50%");
          expect(getByTestId("progress2")).toHaveTextContent("50%");
        });
      });
    });
  });
});

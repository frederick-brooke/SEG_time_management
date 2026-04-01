/**
 * Tests for src/components/calendar/FilterSidebar.tsx
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilterSidebar from "../FilterSidebar";

// ── Factory helpers 

function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    activeFilters: {
      tasks: true,
      priorityTasks: false,
      completed: false,
    },
    categories: [
      { id: "cat-1", name: "Lecture", color: "#6366f1" },
      { id: "cat-2", name: "Lab", color: "#a78bfa" },
    ],
    categoryFilters: {
      "cat-1": true,
      "cat-2": false,
    },
    onToggleFilter: jest.fn(),
    onToggleCategory: jest.fn(),
    onManageCategories: jest.fn(),
    ...overrides,
  };
}

// ── Tests 

describe("FilterSidebar", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ────

  describe("rendering", () => {
    it("should render the Tasks section heading", () => {
      render(<FilterSidebar {...createDefaultProps()} />);
      expect(screen.getAllByText("Tasks")).toHaveLength(2);
    });

    it("should render all three task filter labels", () => {
      render(<FilterSidebar {...createDefaultProps()} />);
      expect(screen.getAllByText("Tasks")).toHaveLength(2);
      expect(screen.getByText("Priority Tasks")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should render the Categories section heading", () => {
      render(<FilterSidebar {...createDefaultProps()} />);
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    it("should render the + Manage button", () => {
      render(<FilterSidebar {...createDefaultProps()} />);
      expect(screen.getByText("+ Manage")).toBeInTheDocument();
    });

    it("should render all provided category names", () => {
      render(<FilterSidebar {...createDefaultProps()} />);
      expect(screen.getByText("Lecture")).toBeInTheDocument();
      expect(screen.getByText("Lab")).toBeInTheDocument();
    });

    it("should render no category labels when categories is empty", () => {
      render(
        <FilterSidebar
          {...createDefaultProps({ categories: [], categoryFilters: {} })}
        />
      );
      expect(screen.queryByText("Lecture")).not.toBeInTheDocument();
      expect(screen.queryByText("Lab")).not.toBeInTheDocument();
    });
  });

  // ── FilterCheckbox state ─

  describe("FilterCheckbox active state", () => {
    it("should show ✓ for an active task filter", () => {
      render(
        <FilterSidebar
          {...createDefaultProps({
            activeFilters: { tasks: true, priorityTasks: false, completed: false },
            categoryFilters: { "cat-1": false, "cat-2": false },
          })}
        />
      );
      expect(screen.getAllByText("✓")).toHaveLength(1);
    });

    it("should show no ✓ when all task filters are inactive", () => {
      render(
        <FilterSidebar
          {...createDefaultProps({
            activeFilters: { tasks: false, priorityTasks: false, completed: false },
            categoryFilters: { "cat-1": false, "cat-2": false },
          })}
        />
      );
      expect(screen.queryByText("✓")).not.toBeInTheDocument();
    });

    it("should show multiple ✓ marks when multiple filters are active", () => {
      render(
        <FilterSidebar
          {...createDefaultProps({
            activeFilters: { tasks: true, priorityTasks: true, completed: false },
            categoryFilters: { "cat-1": true, "cat-2": false },
          })}
        />
      );
      expect(screen.getAllByText("✓")).toHaveLength(3);
    });

    it("should show ✓ for an active category filter", () => {
      render(
        <FilterSidebar
          {...createDefaultProps({
            activeFilters: { tasks: false, priorityTasks: false, completed: false },
            categoryFilters: { "cat-1": true, "cat-2": false },
          })}
        />
      );
      expect(screen.getByText("✓")).toBeInTheDocument();
    });
  });

  // ── Callbacks ────

  describe("callbacks", () => {
    it("should call onToggleFilter with 'tasks' when Tasks checkbox is clicked", () => {
      const onToggleFilter = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onToggleFilter })} />);

      const taskSpan = screen.getAllByText("Tasks")[1];
      const taskLabel = taskSpan.closest("label")!;
      fireEvent.click(taskLabel.querySelector("div")!);

      expect(onToggleFilter).toHaveBeenCalledWith("tasks");
    });

    it("should call onToggleFilter with 'priorityTasks' when Priority Tasks is clicked", () => {
      const onToggleFilter = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onToggleFilter })} />);

      const label = screen.getByText("Priority Tasks").closest("label")!;
      fireEvent.click(label.querySelector("div")!);

      expect(onToggleFilter).toHaveBeenCalledWith("priorityTasks");
    });

    it("should call onToggleFilter with 'completed' when Completed is clicked", () => {
      const onToggleFilter = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onToggleFilter })} />);

      const label = screen.getByText("Completed").closest("label")!;
      fireEvent.click(label.querySelector("div")!);

      expect(onToggleFilter).toHaveBeenCalledWith("completed");
    });

    it("should call onToggleCategory with the correct id when a category checkbox is clicked", () => {
      const onToggleCategory = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onToggleCategory })} />);

      const label = screen.getByText("Lecture").closest("label")!;
      fireEvent.click(label.querySelector("div")!);

      expect(onToggleCategory).toHaveBeenCalledWith("cat-1");
    });

    it("should call onToggleCategory with the second category id when Lab is clicked", () => {
      const onToggleCategory = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onToggleCategory })} />);

      const label = screen.getByText("Lab").closest("label")!;
      fireEvent.click(label.querySelector("div")!);

      expect(onToggleCategory).toHaveBeenCalledWith("cat-2");
    });

    it("should call onManageCategories when + Manage is clicked", () => {
      const onManageCategories = jest.fn();
      render(<FilterSidebar {...createDefaultProps({ onManageCategories })} />);

      fireEvent.click(screen.getByText("+ Manage"));

      expect(onManageCategories).toHaveBeenCalled();
    });
  });

  // ── Multiple categories ──

  describe("multiple categories", () => {
    it("should render all categories when given a larger list", () => {
      const categories = [
        { id: "c1", name: "Lecture", color: "#6366f1" },
        { id: "c2", name: "Lab", color: "#a78bfa" },
        { id: "c3", name: "Exam", color: "#f87171" },
        { id: "c4", name: "Personal", color: "#fbbf24" },
      ];
      const categoryFilters = { c1: true, c2: false, c3: true, c4: false };
      render(
        <FilterSidebar
          {...createDefaultProps({ categories, categoryFilters })}
        />
      );
      expect(screen.getByText("Lecture")).toBeInTheDocument();
      expect(screen.getByText("Lab")).toBeInTheDocument();
      expect(screen.getByText("Exam")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    it("should call onToggleCategory with the correct id for each category", () => {
      const onToggleCategory = jest.fn();
      const categories = [
        { id: "c1", name: "Lecture", color: "#6366f1" },
        { id: "c2", name: "Lab", color: "#a78bfa" },
      ];
      render(
        <FilterSidebar
          {...createDefaultProps({
            categories,
            categoryFilters: { c1: false, c2: false },
            onToggleCategory,
          })}
        />
      );

      const labLabel = screen.getByText("Lab").closest("label")!;
      fireEvent.click(labLabel.querySelector("div")!);

      expect(onToggleCategory).toHaveBeenCalledWith("c2");
    });
  });
});
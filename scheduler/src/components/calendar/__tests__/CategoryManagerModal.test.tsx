/**
 * Tests for src/components/calendar/CategoryManagerModal.tsx
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryManagerModal from "../CategoryManagerModal";

// ── Mocks ─────────

global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

// ── Factory helpers 

/**
 * Creates a mock category object.
 */
function createCategory(overrides: Record<string, any> = {}) {
  return {
    id: "cat-1",
    name: "Lecture",
    color: "#6366f1",
    ...overrides,
  };
}

/**
 * Default props for CategoryManagerModal.
 */
function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    categories: [createCategory()],
    onClose: jest.fn(),
    onCategoriesChange: jest.fn(),
    ...overrides,
  };
}

// ── Tests 

describe("CategoryManagerModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  // ── Modal rendering ──────

  describe("modal rendering", () => {
    it("should render the modal title", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    it("should render all provided categories", () => {
      const categories = [
        createCategory({ id: "cat-1", name: "Lecture" }),
        createCategory({ id: "cat-2", name: "Lab", color: "#ff0000" }),
      ];
      render(<CategoryManagerModal {...createDefaultProps({ categories })} />);

      expect(screen.getByText("Lecture")).toBeInTheDocument();
      expect(screen.getByText("Lab")).toBeInTheDocument();
    });

    it("should render the Add New Category section", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      expect(screen.getByText("Add New Category")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Category name")).toBeInTheDocument();
    });

    it("should call onClose when the backdrop is clicked", () => {
      const onClose = jest.fn();
      const { container } = render(
        <CategoryManagerModal {...createDefaultProps({ onClose })} />
      );

      // Click the outer backdrop div (first child)
      fireEvent.click(container.firstChild as HTMLElement);

      expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose when the close button is clicked", () => {
      const onClose = jest.fn();
      render(<CategoryManagerModal {...createDefaultProps({ onClose })} />);

      fireEvent.click(screen.getByText("✕"));

      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onClose when the modal card itself is clicked", () => {
      const onClose = jest.fn();
      render(<CategoryManagerModal {...createDefaultProps({ onClose })} />);

      // Click inside the modal card — stopPropagation should prevent onClose
      fireEvent.click(screen.getByText("Categories"));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── CategoryRow ──

  describe("CategoryRow", () => {
    it("should display the category name in read mode", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      expect(screen.getByText("Lecture")).toBeInTheDocument();
    });

    it("should switch to edit mode when Edit is clicked", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Edit"));

      // Input should now be visible with the current name
      expect(screen.getByDisplayValue("Lecture")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should not save when name is empty", () => {
      const onCategoriesChange = jest.fn();
      render(
        <CategoryManagerModal
          {...createDefaultProps({ onCategoriesChange })}
        />
      );
      fireEvent.click(screen.getByText("Edit"));

      // Clear the name
      fireEvent.change(screen.getByDisplayValue("Lecture"), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByText("Save"));

      expect(global.fetch).not.toHaveBeenCalled();
      expect(onCategoriesChange).not.toHaveBeenCalled();
    });

    it("should show an error and not save when colour is black (#000000)", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Edit"));

      // Set color to black — target the first color input
      const colorInputs = screen.getAllByDisplayValue(/^#/);
      fireEvent.change(colorInputs[0], { target: { value: "#000000" } });
      fireEvent.click(screen.getByText("Save"));

      expect(screen.getByText("Black is not allowed.")).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show a duplicate colour error when another category uses the same colour", () => {
      const categories = [
        createCategory({ id: "cat-1", name: "Lecture", color: "#6366f1" }),
        createCategory({ id: "cat-2", name: "Lab", color: "#ff0000" }),
      ];
      render(
        <CategoryManagerModal {...createDefaultProps({ categories })} />
      );

      // Edit the first category
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      // Set colour to match the second category
      const colorInputs = screen.getAllByDisplayValue(/^#/);
      fireEvent.change(colorInputs[0], { target: { value: "#ff0000" } });
      fireEvent.click(screen.getByText("Save"));

      expect(screen.getByText("This colour is already used.")).toBeInTheDocument();
    });

    it("should call PATCH and onCategoriesChange on a valid save", async () => {
      const onCategoriesChange = jest.fn();
      render(
        <CategoryManagerModal
          {...createDefaultProps({ onCategoriesChange })}
        />
      );
      fireEvent.click(screen.getByText("Edit"));

      fireEvent.change(screen.getByDisplayValue("Lecture"), {
        target: { value: "Updated Lecture" },
      });
      fireEvent.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/categories",
          expect.objectContaining({ method: "PATCH" })
        );
        expect(onCategoriesChange).toHaveBeenCalled();
      });
    });

    it("should exit edit mode after a successful save", async () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

    it("should clear the error when the colour input changes", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Edit"));

      // Trigger the black colour error
      const colorInputs = screen.getAllByDisplayValue(/^#/);
      fireEvent.change(colorInputs[0], { target: { value: "#000000" } });
      fireEvent.click(screen.getByText("Save"));
      expect(screen.getByText("Black is not allowed.")).toBeInTheDocument();

      // Change colour — error should clear
      fireEvent.change(colorInputs[0], { target: { value: "#aabbcc" } });
      expect(screen.queryByText("Black is not allowed.")).not.toBeInTheDocument();
    });

    it("should not show Delete button when only one category exists", () => {
      render(
        <CategoryManagerModal
          {...createDefaultProps({ categories: [createCategory()] })}
        />
      );

      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("should show Delete button when more than one category exists", () => {
      const categories = [
        createCategory({ id: "cat-1", name: "Lecture" }),
        createCategory({ id: "cat-2", name: "Lab", color: "#ff0000" }),
      ];
      render(<CategoryManagerModal {...createDefaultProps({ categories })} />);

      expect(screen.getAllByText("Delete")).toHaveLength(2);
    });

    it("should call DELETE and onCategoriesChange when Delete is clicked", async () => {
      const onCategoriesChange = jest.fn();
      const categories = [
        createCategory({ id: "cat-1", name: "Lecture" }),
        createCategory({ id: "cat-2", name: "Lab", color: "#ff0000" }),
      ];
      render(
        <CategoryManagerModal
          {...createDefaultProps({ categories, onCategoriesChange })}
        />
      );

      fireEvent.click(screen.getAllByText("Delete")[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/categories?id=cat-1",
          expect.objectContaining({ method: "DELETE" })
        );
        expect(onCategoriesChange).toHaveBeenCalled();
      });
    });
  });

  // ── AddCategoryForm ──────

  describe("AddCategoryForm", () => {
    it("should not call fetch when the name is empty", async () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);

      fireEvent.click(screen.getByText("Add"));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show an error when colour is black (#000000)", () => {
      render(<CategoryManagerModal {...createDefaultProps()} />);

      const addFormColorInput = screen.getAllByRole("textbox")[0]
        .closest(".flex-col")
        ?.querySelector('input[type="color"]') as HTMLInputElement;

      // Find and change the add form's color input
      const colorInputs = document.querySelectorAll('input[type="color"]');
      // Last color input belongs to the add form
      fireEvent.change(colorInputs[colorInputs.length - 1], {
        target: { value: "#000000" },
      });
      fireEvent.change(screen.getByPlaceholderText("Category name"), {
        target: { value: "New Cat" },
      });
      fireEvent.click(screen.getByText("Add"));

      expect(screen.getByText("Black is not allowed.")).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show a duplicate colour error when another category uses the same colour", () => {
      const categories = [createCategory({ color: "#6366f1" })];
      render(<CategoryManagerModal {...createDefaultProps({ categories })} />);

      fireEvent.change(screen.getByPlaceholderText("Category name"), {
        target: { value: "New Cat" },
      });
      fireEvent.click(screen.getByText("Add"));

      expect(screen.getByText("This colour is already used.")).toBeInTheDocument();
    });

    it("should call POST and onCategoriesChange on a valid add", async () => {
      const onCategoriesChange = jest.fn();
      render(
        <CategoryManagerModal
          {...createDefaultProps({
            categories: [createCategory({ color: "#aaaaaa" })],
            onCategoriesChange,
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText("Category name"), {
        target: { value: "New Category" },
      });
      fireEvent.click(screen.getByText("Add"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/categories",
          expect.objectContaining({ method: "POST" })
        );
        expect(onCategoriesChange).toHaveBeenCalled();
      });
    });

    it("should reset the name field after a successful add", async () => {
      render(
        <CategoryManagerModal
          {...createDefaultProps({
            categories: [createCategory({ color: "#aaaaaa" })],
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText("Category name"), {
        target: { value: "New Category" },
      });
      fireEvent.click(screen.getByText("Add"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Category name")).toHaveValue("");
      });
    });

    it("should clear the error when the colour input changes in the add form", () => {
      const categories = [createCategory({ color: "#6366f1" })];
      render(<CategoryManagerModal {...createDefaultProps({ categories })} />);

      // Trigger duplicate colour error
      fireEvent.change(screen.getByPlaceholderText("Category name"), {
        target: { value: "Test" },
      });
      fireEvent.click(screen.getByText("Add"));
      expect(screen.getByText("This colour is already used.")).toBeInTheDocument();

      // Change the colour — error should clear
      const colorInputs = document.querySelectorAll('input[type="color"]');
      fireEvent.change(colorInputs[colorInputs.length - 1], {
        target: { value: "#123456" },
      });
      expect(
        screen.queryByText("This colour is already used.")
      ).not.toBeInTheDocument();
    });
  });
});
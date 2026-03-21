/**
 * Tests for src/components/calendar/SaveLocationModal.tsx
 *
 * Covers:
 * - Renders address, label input defaulting to first part of address
 * - Renders all three type buttons (HOME, WORK, FAVOURITE)
 * - Type selection changes the active button
 * - Label input reflects changes
 * - Save button disabled when label is empty
 * - Save button disabled while saving
 * - handleSave: calls onSave with trimmed label and selected type, then onClose
 * - handleSave: does not call onSave when label is empty/whitespace
 * - handleSave: shows "Saving…" while in flight
 * - ✕ button calls onClose
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SaveLocationModal from "../SaveLocationModal";

// ── Factory helpers ───────────────────────────────────────────────────────────

function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    address: "King's Cross Station, London, UK",
    lat: 51.5308,
    lng: -0.1238,
    onSave: jest.fn().mockResolvedValue(undefined),
    onClose: jest.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SaveLocationModal", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("should render the Save Location heading", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(screen.getByText("Save Location")).toBeInTheDocument();
    });

    it("should render the full address", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(
        screen.getByText("King's Cross Station, London, UK")
      ).toBeInTheDocument();
    });

    it("should initialise label to empty string when address starts with a comma", () => {
      render(<SaveLocationModal {...createDefaultProps({ address: ",something" })} />);
      expect(screen.getByPlaceholderText("Label (e.g. Home, Gym...)")).toHaveValue("");
    });

    it("should use the full address as label when address has no comma", () => {
      render(
        <SaveLocationModal {...createDefaultProps({ address: "Waterloo" })} />
      );
      expect(screen.getByDisplayValue("Waterloo")).toBeInTheDocument();
    });

    it("should render HOME, WORK, and FAVOURITE type buttons", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(screen.getByText(/Home/)).toBeInTheDocument();
      expect(screen.getByText(/Work/)).toBeInTheDocument();
      expect(screen.getByText(/Favourite/)).toBeInTheDocument();
    });

    it("should render the Save button", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("should render the ✕ close button", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(screen.getByText("✕")).toBeInTheDocument();
    });
  });

  // ── Label input ─────────────────────────────────────────────────────────────

  describe("label input", () => {
    it("should update the label when the input changes", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "My Station" } });
      expect(input).toHaveValue("My Station");
    });

    it("should disable the Save button when the label is empty", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "" } });
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("should disable the Save button when the label is only whitespace", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "   " } });
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("should enable the Save button when the label is non-empty", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
    });
  });

  // ── Type selection ──────────────────────────────────────────────────────────

  describe("type selection", () => {
    it("should default to FAVOURITE type", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      // FAVOURITE button should have the active indigo class
      const favButton = screen.getByText(/Favourite/).closest("button")!;
      expect(favButton.className).toContain("bg-indigo-600");
    });

    it("should activate HOME when the Home button is clicked", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText(/Home/).closest("button")!);
      const homeButton = screen.getByText(/Home/).closest("button")!;
      expect(homeButton.className).toContain("bg-indigo-600");
    });

    it("should activate WORK when the Work button is clicked", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText(/Work/).closest("button")!);
      const workButton = screen.getByText(/Work/).closest("button")!;
      expect(workButton.className).toContain("bg-indigo-600");
    });

    it("should deactivate the previously selected type when a new one is clicked", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText(/Home/).closest("button")!);
      const favButton = screen.getByText(/Favourite/).closest("button")!;
      expect(favButton.className).not.toContain("bg-indigo-600");
    });
  });

  // ── Save behaviour ──────────────────────────────────────────────────────────

  describe("save behaviour", () => {
    it("should call onSave with the trimmed label and selected type", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);

      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "  My Home  " } });
      fireEvent.click(screen.getByText(/Home/).closest("button")!);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });

      expect(onSave).toHaveBeenCalledWith("My Home", "HOME");
    });

    it("should call onClose after saving", async () => {
      const onClose = jest.fn();
      render(<SaveLocationModal {...createDefaultProps({ onClose })} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });

      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onSave when the label is empty", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);

      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "" } });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it("should show 'Saving…' while onSave is in flight", async () => {
      let resolveSave!: () => void;
      const onSave = jest.fn().mockReturnValue(
        new Promise<void>((res) => { resolveSave = res; })
      );
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByText("Saving…")).toBeInTheDocument();
      });

      await act(async () => { resolveSave(); });
    });

    it("should disable the Save button while saving", async () => {
      let resolveSave!: () => void;
      const onSave = jest.fn().mockReturnValue(
        new Promise<void>((res) => { resolveSave = res; })
      );
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
      });

      await act(async () => { resolveSave(); });
    });

    it("should use WORK type when Work is selected before saving", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);

      fireEvent.click(screen.getByText(/Work/).closest("button")!);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });

      expect(onSave).toHaveBeenCalledWith(expect.any(String), "WORK");
    });
  });

  // ── Close button ────────────────────────────────────────────────────────────

  describe("close button", () => {
    it("should call onClose when ✕ is clicked", () => {
      const onClose = jest.fn();
      render(<SaveLocationModal {...createDefaultProps({ onClose })} />);
      fireEvent.click(screen.getByText("✕"));
      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onSave when ✕ is clicked", () => {
      const onSave = jest.fn();
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);
      fireEvent.click(screen.getByText("✕"));
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("branch coverage", () => {
    it("should apply inactive class to HOME and WORK when FAVOURITE is selected", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      const homeButton = screen.getByText(/Home/).closest("button")!;
      const workButton = screen.getByText(/Work/).closest("button")!;
      expect(homeButton.className).toContain("bg-white/5");
      expect(workButton.className).toContain("bg-white/5");
    });
  
    it("should apply inactive class to FAVOURITE and WORK when HOME is selected", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText(/Home/).closest("button")!);
      const favButton = screen.getByText(/Favourite/).closest("button")!;
      const workButton = screen.getByText(/Work/).closest("button")!;
      expect(favButton.className).toContain("bg-white/5");
      expect(workButton.className).toContain("bg-white/5");
    });
  
    it("should apply inactive class to FAVOURITE and HOME when WORK is selected", () => {
      render(<SaveLocationModal {...createDefaultProps()} />);
      fireEvent.click(screen.getByText(/Work/).closest("button")!);
      const favButton = screen.getByText(/Favourite/).closest("button")!;
      const homeButton = screen.getByText(/Home/).closest("button")!;
      expect(favButton.className).toContain("bg-white/5");
      expect(homeButton.className).toContain("bg-white/5");
    });
  
    it("should use FAVOURITE type when saving without changing type", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });
      expect(onSave).toHaveBeenCalledWith(expect.any(String), "FAVOURITE");
    });
  
    it("should not call onSave when label is only whitespace", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<SaveLocationModal {...createDefaultProps({ onSave })} />);
      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "   " } });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it("should return early without calling onSave when label is whitespace on handleSave", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { container } = render(
        <SaveLocationModal {...createDefaultProps({ onSave })} />
      );
      const input = screen.getByPlaceholderText("Label (e.g. Home, Gym...)");
      fireEvent.change(input, { target: { value: "   " } });
      
      const saveBtn = screen.getByRole("button", { name: "Save" });
      saveBtn.removeAttribute("disabled");
      fireEvent.click(saveBtn);
      
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should reset saving state and not close when onSave rejects", async () => {
      const onSave = jest.fn().mockRejectedValue(new Error("fail"));
      const onClose = jest.fn();
      render(<SaveLocationModal {...createDefaultProps({ onSave, onClose })} />);
  
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });
  
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
      expect(onClose).not.toHaveBeenCalled();
    });
  
    it("should call onClose after onSave resolves successfully", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      render(<SaveLocationModal {...createDefaultProps({ onSave, onClose })} />);
  
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
      });
  
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
import { render, screen, waitFor } from "@testing-library/react";
import QuoteBlock from "../quote_block";

// Mock CSS module
jest.mock("../quote_block.module.css", () => ({
  text: "text",
  corner: "corner",
}));

describe("QuoteBlock component", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders quote when API returns a quote", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ quote: "Test quote" }),
    });

    render(<QuoteBlock />);

    await waitFor(() => {
      expect(screen.getByText(/Test quote/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("/api/wellbeing/center");
  });

  test("renders default message when API returns no quote", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({}),
    });

    render(<QuoteBlock />);

    await waitFor(() => {
      expect(screen.getByText("You can do this!")).toBeInTheDocument();
    });
  });

  test("renders default message when fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    render(<QuoteBlock />);

    await waitFor(() => {
      expect(screen.getByText("You can do this!")).toBeInTheDocument();
    });
  });
});

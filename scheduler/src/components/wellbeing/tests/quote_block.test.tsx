import { render, screen, waitFor } from "@testing-library/react";
import QuoteBlock from "../quote_block";

// Mock GlassCard to avoid styling noise
jest.mock("@/components/ui/glassCard", () => {
  return ({ children }: any) => <div>{children}</div>;
});

describe("QuoteBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading initially", () => {
    global.fetch = jest.fn(() =>
      new Promise(() => {}) // never resolves
    ) as jest.Mock;

    render(<QuoteBlock />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders fetched quote successfully", async () => {
    const mockQuote = "Stay strong.";

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ quote: mockQuote }),
      })
    ) as jest.Mock;

    render(<QuoteBlock />);

    await waitFor(() =>
      expect(screen.getByText(`“${mockQuote}”`)).toBeInTheDocument()
    );
  });

  it("falls back to default quote if API fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as jest.Mock;

    render(<QuoteBlock />);

    await waitFor(() =>
      expect(screen.getByText("You can do this!")).toBeInTheDocument()
    );
  });

  it("falls back if API returns no quote", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;

    render(<QuoteBlock />);

    await waitFor(() =>
      expect(screen.getByText("You can do this!")).toBeInTheDocument()
    );
  });

  it("handles fetch throwing error", async () => {
    global.fetch = jest.fn(() => Promise.reject("error")) as jest.Mock;

    render(<QuoteBlock />);

    await waitFor(() =>
      expect(screen.getByText("You can do this!")).toBeInTheDocument()
    );
  });

  it("does not update state after unmount", async () => {
    let resolveFetch: any;

    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    ) as jest.Mock;

    const { unmount } = render(<QuoteBlock />);

    unmount();

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ quote: "Late quote" }),
    });

  });
});
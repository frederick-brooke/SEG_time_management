/**
 *
 * Full coverage for BannedPage, BanInfo, and AppealForm.
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { useSession, signOut } from "next-auth/react";
import BannedPage from "../ban-message-page";

//  Module mocks 

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut:    jest.fn(),
}));

jest.mock("@/components/ui/lunar-card", () => ({
  LunarCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lunar-card">{children}</div>
  ),
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-wrapper">{children}</div>
  ),
}));

jest.mock("lucide-react", () => ({
  AlertTriangle: () => <svg data-testid="icon-alert-triangle" />,
  ShieldOff:     () => <svg data-testid="icon-shield-off" />,
  X:             () => <svg data-testid="icon-x" />,
}));

//  Typed mock aliases 

const mockUseSession = useSession as jest.Mock;
const mockSignOut    = signOut    as jest.Mock;

global.alert = jest.fn();

//  Fixtures 

const permanentBan = {
  reason:   "Violated terms of service",
  expires:  null,
  reportId: "report-42",
};

const temporaryBan = {
  reason:   "Spam",
  expires:  "2099-12-31T23:59:59.000Z",
  reportId: "report-99",
};

//  Setup helpers 

function setupSession({ updatedIsBanned = true } = {}) {
  const update = jest.fn().mockResolvedValue({
    user: { isBanned: updatedIsBanned },
  });
  mockUseSession.mockReturnValue({
    data:   { user: { isBanned: true } },
    update,
  });
  return update;
}

function setupFetch({
  banStatus    = 200,
  banBody      = permanentBan as object,
  banErrorText = "Server error",
  appealOk     = true,
  hangAppeal   = false,
}: {
  banStatus?:    number;
  banBody?:      object;
  banErrorText?: string;
  appealOk?:     boolean;
  hangAppeal?:   boolean;
} = {}) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/ban-info") {
      if (banStatus === 200) {
        return Promise.resolve({
          ok:   true,
          status: 200,
          json: async () => banBody,
        });
      }
      return Promise.resolve({
        ok:     false,
        status: banStatus,
        text:   async () => (banStatus === 401 ? "" : banErrorText),
      });
    }
    if (url === "/api/appeal") {
      if (hangAppeal) return new Promise(() => {}); // never resolves
      return Promise.resolve({ ok: appealOk });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
}

async function renderLoaded({
  banStatus       = 200,
  banBody         = permanentBan as object,
  banErrorText    = "Server error",
  appealOk        = true,
  updatedIsBanned = true,
}: {
  banStatus?:       number;
  banBody?:         object;
  banErrorText?:    string;
  appealOk?:        boolean;
  updatedIsBanned?: boolean;
} = {}) {
  setupFetch({ banStatus, banBody, banErrorText, appealOk });
  const update = setupSession({ updatedIsBanned });

  await act(async () => { render(<BannedPage />); });
  await waitFor(() =>
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  );

  return { update };
}

async function renderAppealForm(opts?: Parameters<typeof renderLoaded>[0]) {
  const ctx = await renderLoaded(opts);
  fireEvent.click(screen.getByRole("button", { name: /submit appeal/i }));
  await waitFor(() =>
    expect(
      screen.getByText("Explain why you believe this ban was issued incorrectly.")
    ).toBeInTheDocument()
  );
  return ctx;
}

//  Reset URL between every test
// history.pushState is the only safe way to reset location in JSDOM without
// redefining the property.
afterEach(() => {
  window.history.pushState({}, "", "/");
  jest.clearAllMocks();
});


describe("BannedPage – loading state", () => {
  it("shows a loading indicator before fetch resolves", async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    setupSession();

    await act(async () => { render(<BannedPage />); });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("wraps the loading view in LunarThemeWrapper", async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    setupSession();

    await act(async () => { render(<BannedPage />); });

    expect(screen.getByTestId("theme-wrapper")).toBeInTheDocument();
  });
});

describe("BannedPage – data fetching", () => {
  it("fetches /api/ban-info with credentials on mount", async () => {
    await renderLoaded();
    expect(global.fetch).toHaveBeenCalledWith("/api/ban-info", {
      credentials: "include",
    });
  });

  it("renders BanInfo after a successful 200 response", async () => {
    await renderLoaded();
    expect(screen.getByText("Account Banned")).toBeInTheDocument();
  });

  it("sets reason to 'You must be logged in' on a 401 response", async () => {
    await renderLoaded({ banStatus: 401 });
    expect(screen.getByText("You must be logged in")).toBeInTheDocument();
  });

  it("logs the error when fetch throws a network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    setupSession();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => { render(<BannedPage />); });
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.any(Error)));

    spy.mockRestore();
  });

  it("logs the error when the server returns a non-ok non-401 response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok:     false,
      status: 500,
      text:   async () => "Internal Server Error",
    });
    setupSession();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => { render(<BannedPage />); });
    await waitFor(() => expect(spy).toHaveBeenCalled());

    spy.mockRestore();
  });
});


describe("BannedPage – session update & redirect", () => {
  it("calls session.update() on mount", async () => {
    const { update } = await renderLoaded();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("does NOT redirect when updated session still shows isBanned = true", async () => {
    await renderLoaded({ updatedIsBanned: true });
    expect(window.location.pathname).not.toBe("/dashboard");
  });
});

describe("BannedPage – view toggling", () => {
  it("shows BanInfo by default after loading", async () => {
    await renderLoaded();
    expect(screen.getByText("Account Banned")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Provide details about your appeal…")
    ).toBeNull();
  });

  it("switches to AppealForm when 'Submit Appeal' is clicked", async () => {
    await renderAppealForm();
    expect(
      screen.getByPlaceholderText("Provide details about your appeal…")
    ).toBeInTheDocument();
  });

  it("returns to BanInfo when AppealForm Cancel is clicked", async () => {
    await renderAppealForm();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.getByText("Account Banned")).toBeInTheDocument()
    );
  });

  it("returns to BanInfo when AppealForm X button is clicked", async () => {
    await renderAppealForm();
    fireEvent.click(screen.getByTestId("icon-x").closest("button")!);
    await waitFor(() =>
      expect(screen.getByText("Account Banned")).toBeInTheDocument()
    );
  });
});

// ─── BanInfo ───────

describe("BanInfo", () => {
  it("displays the ban reason", async () => {
    await renderLoaded({ banBody: permanentBan });
    expect(screen.getByText("Violated terms of service")).toBeInTheDocument();
  });

  it("shows 'Permanent' when expires is null", async () => {
    await renderLoaded({ banBody: permanentBan });
    expect(screen.getByText("Permanent")).toBeInTheDocument();
  });

  it("shows a formatted expiry date when expires is set", async () => {
    await renderLoaded({ banBody: temporaryBan });
    const expected = new Date(temporaryBan.expires).toLocaleString();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("does NOT show 'Permanent' for a temporary ban", async () => {
    await renderLoaded({ banBody: temporaryBan });
    expect(screen.queryByText("Permanent")).not.toBeInTheDocument();
  });

  it("renders the ShieldOff icon", async () => {
    await renderLoaded();
    expect(screen.getByTestId("icon-shield-off")).toBeInTheDocument();
  });

  it("renders the AlertTriangle icon", async () => {
    await renderLoaded();
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });

  it("renders the 'Your access has been restricted' subtitle", async () => {
    await renderLoaded();
    expect(
      screen.getByText("Your access has been restricted")
    ).toBeInTheDocument();
  });

  it("calls signOut with callbackUrl '/login' when Sign Out is clicked", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("opens AppealForm when 'Submit Appeal' is clicked", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: /submit appeal/i }));
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Provide details about your appeal…")
      ).toBeInTheDocument()
    );
  });
});

// ─── AppealForm ────

describe("AppealForm", () => {
  it("renders the 'Submit Appeal' heading", async () => {
    await renderAppealForm();
    expect(
      screen.getByRole("heading", { name: /submit appeal/i })
    ).toBeInTheDocument();
  });

  it("renders the textarea with the correct placeholder", async () => {
    await renderAppealForm();
    expect(
      screen.getByPlaceholderText("Provide details about your appeal…")
    ).toBeInTheDocument();
  });

  it("updates the textarea value when the user types", async () => {
    await renderAppealForm();
    const ta = screen.getByPlaceholderText(
      "Provide details about your appeal…"
    ) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "I was wrongly banned" } });
    expect(ta.value).toBe("I was wrongly banned");
  });

  it("submit button is disabled when description is empty", async () => {
    await renderAppealForm();
    expect(
      screen.getByRole("button", { name: /^submit appeal$/i })
    ).toBeDisabled();
  });

  it("submit button is enabled once the user enters text", async () => {
    await renderAppealForm();
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about your appeal…"),
      { target: { value: "Some text" } }
    );
    expect(
      screen.getByRole("button", { name: /^submit appeal$/i })
    ).not.toBeDisabled();
  });

  it("POSTs to /api/appeal with the correct body and credentials", async () => {
    await renderAppealForm({ banBody: permanentBan });
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about your appeal…"),
      { target: { value: "Please reconsider" } }
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^submit appeal$/i }));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/appeal",
      expect.objectContaining({
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Please reconsider",
          reportId:    permanentBan.reportId,
        }),
      })
    );
  });

  it("shows a success alert and returns to BanInfo on successful submission", async () => {
    await renderAppealForm();
    fireEvent.change(
      screen.getByPlaceholderText("Provide details about your appeal…"),
      { target: { value: "My appeal" } }
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^submit appeal$/i }));
    });

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith(
        "Appeal submitted. Please wait while an admin reviews it."
      )
    );
    await waitFor(() =>
      expect(screen.getByText("Account Banned")).toBeInTheDocument()
    );
  });

  it("shows a failure alert when /api/appeal returns not-ok", async () => {
    await renderAppealForm({ appealOk: false });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    fireEvent.change(
      screen.getByPlaceholderText("Provide details about your appeal…"),
      { target: { value: "My appeal" } }
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^submit appeal$/i }));
    });

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith("Failed to submit appeal")
    );
    spy.mockRestore();
  });

  it("shows 'Submitting…' and disables the button while the request is in-flight", async () => {
    setupFetch({ hangAppeal: true });
    setupSession();

    await act(async () => { render(<BannedPage />); });
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /submit appeal/i }));
    await waitFor(() =>
      screen.getByPlaceholderText("Provide details about your appeal…")
    );

    fireEvent.change(
      screen.getByPlaceholderText("Provide details about your appeal…"),
      { target: { value: "In-flight test" } }
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /^submit appeal$/i }));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /submitting/i })
      ).toBeDisabled()
    );
  });

  it("Cancel closes the form", async () => {
    await renderAppealForm();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.getByText("Account Banned")).toBeInTheDocument()
    );
  });

  it("X button closes the form", async () => {
    await renderAppealForm();
    fireEvent.click(screen.getByTestId("icon-x").closest("button")!);
    await waitFor(() =>
      expect(screen.getByText("Account Banned")).toBeInTheDocument()
    );
  });

  it("renders the X icon inside the close button", async () => {
    await renderAppealForm();
    expect(screen.getByTestId("icon-x")).toBeInTheDocument();
  });
});
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BannedPage from "@/components/admin/BanMessagePage";
import * as nextAuth from "next-auth/react";
import { useRouter } from "next/navigation";

jest.mock("next-auth/react");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/components/admin/BanInfo", () => (props: any) => (
  <div>
    <span>BanInfoComponent</span>
    <button onClick={props.onAppeal}>appeal</button>
  </div>
));
jest.mock("@/components/admin/AppealForm", () => (props: any) => (
  <div>
    <span>AppealFormComponent</span>
    <button onClick={props.onClose}>close</button>
  </div>
));
jest.mock("@/components/ui/LunarCard", () => ({
  LunarCard: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@/components/layout/LunarThemeWrapper", () => (props: any) => (
  <div>{props.children}</div>
));
jest.mock("@/components/ui/Button", () => ({
  Button: (props: any) => <button {...props} />,
}));

describe("BannedPage", () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    global.fetch = jest.fn();
  });

  it("renders loading state", () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn(() => new Promise(() => {})),
    });

    render(<BannedPage />);
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it("renders ban info after fetch", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ user: { isBanned: true } }),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ reason: "test", expires: null }),
    });

    render(<BannedPage />);

    await waitFor(() =>
      expect(screen.getByText("BanInfoComponent")).toBeInTheDocument()
    );
  });

  it("toggles to appeal form", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ user: { isBanned: true } }),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ reason: "test", expires: null }),
    });

    render(<BannedPage />);

    await waitFor(() =>
      expect(screen.getByText("BanInfoComponent")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("appeal"));

    expect(
      await screen.findByText("AppealFormComponent")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("close"));

    expect(
      await screen.findByText("BanInfoComponent")
    ).toBeInTheDocument();
  });

  it("redirects if user is not banned", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ user: { isBanned: false } }),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ reason: "test", expires: null }),
    });

    render(<BannedPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles 401 fetch", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ user: { isBanned: true } }),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<BannedPage />);

    await waitFor(() =>
      expect(screen.getByText("BanInfoComponent")).toBeInTheDocument()
    );
  });

  it("handles fetch failure", async () => {
    (nextAuth.useSession as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({ user: { isBanned: true } }),
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error("fail"));

    render(<BannedPage />);

    await waitFor(() =>
      expect(screen.getByText("BanInfoComponent")).toBeInTheDocument()
    );
  });
});

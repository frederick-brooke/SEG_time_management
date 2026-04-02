import { render, screen, fireEvent } from "@testing-library/react";
import BanInfo from "@/components/admin/BanInfo";
import { signOut } from "next-auth/react";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

jest.mock("@/components/ui/Button", () => ({
  Button: (props: any) => <button {...props} />,
}));

jest.mock("lucide-react", () => ({
  AlertTriangle: () => <div>AlertTriangleIcon</div>,
  ShieldOff: () => <div>ShieldOffIcon</div>,
  X: () => <div>XIcon</div>,
}));

describe("BanInfo", () => {
  const onAppeal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders permanent ban correctly", () => {
    render(
      <BanInfo
        banInfo={{ reason: "Violation", expires: null }}
        onAppeal={onAppeal}
      />
    );

    expect(screen.getByText("Account Banned")).toBeInTheDocument();
    expect(screen.getByText("Violation")).toBeInTheDocument();
    expect(screen.getByText("Permanent")).toBeInTheDocument();
    expect(screen.getByText("Submit Appeal")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("renders temporary ban with formatted date", () => {
    const date = new Date("2030-01-01T00:00:00Z");

    render(
      <BanInfo
        banInfo={{ reason: "Spam", expires: date.toISOString() }}
        onAppeal={onAppeal}
      />
    );

    expect(screen.getByText("Spam")).toBeInTheDocument();
    expect(
      screen.getByText(new Date(date).toLocaleString())
    ).toBeInTheDocument();
  });

  it("calls onAppeal when appeal button is clicked", () => {
    render(
      <BanInfo
        banInfo={{ reason: "Test", expires: null }}
        onAppeal={onAppeal}
      />
    );

    fireEvent.click(screen.getByText("Submit Appeal"));
    expect(onAppeal).toHaveBeenCalled();
  });

  it("calls signOut when sign out button is clicked", () => {
    render(
      <BanInfo
        banInfo={{ reason: "Test", expires: null }}
        onAppeal={onAppeal}
      />
    );

    fireEvent.click(screen.getByText("Sign Out"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});


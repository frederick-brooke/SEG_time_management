import { render, screen, fireEvent } from "@testing-library/react";
import UserCard from "../UserCards";

// ---- mocks ----
jest.mock("@/components/ui/glassCard", () => (props: any) => (
  <div data-testid="glass-card" onClick={props.onClick}>
    {props.children}
  </div>
));

jest.mock("@/lib/avatar", () => ({
  resolveAvatarSrc: jest.fn(),
}));

import { resolveAvatarSrc } from "@/lib/avatar";

describe("UserCard", () => {
  const baseUser = {
    username: "johndoe",
    fname: "John",
    lname: "Doe",
    pfp: "avatar.png",
  };

  test("renders avatar image when resolveAvatarSrc returns src", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue("avatar-url");

    render(<UserCard user={baseUser} onClick={jest.fn()} />);

    const img = screen.getByAltText("Profile");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "avatar-url");
  });

  test("renders initials fallback when no avatar", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);

    render(<UserCard user={baseUser} onClick={jest.fn()} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  test("renders username and full name", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);

    render(<UserCard user={baseUser} onClick={jest.fn()} />);

    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("calls onClick when card is clicked", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    const handleClick = jest.fn();

    render(<UserCard user={baseUser} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId("glass-card"));

    expect(handleClick).toHaveBeenCalled();
  });
});
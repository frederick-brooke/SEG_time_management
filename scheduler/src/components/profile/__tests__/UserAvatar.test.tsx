//tests for scheduler/src/components/profile/UserAvatar.tsx
import { render, screen } from "@testing-library/react";
import UserAvatar from "../UserAvatar";
import { resolveAvatarSrc } from "@/lib/avatar";

jest.mock("@/lib/avatar", () => ({
  resolveAvatarSrc: jest.fn(),
}));

describe("UserAvatar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders image when pfp is provided", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue("/path/to/image.jpg");
    render(<UserAvatar pfp="image.jpg" username="testuser" />);
    
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/path/to/image.jpg");
    expect(img).toHaveAttribute("alt", "testuser");
  });

  it("renders initials from fname and lname", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    render(<UserAvatar username="testuser" fname="John" lname="Doe" />);
    
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders initials from fname only", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    render(<UserAvatar username="testuser" fname="John" />);
    
    expect(screen.getByText("JO")).toBeInTheDocument();
  });

  it("renders initials from username when names are missing", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    render(<UserAvatar username="testuser" />);
    
    expect(screen.getByText("TE")).toBeInTheDocument();
  });

  it("renders fallback User icon when no data is provided", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    const { container } = render(<UserAvatar username="" />);
    
    expect(container.querySelector(".lucide-user")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    (resolveAvatarSrc as jest.Mock).mockReturnValue(null);
    const { container } = render(<UserAvatar username="test" className="custom-class" />);
    
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
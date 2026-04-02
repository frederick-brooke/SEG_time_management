import { render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

// next/link mock
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Navbar", () => {
  test("renders brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("O Lunar")).toBeInTheDocument();
  });

  test("renders login link", () => {
    render(<Navbar />);
    const loginLink = screen.getByText("Log In");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  test("renders register link", () => {
    render(<Navbar />);
    const registerLink = screen.getByText("Get Started →");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });
});
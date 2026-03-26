import { render, screen } from "@testing-library/react";
import HeroSection, { StarField } from "../HeroSection";

// ---- mocks ----
jest.mock("next/link", () => ({ children, href }: any) => (
  <a href={href}>{children}</a>
));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => {
    return <img src={src} alt={alt} />;
  },
}));

// framer-motion mock (critical)
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: new Proxy(
      {},
      {
        get: () => (props: any) => <div {...props} />,
      }
    ),
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => 0,
    useSpring: () => ({ set: jest.fn() }),
  };
});

describe("HeroSection", () => {
  test("renders hero text content", () => {
    render(<HeroSection />);

    expect(screen.getByText("Time moves.")).toBeInTheDocument();
    expect(screen.getByText("So should you.")).toBeInTheDocument();
    expect(
      screen.getByText(/The scheduling tool that orbits around your life/i)
    ).toBeInTheDocument();
  });

  test("start for free button links to register", () => {
    render(<HeroSection />);

    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});

describe("StarField", () => {
  test("renders stars after mount", () => {
    render(<StarField />);

    // StarField returns many divs after mounted
    const stars = document.querySelectorAll(".absolute.rounded-full");
    expect(stars.length).toBeGreaterThan(0);
  });
});
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeaturesSection from "../FeaturesSection";

// ─── Mock framer-motion ────────────────────────────────────────────────────────
// Replaces animated wrappers with plain divs/spans so tests stay synchronous
// and don't depend on animation state.
jest.mock("framer-motion", () => {
  const actual = jest.requireActual<typeof import("framer-motion")>("framer-motion");

  // Framer-specific props that must be stripped before passing to React DOM elements
  const FRAMER_PROPS = new Set([
    "initial", "animate", "exit", "whileInView", "whileHover",
    "whileTap", "whileFocus", "whileDrag", "viewport", "transition", "variants",
    "drag", "dragConstraints", "dragElastic", "dragMomentum", "layout",
    "layoutId", "onAnimationStart", "onAnimationComplete",
  ]);

  const motionProxy = new Proxy(
    {},
    {
      get(_target, key) {
        // key is string | symbol — coerce to string for createElement
        const tag = String(key);
        const MotionComponent = (
          { children, ...rest }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
        ) => {
          const domProps = Object.fromEntries(
            Object.entries(rest).filter(([k]) => !FRAMER_PROPS.has(k))
          );
          return React.createElement(tag, domProps, children);
        };
        MotionComponent.displayName = `motion.${tag}`;
        return MotionComponent;
      },
    }
  );

  return { ...actual, motion: motionProxy };
});

// ─── Mock lucide-react ─────────────────────────────────────────────────────────
// Renders each icon as a labelled <svg> so we can assert their presence without
// depending on the actual SVG paths.
jest.mock("lucide-react", () => ({
  Calendar:   (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-calendar"   {...props} />,
  Clock:      (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-clock"      {...props} />,
  Users:      (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-users"      {...props} />,
  Zap:        (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-zap"        {...props} />,
  Shield:     (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-shield"     {...props} />,
  BarChart3:  (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-barchart3"  {...props} />,
}));

// ─── Expected feature data ─────────────────────────────────────────────────────

const FEATURES = [
  {
    testId: "icon-calendar",
    title: "Lunar Calendar",
    description: "An intuitive calendar that adapts to your rhythm. Drag, drop, and flow.",
  },
  {
    testId: "icon-zap",
    title: "Instant Sync",
    description: "Real-time sync across every device. Your schedule follows you like moonlight.",
  },
  {
    testId: "icon-users",
    title: "Team Orbits",
    description: "See everyone's availability in one shared orbit. Coordination, simplified.",
  },
  {
    testId: "icon-clock",
    title: "Smart Blocks",
    description: "AI-powered time blocking that learns your patterns and guards your focus.",
  },
  {
    testId: "icon-shield",
    title: "Privacy First",
    description: "End-to-end encryption. Your schedule is invisible to everyone but you.",
  },
  {
    testId: "icon-barchart3",
    title: "Time Analytics",
    description: "Beautiful insights into where your hours go. Understand. Optimize. Grow.",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function renderSection() {
  return render(<FeaturesSection />);
}

// ─── Section structure ─────────────────────────────────────────────────────────

describe("FeaturesSection – section structure", () => {
  it("renders the section element with id='features'", () => {
    const { container } = renderSection();
    const section = container.querySelector("section#features");
    expect(section).toBeInTheDocument();
  });

  it("renders the 'Features' eyebrow label", () => {
    renderSection();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("renders the primary headline copy", () => {
    renderSection();
    expect(screen.getByText(/Built for the way/i)).toBeInTheDocument();
  });

  it("renders the secondary headline copy", () => {
    renderSection();
    expect(screen.getByText(/you actually work/i)).toBeInTheDocument();
  });
});

// ─── Feature cards – presence ─────────────────────────────────────────────────

describe("FeaturesSection – feature cards presence", () => {
  it("renders exactly six feature cards", () => {
    const { container } = renderSection();
    // Each card contains an h3 — count those
    const headings = container.querySelectorAll("h3");
    expect(headings).toHaveLength(6);
  });

  it.each(FEATURES)("renders the '$title' title", ({ title }) => {
    renderSection();
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it.each(FEATURES)("renders the '$title' description", ({ description }) => {
    renderSection();
    expect(screen.getByText(description)).toBeInTheDocument();
  });
});

// ─── Feature cards – icons ────────────────────────────────────────────────────

describe("FeaturesSection – feature icons", () => {
  it.each(FEATURES)("renders the icon for '$title'", ({ testId }) => {
    renderSection();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it("renders exactly six icons in total", () => {
    renderSection();
    const icons = [
      "icon-calendar",
      "icon-zap",
      "icon-users",
      "icon-clock",
      "icon-shield",
      "icon-barchart3",
    ];
    icons.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });
});

// ─── Feature cards – styling ──────────────────────────────────────────────────

describe("FeaturesSection – card styling", () => {
  it("every card has the rounded-2xl class", () => {
    const { container } = renderSection();
    // Cards are the direct wrappers of the h3 elements
    const cards = Array.from(container.querySelectorAll("h3")).map(
      (h3) => h3.closest("[class*='rounded-2xl']") as HTMLElement
    );
    expect(cards).toHaveLength(6);
    cards.forEach((card) => {
      expect(card.className).toMatch(/rounded-2xl/);
    });
  });

  it("every card has the border class", () => {
    const { container } = renderSection();
    const cards = Array.from(container.querySelectorAll("h3")).map(
      (h3) => h3.closest("[class*='rounded-2xl']") as HTMLElement
    );
    cards.forEach((card) => {
      expect(card.className).toMatch(/border/);
    });
  });
});

// ─── Heading hierarchy ────────────────────────────────────────────────────────

describe("FeaturesSection – heading hierarchy", () => {
  it("renders one h2 for the section headline", () => {
    const { container } = renderSection();
    expect(container.querySelectorAll("h2")).toHaveLength(1);
  });

  it("renders six h3 elements (one per feature)", () => {
    const { container } = renderSection();
    expect(container.querySelectorAll("h3")).toHaveLength(6);
  });

  it("h2 contains the headline text", () => {
    const { container } = renderSection();
    const h2 = container.querySelector("h2") as HTMLElement;
    expect(h2.textContent).toMatch(/Built for the way/i);
  });
});

// ─── Ambient decorative elements ──────────────────────────────────────────────

describe("FeaturesSection – decorative elements", () => {
  it("renders the ambient gradient line div", () => {
    const { container } = renderSection();
    const gradientLine = container.querySelector(
      "[class*='bg-gradient-to-r']"
    );
    expect(gradientLine).toBeInTheDocument();
  });
});
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeaturesSection from "../FeaturesSection";

jest.mock("framer-motion", () => {
  const FRAMER_PROPS = new Set([
    "initial", "animate", "exit", "whileInView", "whileHover",
    "whileTap", "whileFocus", "whileDrag", "viewport", "transition",
    "variants", "drag", "dragConstraints", "dragElastic", "dragMomentum",
    "layout", "layoutId", "onAnimationStart", "onAnimationComplete",
  ]);

  const motionProxy = new Proxy({}, {
    get(_target, key) {
      const tag = String(key);
      const MotionComponent = ({ children, ...rest }: any) => {
        const domProps = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !FRAMER_PROPS.has(k))
        );
        return React.createElement(tag, domProps, children);
      };
      MotionComponent.displayName = `motion.${tag}`;
      return MotionComponent;
    },
  });

  return { motion: motionProxy };
});

// Must mock every icon the component actually imports
jest.mock("lucide-react", () => ({
  Calendar:  (props: any) => <svg data-testid="icon-calendar"  {...props} />,
  Clock:     (props: any) => <svg data-testid="icon-clock"     {...props} />,
  Users:     (props: any) => <svg data-testid="icon-users"     {...props} />,
  Map:       (props: any) => <svg data-testid="icon-map"       {...props} />,
  Settings2: (props: any) => <svg data-testid="icon-settings2" {...props} />,
  BarChart3: (props: any) => <svg data-testid="icon-barchart3" {...props} />,
}));

const FEATURES = [
  {
    testId: "icon-calendar",
    title: "Task Scheduling",
    description: "Auto-schedules tasks into your calendar around your work hours and rest days.",
  },
  {
    testId: "icon-clock",
    title: "Smart Time Blocking",
    description: "Focus sessions, breaks, and task limits shaped around how you work.",
  },
  {
    testId: "icon-users",
    title: "Friend Map",
    description: "See where your friends are in real time. Coordinate without the back-and-forth.",
  },
  {
    testId: "icon-map",
    title: "Module Planner",
    description: "Track deadlines across all your modules in one place.",
  },
  {
    testId: "icon-settings2",
    title: "Preferences",
    description: "Set your hours, rest days, and session lengths to make Lunar yours.",
  },
  {
    testId: "icon-barchart3",
    title: "Profiles",
    description: "View completed tasks, current workload, and how your week is shaping up.",
  },
];

function renderSection() {
  return render(<FeaturesSection />);
}

describe("FeaturesSection – section structure", () => {
  it("renders the section element with id='features'", () => {
    const { container } = renderSection();
    expect(container.querySelector("section#features")).toBeInTheDocument();
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

describe("FeaturesSection – feature cards presence", () => {
  it("renders exactly six feature cards", () => {
    const { container } = renderSection();
    expect(container.querySelectorAll("h3")).toHaveLength(6);
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

describe("FeaturesSection – feature icons", () => {
  it.each(FEATURES)("renders the icon for '$title'", ({ testId }) => {
    renderSection();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it("renders exactly six icons in total", () => {
    renderSection();
    ["icon-calendar", "icon-clock", "icon-users", "icon-map", "icon-settings2", "icon-barchart3"]
      .forEach((id) => expect(screen.getByTestId(id)).toBeInTheDocument());
  });
});

describe("FeaturesSection – card styling", () => {
  it("every card has the rounded-2xl class", () => {
    const { container } = renderSection();
    const cards = Array.from(container.querySelectorAll("h3")).map(
      (h3) => h3.closest("[class*='rounded-2xl']") as HTMLElement
    );
    expect(cards).toHaveLength(6);
    cards.forEach((card) => expect(card.className).toMatch(/rounded-2xl/));
  });

  it("every card has the border class", () => {
    const { container } = renderSection();
    const cards = Array.from(container.querySelectorAll("h3")).map(
      (h3) => h3.closest("[class*='rounded-2xl']") as HTMLElement
    );
    cards.forEach((card) => expect(card.className).toMatch(/border/));
  });
});

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
    expect((container.querySelector("h2") as HTMLElement).textContent).toMatch(/Built for the way/i);
  });
});

describe("FeaturesSection – decorative elements", () => {
  it("renders the ambient gradient line div", () => {
    const { container } = renderSection();
    expect(container.querySelector("[class*='bg-gradient-to-r']")).toBeInTheDocument();
  });
});
/**
 * Testing for Card component.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "../../ui/Card";

describe("components/ui/Card", () => {
  it("renders all card primitives and forwards className/props", () => {
    render(
      <Card data-testid="card-root" className="root-class">
        <CardHeader data-testid="card-header" className="header-class">
          <CardTitle data-testid="card-title" className="title-class">
            Title
          </CardTitle>
          <CardDescription data-testid="card-desc" className="desc-class">
            Desc
          </CardDescription>

          <CardAction data-testid="card-action" className="action-class">
            Action
          </CardAction>
        </CardHeader>

        <CardContent data-testid="card-content" className="content-class">
          Content
        </CardContent>

        <CardFooter data-testid="card-footer" className="footer-class">
          Footer
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("card-root")).toHaveAttribute("data-slot", "card");
    expect(screen.getByTestId("card-root")).toHaveClass("root-class");

    expect(screen.getByTestId("card-header")).toHaveAttribute(
      "data-slot",
      "card-header",
    );
    expect(screen.getByTestId("card-header")).toHaveClass("header-class");

    expect(screen.getByTestId("card-title")).toHaveAttribute(
      "data-slot",
      "card-title",
    );
    expect(screen.getByTestId("card-title")).toHaveClass("title-class");
    expect(screen.getByText("Title")).toBeInTheDocument();

    expect(screen.getByTestId("card-desc")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByTestId("card-desc")).toHaveClass("desc-class");
    expect(screen.getByText("Desc")).toBeInTheDocument();

    expect(screen.getByTestId("card-action")).toHaveAttribute(
      "data-slot",
      "card-action",
    );
    expect(screen.getByTestId("card-action")).toHaveClass("action-class");
    expect(screen.getByText("Action")).toBeInTheDocument();

    expect(screen.getByTestId("card-content")).toHaveAttribute(
      "data-slot",
      "card-content",
    );
    expect(screen.getByTestId("card-content")).toHaveClass("content-class");
    expect(screen.getByText("Content")).toBeInTheDocument();

    expect(screen.getByTestId("card-footer")).toHaveAttribute(
      "data-slot",
      "card-footer",
    );
    expect(screen.getByTestId("card-footer")).toHaveClass("footer-class");
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});

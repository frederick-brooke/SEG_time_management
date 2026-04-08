/**
 * Testing for Drawer components.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "../Drawer";

jest.mock("vaul", () => ({
  Drawer: {
    Root: ({ children, ...props }: any) => <div data-testid="root" {...props}>{children}</div>,
    Trigger: ({ children, ...props }: any) => <button data-testid="trigger" {...props}>{children}</button>,
    Portal: ({ children, ...props }: any) => <div data-testid="portal" {...props}>{children}</div>,
    Close: ({ children, ...props }: any) => <button data-testid="close" {...props}>{children}</button>,
    Overlay: ({ ...props }: any) => <div data-testid="overlay" {...props} />,
    Content: ({ children, ...props }: any) => <div data-testid="content" {...props}>{children}</div>,
    Title: ({ children, ...props }: any) => <div data-testid="title" {...props}>{children}</div>,
    Description: ({ children, ...props }: any) => <div data-testid="description" {...props}>{children}</div>,
  },
}));

describe("Drawer Components", () => {
  it("renders Drawer root", () => {
    render(<Drawer>Content</Drawer>);
    expect(screen.getByTestId("root")).toBeInTheDocument();
  });

  it("renders DrawerTrigger", () => {
    render(<DrawerTrigger>Open</DrawerTrigger>);
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("renders DrawerPortal", () => {
    render(<DrawerPortal>Portal</DrawerPortal>);
    expect(screen.getByTestId("portal")).toBeInTheDocument();
  });

  it("renders DrawerClose", () => {
    render(<DrawerClose>Close</DrawerClose>);
    expect(screen.getByTestId("close")).toBeInTheDocument();
  });

  it("renders DrawerOverlay with custom class", () => {
    render(<DrawerOverlay className="test-class" />);
    const overlay = screen.getByTestId("overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).toContain("test-class");
  });

  it("renders DrawerContent with children", () => {
    render(<DrawerContent>Drawer Body</DrawerContent>);
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Drawer Body")).toBeInTheDocument();
  });

  it("renders DrawerHeader", () => {
    render(<DrawerHeader>Header</DrawerHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("renders DrawerFooter", () => {
    render(<DrawerFooter>Footer</DrawerFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders DrawerTitle", () => {
    render(<DrawerTitle>Title</DrawerTitle>);
    expect(screen.getByTestId("title")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("renders DrawerDescription", () => {
    render(<DrawerDescription>Description</DrawerDescription>);
    expect(screen.getByTestId("description")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
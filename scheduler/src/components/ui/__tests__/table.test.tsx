import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "../table"; 

describe("Table Components", () => {
  it("renders a complete table structure correctly", () => {
    render(
      <Table className="">
        <TableCaption className="">Test Caption</TableCaption>
        <TableHeader className="">
          <TableRow className="">
            <TableHead className="">Header 1</TableHead>
            <TableHead className="">Header 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="">
          <TableRow className="">
            <TableCell className="">Cell 1</TableCell>
            <TableCell className="">Cell 2</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="">
          <TableRow className="">
            <TableCell className="">Footer 1</TableCell>
            <TableCell className="">Footer 2</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Verify all parts are in the document
    expect(screen.getByText("Test Caption")).toBeInTheDocument();
    expect(screen.getByText("Header 1")).toBeInTheDocument();
    expect(screen.getByText("Cell 1")).toBeInTheDocument();
    expect(screen.getByText("Footer 1")).toBeInTheDocument();

    // Verify semantic HTML tags
    expect(screen.getByText("Test Caption").tagName).toBe("CAPTION");
    expect(screen.getByText("Header 1").tagName).toBe("TH");
    expect(screen.getByText("Cell 1").tagName).toBe("TD");
  });

  it("wraps the table in a responsive container", () => {
    const { container } = render(<Table className="" data-testid="test-table">Content</Table>);
    
    // Check the wrapper div
    const wrapper = container.querySelector('[data-slot="table-container"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("relative", "w-full", "overflow-x-auto");

    // Check the actual table inside
    const table = screen.getByTestId("test-table");
    expect(table.tagName).toBe("TABLE");
    expect(table).toHaveAttribute("data-slot", "table");
    expect(table).toHaveClass("w-full", "caption-bottom", "text-sm");
  });

  it("merges custom classNames correctly across components", () => {
    render(
      <Table className="custom-table">
        <TableBody className="custom-body">
          <TableRow className="custom-row">
            <TableCell className="custom-cell">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole("table")).toHaveClass("custom-table", "w-full");
    expect(screen.getByRole("rowgroup")).toHaveClass("custom-body");
    expect(screen.getByRole("row")).toHaveClass("custom-row", "border-b");
    expect(screen.getByRole("cell")).toHaveClass("custom-cell", "p-2");
  });

  it("passes through additional props", () => {
    render(
      <TableBody className="">
        <TableRow className="" id="row-1" data-state="selected" aria-label="Selected Row">
          <TableCell className="">Data</TableCell>
        </TableRow>
      </TableBody>
    );

    const row = screen.getByRole("row");
    expect(row).toHaveAttribute("id", "row-1");
    expect(row).toHaveAttribute("data-state", "selected");
    expect(row).toHaveAttribute("aria-label", "Selected Row");
  });

  it("applies specific data-slots to all components", () => {
    render(
      <Table className="">
        <TableCaption className="" data-testid="caption">C</TableCaption>
        <TableHeader className="" data-testid="header">
          <TableRow className="" data-testid="row1">
            <TableHead className="" data-testid="head">H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="" data-testid="body">
          <TableRow className="" data-testid="row2">
            <TableCell className="" data-testid="cell">D</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="" data-testid="footer">
          <TableRow className="" data-testid="row3">
            <TableCell className="">F</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByTestId("caption")).toHaveAttribute("data-slot", "table-caption");
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "table-header");
    expect(screen.getByTestId("body")).toHaveAttribute("data-slot", "table-body");
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "table-footer");
    expect(screen.getByTestId("row1")).toHaveAttribute("data-slot", "table-row");
    expect(screen.getByTestId("head")).toHaveAttribute("data-slot", "table-head");
    expect(screen.getByTestId("cell")).toHaveAttribute("data-slot", "table-cell");
  });
});
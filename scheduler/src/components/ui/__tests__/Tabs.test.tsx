import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

describe("Tabs Components", () => {
  const TestTabs = ({ orientation, variant }: any) => (
    <Tabs defaultValue="tab1" orientation={orientation} className="custom-tabs-class">
      <TabsList variant={variant} className="custom-list-class">
        <TabsTrigger value="tab1" className="custom-trigger-class">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="custom-content-class">
        Content for Tab 1
      </TabsContent>
      <TabsContent value="tab2">
        Content for Tab 2
      </TabsContent>
    </Tabs>
  );

  it("renders the tabs and default active content correctly", () => {
    render(<TestTabs />);

    expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();

    expect(screen.getByText("Content for Tab 1")).toBeVisible();
    
    // Radix unmounts the children of inactive tabs by default
    expect(screen.queryByText("Content for Tab 2")).not.toBeInTheDocument();
  });

  it("switches content when a new tab is clicked", async () => {
    // Setup the user event simulator
    const user = userEvent.setup();
    render(<TestTabs />);

    const tab2Trigger = screen.getByRole("tab", { name: "Tab 2" });
    
    await user.click(tab2Trigger);

    expect(screen.getByText("Content for Tab 2")).toBeVisible();
    
    expect(screen.queryByText("Content for Tab 1")).not.toBeInTheDocument();
  });

  it("applies the default variant classes to TabsList", () => {
    render(<TestTabs variant="default" />);
    
    const tabsList = screen.getByRole("tablist");
    expect(tabsList).toHaveClass("bg-muted");
    expect(tabsList).toHaveAttribute("data-variant", "default");
  });

  it("applies the 'line' variant classes to TabsList", () => {
    render(<TestTabs variant="line" />);
    
    const tabsList = screen.getByRole("tablist");
    expect(tabsList).toHaveClass("bg-transparent");
    expect(tabsList).toHaveAttribute("data-variant", "line");
  });

  it("sets the orientation attribute correctly", () => {
    const { container } = render(<TestTabs orientation="vertical" />);
    
    const rootEl = container.querySelector('[data-slot="tabs"]');
    expect(rootEl).toHaveAttribute("data-orientation", "vertical");
  });

  it("merges custom classNames correctly across all components", () => {
    const { container } = render(<TestTabs />);

    const rootEl = container.querySelector('[data-slot="tabs"]');
    expect(rootEl).toHaveClass("custom-tabs-class", "flex", "gap-2");

    const listEl = screen.getByRole("tablist");
    expect(listEl).toHaveClass("custom-list-class", "inline-flex", "items-center");

    const triggerEl = screen.getByRole("tab", { name: "Tab 1" });
    expect(triggerEl).toHaveClass("custom-trigger-class", "inline-flex", "items-center");

    const contentEl = screen.getByText("Content for Tab 1");
    expect(contentEl).toHaveClass("custom-content-class", "flex-1", "outline-none");
  });
});
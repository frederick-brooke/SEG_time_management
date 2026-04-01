import LunarDrawer from "@/components/layout/LunarDrawer";
import WellbeingPage from "@/app/(pages)/wellbeing/page";

/**
 * WellbeingPanelProps
 *
 * @typedef {Object} WellbeingPanelProps
 * @property {boolean} open - Controls whether the panel is visible
 * @property {Function} onClose - Callback to close the panel
 * @property {string} [title] - Optional custom title (currently unused)
 * @property {React.ReactNode} [children] - Optional override content (currently unused)
 */
interface WellbeingPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

/**
 * WellbeingPanel
 *
 * Wrapper component that renders the wellbeing page inside a slide-out drawer.
 * Handles:
 * - Displaying the panel using LunarDrawer
 * - Passing open/close state to drawer
 * - Embedding the WellbeingPage inside a styled container
 *
 * @param {WellbeingPanelProps} props
 * @returns {JSX.Element} Drawer panel containing wellbeing page
 */
export default function WellbeingPanel({ open, onClose, title, children }: WellbeingPanelProps) {
  return (
    <LunarDrawer
      open={open}
      onClose={onClose}
      side="right"
      title="Wellbeing"
    >
      <div className="flex flex-1 flex-col min-h-0 p-4">
        <WellbeingPage />
      </div>
    </LunarDrawer>
  );
}
import LunarDrawer from "@/components/layout/lunar-drawer";
import WellbeingPage from "@/src/app/(pages)/wellbeing/page";

//wrapper class for the wellbeing page with drawer components
export default function WellbeingPanel({ open, onClose }) {
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
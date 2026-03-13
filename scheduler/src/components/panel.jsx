//generic UI Component that can be reused for any panel
import { IconX } from "@tabler/icons-react";

export default function Panel({ open, onClose, title, children }){
    return (
        <div className={`fixed inset-0 z-[950] bg-black/50 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={onclose}
        >
            <div className={`absolute right-0 top-0 h-full w-[420px] bg-white shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ${
                open ? "translate-x-0" : "translate-x-full"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={onClose}> <IconX/> </button>
                </div>

                {children}
            </div>
        </div>
    );
}
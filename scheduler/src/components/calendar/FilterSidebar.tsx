"use client";
// src/components/calendar/FilterSidebar.tsx

interface Filter {
  key: string;
  label: string;
  color: string;
}

const TASK_FILTERS: Filter[] = [
  { key: "tasks", label: "Tasks", color: "#6b7280" },
  { key: "priorityTasks", label: "Priority Tasks", color: "#dc2626" },
  { key: "completed", label: "Completed", color: "#9ca3af" },
];

interface Props {
  activeFilters: Record<string, boolean>;
  categories: { id: string; name: string; color: string }[];
  categoryFilters: Record<string, boolean>;
  onToggleFilter: (key: string) => void;
  onToggleCategory: (id: string) => void;
  onManageCategories: () => void;
}

function FilterCheckbox({
  color,
  active,
  onToggle,
}: {
  color: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
      style={{ backgroundColor: active ? color : "white", borderColor: color }}
      onClick={onToggle}
    >
      {active && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
  );
}

export default function FilterSidebar({
  activeFilters,
  categories,
  categoryFilters,
  onToggleFilter,
  onToggleCategory,
  onManageCategories,
}: Props) {
  return (
    <div className="w-56 flex-shrink-0">
      <div className="bg-white rounded-2xl border p-4 shadow-sm sticky top-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Tasks
          </h3>
          <div className="flex flex-col gap-3">
            {TASK_FILTERS.map((f) => (
              <label
                key={f.key}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <FilterCheckbox
                  color={f.color}
                  active={activeFilters[f.key]}
                  onToggle={() => onToggleFilter(f.key)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                  {f.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Categories
            </h3>
            <button
              onClick={onManageCategories}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
            >
              + Manage
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <FilterCheckbox
                  color={cat.color}
                  active={categoryFilters[cat.id]}
                  onToggle={() => onToggleCategory(cat.id)}
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

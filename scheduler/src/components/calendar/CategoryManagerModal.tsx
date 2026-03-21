"use client";

/**
 * CategoryManagerModal — modal for creating, editing, and deleting event categories.
 * Composed of CategoryRow (edit existing) and AddCategoryForm (create new).
 */

import { useState } from "react";

/**
 * Renders a single category row with inline edit and delete controls.
 * Validates against black and duplicate colours before saving.
 */
function CategoryRow({
  cat,
  canDelete,
  existingCategories,
  onUpdate,
  onDelete,
}: any) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setError("");
          }}
          className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
          disabled={!editing}
        />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 text-white p-1 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-white/70">
            {cat.name}
          </span>
        )}
        {editing ? (
          <button
            onClick={() => {
              if (!name.trim()) return;
              if (color === "#000000") {
                setError("Black is not allowed.");
                return;
              }
              const dup = existingCategories.some(
                (c: any) =>
                  c.id !== cat.id &&
                  c.color.toLowerCase() === color.toLowerCase(),
              );
              if (dup) {
                setError("This colour is already used.");
                return;
              }
              onUpdate(cat.id, name, color);
              setEditing(false);
              setError("");
            }}
            className="text-xs bg-white text-gray-900 px-3 py-1 rounded-lg font-bold hover:bg-white/90 transition-all"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-white/30 hover:text-white/70 transition-colors"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(cat.id)}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 pl-11">{error}</p>}
    </div>
  );
}

/**
 * Form for adding a new category with a name and colour picker.
 * Validates against black and duplicate colours before calling onAdd.
 */
function AddCategoryForm({ onAdd, existingCategories }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setError("");
          }}
          className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            if (color === "#000000") {
              setError("Black is not allowed.");
              return;
            }
            if (
              existingCategories.some(
                (c: any) => c.color.toLowerCase() === color.toLowerCase(),
              )
            ) {
              setError("This colour is already used.");
              return;
            }
            onAdd(name.trim(), color);
            setName("");
            setColor("#6366f1");
            setError("");
          }}
          className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-500 transition-all"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface CategoryManagerModalProps {
  categories: any[];
  onClose: () => void;
  onCategoriesChange: () => void;
}

/**
 * Modal that lists all categories and allows the user to add, edit, or delete them.
 * Changes are persisted immediately via the /api/categories endpoint.
 * The last remaining category cannot be deleted.
 */
export default function CategoryManagerModal({
  categories,
  onClose,
  onCategoriesChange,
}: CategoryManagerModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-[#111118] border border-white/[0.07] p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/30 hover:text-white/80 text-xl transition-colors"
        >
          ✕
        </button>
        <h3 className="text-2xl font-black mb-6 text-white">Categories</h3>

        <div className="flex flex-col gap-3 mb-6">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              canDelete={categories.length > 1}
              existingCategories={categories}
              onUpdate={async (id: string, name: string, color: string) => {
                await fetch("/api/categories", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id, name, color }),
                });
                onCategoriesChange();
              }}
              onDelete={async (id: string) => {
                await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
                onCategoriesChange();
              }}
            />
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-xs font-bold uppercase text-white/30 mb-3">
            Add New Category
          </p>
          <AddCategoryForm
            existingCategories={categories}
            onAdd={async (name: string, color: string) => {
              await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color }),
              });
              onCategoriesChange();
            }}
          />
        </div>
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";

// ---------------------------------------------------------------------------
// CategoryRow
// ---------------------------------------------------------------------------
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
          className="w-8 h-8 rounded-lg border cursor-pointer"
          disabled={!editing}
        />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border p-1 rounded-lg text-sm"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-gray-700">
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
            className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg font-bold"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(cat.id)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 pl-11">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddCategoryForm
// ---------------------------------------------------------------------------
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
          className="w-8 h-8 rounded-lg border cursor-pointer"
        />
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border p-2 rounded-lg text-sm"
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
          className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CategoryManagerModal
// ---------------------------------------------------------------------------
interface CategoryManagerModalProps {
  categories: any[];
  onClose: () => void;
  onCategoriesChange: () => void;
}

export default function CategoryManagerModal({
  categories,
  onClose,
  onCategoriesChange,
}: CategoryManagerModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>
        <h3 className="text-2xl font-black mb-6 text-gray-900">Categories</h3>

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

        <div className="border-t pt-4">
          <p className="text-xs font-bold uppercase text-gray-400 mb-3">
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

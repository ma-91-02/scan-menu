import type { Dispatch, SetStateAction } from "react";
import type { CatalogEntry, MenuFormState, TextLookup } from "../types";

interface MenuItemFormProps {
  categories: CatalogEntry[];
  editingItemId: string;
  form: MenuFormState;
  ingredientSearch: string;
  selectedIngredients: CatalogEntry[];
  text: TextLookup;
  visibleIngredients: CatalogEntry[];
  onDishImageUpload: (file?: File) => void;
  onOpenDishForm: (categoryId: string) => void;
  onReset: () => void;
  onSave: () => void;
  setForm: Dispatch<SetStateAction<MenuFormState>>;
  setIngredientSearch: (value: string) => void;
}

export function MenuItemForm({
  categories,
  editingItemId,
  form,
  ingredientSearch,
  selectedIngredients,
  text,
  visibleIngredients,
  onDishImageUpload,
  onOpenDishForm,
  onReset,
  onSave,
  setForm,
  setIngredientSearch,
}: MenuItemFormProps) {
  return (
    <div className="menu-builder inline-menu-builder">
      <label>
        {text("restaurant.item_name")}
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </label>
      <label>
        {text("restaurant.description")}
        <input
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </label>
      <label className="file-upload-control">
        {text("restaurant.upload_dish_image")}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onDishImageUpload(event.target.files?.[0])}
        />
        {form.imageUrl ? (
          <img alt="" className="menu-image-preview" src={form.imageUrl} />
        ) : null}
      </label>
      <label>
        {text("restaurant.price")}
        <input
          type="number"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
      </label>
      <label>
        {text("restaurant.section")}
        <select
          value={form.categoryId}
          onChange={(event) => onOpenDishForm(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.displayName}
            </option>
          ))}
        </select>
      </label>
      <div className="ingredient-picker">
        <label>
          {text("restaurant.ingredients")}
          <input
            placeholder={text("restaurant.search_ingredient")}
            value={ingredientSearch}
            onChange={(event) => setIngredientSearch(event.target.value)}
          />
        </label>
        {selectedIngredients.length ? (
          <div className="selected-ingredient-list">
            {selectedIngredients.map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    ingredientIds: current.ingredientIds.filter(
                      (id) => id !== ingredient.id,
                    ),
                  }))
                }
              >
                {ingredient.displayName} ×
              </button>
            ))}
          </div>
        ) : null}
        <div className="catalog-suggestion-list ingredient-suggestions">
          {visibleIngredients.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  ingredientIds: [
                    ...new Set([...current.ingredientIds, ingredient.id]),
                  ],
                }));
                setIngredientSearch("");
              }}
            >
              + {ingredient.displayName}
            </button>
          ))}
        </div>
      </div>
      <div className="menu-form-actions">
        <button type="button" onClick={() => void onSave()}>
          {editingItemId ? text("restaurant.save_dish") : text("common.add")}
        </button>
        {editingItemId ? (
          <button className="muted" type="button" onClick={onReset}>
            {text("restaurant.cancel_edit")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

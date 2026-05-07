import { useMemo } from "react";
import type { CatalogEntry, MenuEntry, MenuFormState } from "../types";
import { searchEntries } from "../utils";

interface UseRestaurantMenuSearchOptions {
  categories: CatalogEntry[];
  categorySearch: string;
  form: MenuFormState;
  ingredientSearch: string;
  ingredients: CatalogEntry[];
  menu: MenuEntry[];
  standardCategories: CatalogEntry[];
}

export function useRestaurantMenuSearch({
  categories,
  categorySearch,
  form,
  ingredientSearch,
  ingredients,
  menu,
  standardCategories,
}: UseRestaurantMenuSearchOptions) {
  const categorySuggestions = useMemo(() => {
    const existingIds = new Set(categories.map((category) => category.id));
    const existingCatalogKeys = new Set(
      categories.map((category) => category.catalogKey).filter(Boolean),
    );
    return [
      ...categories,
      ...standardCategories.filter(
        (category) =>
          !existingIds.has(category.id) &&
          !existingCatalogKeys.has(category.id),
      ),
    ];
  }, [categories, standardCategories]);
  const visibleCategories = useMemo(
    () => searchEntries(categorySuggestions, categorySearch),
    [categorySearch, categorySuggestions],
  );
  const visibleIngredients = useMemo(
    () =>
      searchEntries(ingredients, ingredientSearch)
        .filter((ingredient) => !form.ingredientIds.includes(ingredient.id))
        .slice(0, 8),
    [form.ingredientIds, ingredientSearch, ingredients],
  );
  const selectedIngredients = ingredients.filter((ingredient) =>
    form.ingredientIds.includes(ingredient.id),
  );
  const uncategorizedMenu = menu.filter(
    (item) =>
      !item.categoryId ||
      !categories.some((category) => category.id === item.categoryId),
  );

  return {
    selectedIngredients,
    uncategorizedMenu,
    visibleCategories,
    visibleIngredients,
  };
}

import { useState } from "react";
import {
  buildMenuItemPayload,
  createRestaurantCategory,
  deleteRestaurantCategory,
  deleteRestaurantMenuItem,
  fetchLocalizedRestaurantData,
  saveRestaurantMenuItem,
} from "../api/restaurant-dashboard-api";
import { defaultMenuForm } from "../data/default-restaurant-data";
import type {
  CatalogEntry,
  MenuEntry,
  MenuFormState,
  RestaurantOrder,
  TextLookup,
} from "../types";
import { fileToDataUrl, matchesEntry } from "../utils";
import { useRestaurantMenuSearch } from "./useRestaurantMenuSearch";

interface UseRestaurantMenuOptions {
  onCurrencyFromMenuItem: (currency: string) => void;
  ownerLanguage: string;
  restaurantCurrency: string;
  restaurantId: string;
  setOrders: (orders: RestaurantOrder[]) => void;
  text: TextLookup;
}

export function useRestaurantMenu({
  ownerLanguage,
  onCurrencyFromMenuItem,
  restaurantCurrency,
  restaurantId,
  setOrders,
  text,
}: UseRestaurantMenuOptions) {
  const [categories, setCategories] = useState<CatalogEntry[]>([]);
  const [standardCategories, setStandardCategories] = useState<CatalogEntry[]>(
    [],
  );
  const [ingredients, setIngredients] = useState<CatalogEntry[]>([]);
  const [menu, setMenu] = useState<MenuEntry[]>([]);
  const [form, setForm] = useState<MenuFormState>(defaultMenuForm);
  const [editingItemId, setEditingItemId] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [isDishFormOpen, setIsDishFormOpen] = useState(false);
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");

  const {
    selectedIngredients,
    uncategorizedMenu,
    visibleCategories,
    visibleIngredients,
  } = useRestaurantMenuSearch({
    categories,
    categorySearch,
    form,
    ingredientSearch,
    ingredients,
    menu,
    standardCategories,
  });

  async function loadLocalizedData(language: string) {
    const payload = await fetchLocalizedRestaurantData(restaurantId, language);
    setCategories(payload.categories);
    setStandardCategories(payload.standardCategories);
    setIngredients(payload.ingredients);
    setMenu(payload.menu);
    setOrders(payload.orders);
    const nextCategoryId = payload.categories.some(
      (category) => category.id === activeCategoryId,
    )
      ? activeCategoryId
      : payload.categories[0]?.id || "";
    setActiveCategoryId(nextCategoryId);
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || nextCategoryId,
    }));
  }

  async function handleDishImageUpload(file?: File) {
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, imageUrl }));
  }

  async function saveMenuItem() {
    if (!form.name.trim()) return;
    await saveRestaurantMenuItem(
      restaurantId,
      editingItemId,
      buildMenuItemPayload(form, ownerLanguage, restaurantCurrency),
    );
    resetMenuForm();
    setIngredientSearch("");
    await loadLocalizedData(ownerLanguage);
  }

  function resetMenuForm() {
    setEditingItemId("");
    setIsDishFormOpen(false);
    setForm({
      ...defaultMenuForm,
      categoryId: activeCategoryId || categories[0]?.id || "",
    });
  }

  function editMenuItem(item: MenuEntry) {
    const categoryId =
      item.categoryId || activeCategoryId || categories[0]?.id || "";
    setEditingItemId(item.id);
    setActiveCategoryId(categoryId);
    setIsDishFormOpen(true);
    onCurrencyFromMenuItem(item.currency || restaurantCurrency);
    setForm({
      name: item.displayName,
      description: item.displayDescription,
      imageUrl: item.imageUrl ?? "",
      price: String(item.price),
      categoryId,
      ingredientIds: item.ingredients?.map((ingredient) => ingredient.id) ?? [],
    });
  }

  async function deleteMenuItem(itemId: string) {
    if (!window.confirm(text("restaurant.delete_dish_confirm"))) return;
    await deleteRestaurantMenuItem(restaurantId, itemId);
    if (editingItemId === itemId) resetMenuForm();
    await loadLocalizedData(ownerLanguage);
  }

  async function addCategory(nextName = categorySearch, catalogKey?: string) {
    const name = nextName.trim();
    if (!name) return;

    const existing = categories.find(
      (category) =>
        (catalogKey && category.catalogKey === catalogKey) ||
        matchesEntry(category, name),
    );
    if (existing) {
      setActiveCategoryId(existing.id);
      setForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      return;
    }

    const createdCategory = await createRestaurantCategory(restaurantId, {
      language: ownerLanguage,
      name,
      catalogKey,
    });
    if (createdCategory?.id) {
      setActiveCategoryId(createdCategory.id);
      setForm((current) => ({ ...current, categoryId: createdCategory.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      await loadLocalizedData(ownerLanguage);
    }
  }

  function chooseCategorySuggestion(category: CatalogEntry) {
    const catalogKey = category.catalogKey ?? category.id;
    const existing = categories.find(
      (item) =>
        item.catalogKey === catalogKey ||
        item.id === category.id ||
        matchesEntry(item, category.displayName),
    );
    if (existing) {
      setActiveCategoryId(existing.id);
      setForm((current) => ({ ...current, categoryId: existing.id }));
      setShowCategorySearch(false);
      setCategorySearch("");
      return;
    }

    void addCategory(
      category.displayName,
      standardCategories.some((item) => item.id === catalogKey)
        ? catalogKey
        : category.catalogKey,
    );
  }

  async function deleteCategory(categoryId: string) {
    if (!window.confirm(text("restaurant.delete_section_confirm"))) return;
    await deleteRestaurantCategory(restaurantId, categoryId);
    if (activeCategoryId === categoryId) {
      setActiveCategoryId("");
      setForm((current) => ({ ...current, categoryId: "" }));
    }
    await loadLocalizedData(ownerLanguage);
  }

  function openDishForm(categoryId: string) {
    setActiveCategoryId(categoryId);
    setForm((current) => ({ ...current, categoryId }));
  }

  function startAddDish(categoryId: string) {
    setEditingItemId("");
    setActiveCategoryId(categoryId);
    setIsDishFormOpen(true);
    setForm({
      ...defaultMenuForm,
      categoryId,
    });
    setIngredientSearch("");
  }

  return {
    activeCategoryId,
    addCategory,
    categories,
    categorySearch,
    chooseCategorySuggestion,
    deleteCategory,
    deleteMenuItem,
    editMenuItem,
    editingItemId,
    form,
    handleDishImageUpload,
    ingredientSearch,
    isDishFormOpen,
    loadLocalizedData,
    menu,
    openDishForm,
    resetMenuForm,
    saveMenuItem,
    selectedIngredients,
    setCategorySearch,
    setForm,
    setIngredientSearch,
    setShowCategorySearch,
    showCategorySearch,
    startAddDish,
    uncategorizedMenu,
    visibleCategories,
    visibleIngredients,
  };
}

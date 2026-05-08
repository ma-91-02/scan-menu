import { useEffect, useState } from "react";
import { supportedLanguages, type SupportedLanguage } from "@babili/shared";
import { fetchBootstrapData } from "../api/restaurant-dashboard-api";
import {
  defaultOwnerLanguage,
  defaultRestaurantProfile,
  fallbackRestaurantId,
} from "../data/default-restaurant-data";
import type { TabId } from "../types";
import { canSeeTab, defaultTabForRole } from "../utils";
import { useRestaurantEmployees } from "./useRestaurantEmployees";
import { useRestaurantMenu } from "./useRestaurantMenu";
import { useRestaurantOrders } from "./useRestaurantOrders";
import { useRestaurantPlans } from "./useRestaurantPlans";
import { useRestaurantProfile } from "./useRestaurantProfile";
import { useRestaurantRealtime } from "./useRestaurantRealtime";
import { useRestaurantTables } from "./useRestaurantTables";
import { useRestaurantTranslation } from "./useRestaurantTranslation";

export function useRestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("menu");
  const [role, setRole] = useState("owner");
  const [restaurantId, setRestaurantId] = useState(fallbackRestaurantId);
  const [ownerLanguage, setOwnerLanguage] = useState(defaultOwnerLanguage);
  const [languages, setLanguages] =
    useState<SupportedLanguage[]>(supportedLanguages);
  const { direction, text } = useRestaurantTranslation(
    ownerLanguage,
    languages,
  );
  const profile = useRestaurantProfile({
    ownerLanguage,
    setOwnerLanguage,
    text,
  });
  const orders = useRestaurantOrders(text);
  const menu = useRestaurantMenu({
    onCurrencyFromMenuItem: profile.setRestaurantCurrency,
    ownerLanguage,
    restaurantCurrency: profile.restaurantCurrency,
    restaurantId,
    setOrders: orders.setOrders,
    text,
  });
  const plans = useRestaurantPlans({
    restaurantId,
    setProfile: profile.setProfile,
  });
  const tables = useRestaurantTables(restaurantId);
  const employees = useRestaurantEmployees({
    ownerLanguage,
    restaurantId,
    restaurantName: profile.profile.name,
  });

  const allTabs = [
    { id: "menu" as const, label: text("restaurant.menu") },
    { id: "kitchen" as const, label: text("restaurant.kitchen") },
    { id: "cashier" as const, label: text("restaurant.cashier") },
    { id: "employees" as const, label: text("restaurant.employees") },
    { id: "tables" as const, label: text("restaurant.tables_qr") },
    { id: "plans" as const, label: text("restaurant.subscription") },
    { id: "profile" as const, label: text("restaurant.profile") },
    { id: "settings" as const, label: text("restaurant.settings") },
  ];
  const tabs = allTabs.filter((tab) => canSeeTab(role, tab.id));
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  useRestaurantRealtime({
    ownerLanguage,
    restaurantId,
    setOrders: orders.setOrders,
  });

  useEffect(() => {
    void loadBootstrap();
  }, []);

  useEffect(() => {
    if (!canSeeTab(role, activeTab)) {
      setActiveTab(defaultTabForRole(role));
    }
  }, [activeTab, role]);

  useEffect(() => {
    void menu.loadLocalizedData(ownerLanguage);
  }, [ownerLanguage, restaurantId]);

  async function loadBootstrap() {
    const payload = await fetchBootstrapData(
      fallbackRestaurantId,
      defaultRestaurantProfile,
    );
    setRestaurantId(payload.restaurantId);
    if (payload.role) setRole(payload.role);
    setLanguages(payload.languages);
    profile.applyProfile(payload.profile);
    plans.setPlans(payload.plans);
    tables.setTables(payload.tables);
    employees.setStaff(payload.staff);
  }

  return {
    activeLabel,
    activeTab,
    direction,
    languages,
    ownerLanguage,
    restaurantCurrency: profile.restaurantCurrency,
    tabs,
    text,
    setActiveTab,
    activeCategoryId: menu.activeCategoryId,
    activeOrders: orders.activeOrders,
    categories: menu.categories,
    categorySearch: menu.categorySearch,
    chooseCategorySuggestion: menu.chooseCategorySuggestion,
    currencySearch: profile.currencySearch,
    deleteAccount: profile.deleteAccount,
    deleteCategory: menu.deleteCategory,
    deleteMenuItem: menu.deleteMenuItem,
    editMenuItem: menu.editMenuItem,
    editingItemId: menu.editingItemId,
    form: menu.form,
    handleDishImageUpload: menu.handleDishImageUpload,
    handleLogoUpload: (file?: File) =>
      profile.handleLogoUpload(restaurantId, file),
    ingredientSearch: menu.ingredientSearch,
    isDishFormOpen: menu.isDishFormOpen,
    kitchenOrders: orders.kitchenOrders,
    logout: profile.logout,
    menu: menu.menu,
    openDishForm: menu.openDishForm,
    patchOrder: orders.patchOrder,
    paymentLabel: orders.paymentLabel,
    plans: plans.plans,
    profile: profile.profile,
    profileLabels: profile.profileLabels,
    resetMenuForm: menu.resetMenuForm,
    saveMenuItem: menu.saveMenuItem,
    saveProfile: () => profile.saveProfile(restaurantId),
    selectPlan: plans.selectPlan,
    selectedIngredients: menu.selectedIngredients,
    setCategorySearch: menu.setCategorySearch,
    setCurrencySearch: profile.setCurrencySearch,
    setForm: menu.setForm,
    setIngredientSearch: menu.setIngredientSearch,
    setProfile: profile.setProfile,
    setShowCategorySearch: menu.setShowCategorySearch,
    setStaffForm: employees.setStaffForm,
    setTableNumber: tables.setTableNumber,
    showCategorySearch: menu.showCategorySearch,
    staff: employees.staff,
    staffForm: employees.staffForm,
    startAddDish: menu.startAddDish,
    statusLabel: orders.statusLabel,
    tableNumber: tables.tableNumber,
    tables: tables.tables,
    uncategorizedMenu: menu.uncategorizedMenu,
    updateOwnerLanguage: (language: string) =>
      profile.updateOwnerLanguage(restaurantId, language),
    updateRestaurantCurrency: (currency: string) =>
      profile.updateRestaurantCurrency(restaurantId, currency),
    visibleCategories: menu.visibleCategories,
    visibleCurrencyResults: profile.visibleCurrencyResults,
    visibleIngredients: menu.visibleIngredients,
    waiterRequests: orders.waiterRequests,
    createStaff: employees.createStaff,
    createTable: tables.createTable,
    addCategory: menu.addCategory,
  };
}

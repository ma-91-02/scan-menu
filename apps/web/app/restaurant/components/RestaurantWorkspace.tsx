import type { useRestaurantDashboard } from "../hooks/useRestaurantDashboard";
import { CashierPanel } from "./CashierPanel";
import { CurrencySettings } from "./CurrencySettings";
import { EmployeesPanel } from "./EmployeesPanel";
import { KitchenPanel } from "./KitchenPanel";
import { MenuItemForm } from "./MenuItemForm";
import { MenuPanel } from "./MenuPanel";
import { PlanPanel } from "./PlanPanel";
import { ProfilePanel } from "./ProfilePanel";
import { RestaurantHeader } from "./RestaurantHeader";
import { SettingsPanel } from "./SettingsPanel";
import { TablesPanel } from "./TablesPanel";

type RestaurantDashboardState = ReturnType<typeof useRestaurantDashboard>;

interface RestaurantWorkspaceProps {
  dashboard: RestaurantDashboardState;
}

export function RestaurantWorkspace({ dashboard }: RestaurantWorkspaceProps) {
  const {
    activeCategoryId,
    activeLabel,
    activeOrders,
    activeTab,
    categories,
    categorySearch,
    currencySearch,
    editingItemId,
    form,
    ingredientSearch,
    isDishFormOpen,
    kitchenOrders,
    languages,
    menu,
    ownerLanguage,
    paymentLabel,
    plans,
    profile,
    profileLabels,
    restaurantCurrency,
    selectedIngredients,
    showCategorySearch,
    staff,
    staffForm,
    statusLabel,
    tableNumber,
    tables,
    text,
    uncategorizedMenu,
    visibleCategories,
    visibleCurrencyResults,
    visibleIngredients,
    waiterRequests,
    createStaff,
    createTable,
    deleteAccount,
    deleteCategory,
    deleteMenuItem,
    editMenuItem,
    handleDishImageUpload,
    handleLogoUpload,
    openDishForm,
    patchOrder,
    resetMenuForm,
    saveMenuItem,
    saveProfile,
    selectPlan,
    setCategorySearch,
    setCurrencySearch,
    setForm,
    setIngredientSearch,
    setProfile,
    setShowCategorySearch,
    setStaffForm,
    setTableNumber,
    startAddDish,
    updateOwnerLanguage,
    updateRestaurantCurrency,
    chooseCategorySuggestion,
    addCategory,
  } = dashboard;

  const menuItemForm = (
    <MenuItemForm
      categories={categories}
      editingItemId={editingItemId}
      form={form}
      ingredientSearch={ingredientSearch}
      selectedIngredients={selectedIngredients}
      text={text}
      visibleIngredients={visibleIngredients}
      onDishImageUpload={(file) => void handleDishImageUpload(file)}
      onOpenDishForm={openDishForm}
      onReset={resetMenuForm}
      onSave={() => void saveMenuItem()}
      setForm={setForm}
      setIngredientSearch={setIngredientSearch}
    />
  );

  const currencySettings = (
    <CurrencySettings
      currencySearch={currencySearch}
      ownerLanguage={ownerLanguage}
      restaurantCurrency={restaurantCurrency}
      text={text}
      visibleCurrencyResults={visibleCurrencyResults}
      onCurrencySearchChange={setCurrencySearch}
      onUpdateRestaurantCurrency={(currency) =>
        void updateRestaurantCurrency(currency)
      }
    />
  );

  return (
    <section className="restaurant-workspace focused-owner-workspace">
      <RestaurantHeader
        activeLabel={activeLabel}
        kitchenCount={kitchenOrders.length}
        profile={profile}
        text={text}
        waiterRequestCount={waiterRequests.length}
      />

      {activeTab === "menu" ? (
        <MenuPanel
          activeCategoryId={activeCategoryId}
          categories={categories}
          categorySearch={categorySearch}
          isDishFormOpen={isDishFormOpen}
          menu={menu}
          menuItemForm={menuItemForm}
          showCategorySearch={showCategorySearch}
          text={text}
          uncategorizedMenu={uncategorizedMenu}
          visibleCategories={visibleCategories}
          onAddCategory={() => void addCategory()}
          onChooseCategorySuggestion={chooseCategorySuggestion}
          onDeleteCategory={(categoryId) => void deleteCategory(categoryId)}
          onDeleteMenuItem={(itemId) => void deleteMenuItem(itemId)}
          onEditMenuItem={editMenuItem}
          onStartAddDish={startAddDish}
          setCategorySearch={setCategorySearch}
          setShowCategorySearch={setShowCategorySearch}
        />
      ) : null}

      {activeTab === "kitchen" ? (
        <KitchenPanel
          orders={kitchenOrders}
          statusLabel={statusLabel}
          text={text}
          onPatchOrder={patchOrder}
        />
      ) : null}

      {activeTab === "cashier" ? (
        <CashierPanel
          orders={activeOrders}
          paymentLabel={paymentLabel}
          text={text}
          onPatchOrder={patchOrder}
        />
      ) : null}

      {activeTab === "employees" ? (
        <EmployeesPanel
          staff={staff}
          staffForm={staffForm}
          text={text}
          onCreateStaff={() => void createStaff()}
          setStaffForm={setStaffForm}
        />
      ) : null}

      {activeTab === "tables" ? (
        <TablesPanel
          tableNumber={tableNumber}
          tables={tables}
          text={text}
          onCreateTable={() => void createTable()}
          setTableNumber={setTableNumber}
        />
      ) : null}

      {activeTab === "plans" ? (
        <PlanPanel
          plans={plans}
          profile={profile}
          text={text}
          onSelectPlan={(planId) => void selectPlan(planId)}
        />
      ) : null}

      {activeTab === "profile" ? (
        <ProfilePanel
          profile={profile}
          profileLabels={profileLabels}
          text={text}
          onDeleteAccount={() => void deleteAccount()}
          onLogoUpload={(file) => void handleLogoUpload(file)}
          onSaveProfile={() => void saveProfile()}
          setProfile={setProfile}
        />
      ) : null}

      {activeTab === "settings" ? (
        <SettingsPanel
          currencySettings={currencySettings}
          languages={languages}
          ownerLanguage={ownerLanguage}
          text={text}
          onUpdateOwnerLanguage={(language) =>
            void updateOwnerLanguage(language)
          }
        />
      ) : null}
    </section>
  );
}

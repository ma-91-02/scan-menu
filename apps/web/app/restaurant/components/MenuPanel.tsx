import type { ReactNode } from "react";
import type { CatalogEntry, MenuEntry, TextLookup } from "../types";
import { EmptyState } from "./EmptyState";
import { MenuItemCard } from "./MenuItemCard";

interface MenuPanelProps {
  activeCategoryId: string;
  categories: CatalogEntry[];
  categorySearch: string;
  isDishFormOpen: boolean;
  menu: MenuEntry[];
  menuItemForm: ReactNode;
  showCategorySearch: boolean;
  text: TextLookup;
  uncategorizedMenu: MenuEntry[];
  visibleCategories: CatalogEntry[];
  onAddCategory: () => void;
  onChooseCategorySuggestion: (category: CatalogEntry) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onEditMenuItem: (item: MenuEntry) => void;
  onStartAddDish: (categoryId: string) => void;
  setCategorySearch: (value: string) => void;
  setShowCategorySearch: (updater: (value: boolean) => boolean) => void;
}

export function MenuPanel({
  activeCategoryId,
  categories,
  categorySearch,
  isDishFormOpen,
  menu,
  menuItemForm,
  showCategorySearch,
  text,
  uncategorizedMenu,
  visibleCategories,
  onAddCategory,
  onChooseCategorySuggestion,
  onDeleteCategory,
  onDeleteMenuItem,
  onEditMenuItem,
  onStartAddDish,
  setCategorySearch,
  setShowCategorySearch,
}: MenuPanelProps) {
  return (
    <section className="owner-module-grid">
      <article className="owner-module-card wide">
        <div className="module-heading">
          <h2>{text("restaurant.menu")}</h2>
          <button
            className="section-add-button"
            type="button"
            onClick={() => setShowCategorySearch((value) => !value)}
          >
            + {text("restaurant.add_section")}
          </button>
        </div>
        {showCategorySearch ? (
          <div className="catalog-search-panel">
            <input
              autoFocus
              placeholder={text("restaurant.category_search")}
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
            />
            <button type="button" onClick={() => void onAddCategory()}>
              + {text("common.add")}
            </button>
            <div className="catalog-suggestion-list">
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onChooseCategorySuggestion(category)}
                >
                  {category.displayName}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!categories.length ? (
          <EmptyState
            title={text("restaurant.empty_sections_title")}
            body={text("restaurant.empty_sections_body")}
          />
        ) : null}
        <div className="menu-section-list">
          {categories.map((category) => {
            const sectionItems = menu.filter(
              (item) => item.categoryId === category.id,
            );

            return (
              <article className="menu-section-card" key={category.id}>
                <header className="menu-section-header">
                  <div>
                    <h3>{category.displayName}</h3>
                    <span>
                      {sectionItems.length} {text("restaurant.add_dish")}
                    </span>
                  </div>
                  <div className="menu-section-actions">
                    <button
                      type="button"
                      onClick={() => onStartAddDish(category.id)}
                    >
                      + {text("restaurant.add_dish")}
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => void onDeleteCategory(category.id)}
                    >
                      {text("restaurant.delete_section")}
                    </button>
                  </div>
                </header>
                {isDishFormOpen && activeCategoryId === category.id
                  ? menuItemForm
                  : null}
                {sectionItems.length ? (
                  <div className="menu-dish-list">
                    {sectionItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        text={text}
                        onEdit={onEditMenuItem}
                        onDelete={onDeleteMenuItem}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="menu-section-empty">
                    {text("restaurant.no_dishes")}
                  </p>
                )}
              </article>
            );
          })}
          {uncategorizedMenu.length ? (
            <article className="menu-section-card">
              <header className="menu-section-header">
                <h3>{text("restaurant.uncategorized")}</h3>
              </header>
              <div className="menu-dish-list">
                {uncategorizedMenu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    text={text}
                    onEdit={onEditMenuItem}
                    onDelete={onDeleteMenuItem}
                  />
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </article>
    </section>
  );
}

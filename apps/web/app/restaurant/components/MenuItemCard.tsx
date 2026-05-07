import type { MenuEntry, TextLookup } from "../types";

interface MenuItemCardProps {
  item: MenuEntry;
  text: TextLookup;
  onDelete: (itemId: string) => void;
  onEdit: (item: MenuEntry) => void;
}

export function MenuItemCard({
  item,
  text,
  onDelete,
  onEdit,
}: MenuItemCardProps) {
  return (
    <article className="menu-dish-card">
      {item.imageUrl ? (
        <img
          alt={item.displayName}
          className="menu-dish-image"
          src={item.imageUrl}
        />
      ) : (
        <div className="menu-dish-image placeholder">
          {item.displayName.slice(0, 1)}
        </div>
      )}
      <div className="menu-dish-body">
        <div>
          <h4>{item.displayName}</h4>
          <p>{item.displayDescription}</p>
        </div>
        {item.ingredients?.length ? (
          <span>
            {item.ingredients
              .map((ingredient) => ingredient.displayName)
              .join(", ")}
          </span>
        ) : null}
      </div>
      <strong className="menu-dish-price">
        {item.price} {item.currency}
      </strong>
      <div className="menu-dish-actions">
        <button type="button" onClick={() => onEdit(item)}>
          {text("restaurant.edit_dish")}
        </button>
        <button
          className="danger"
          type="button"
          onClick={() => void onDelete(item.id)}
        >
          {text("restaurant.delete_dish")}
        </button>
      </div>
    </article>
  );
}

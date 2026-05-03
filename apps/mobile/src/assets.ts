import type { ImageSourcePropType } from "react-native";
import type { MenuItem } from "./api";

export const images = {
  pizza: { uri: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=700&q=80" },
  ice: { uri: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=700&q=80" },
  soup: { uri: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=80" },
  bowl: { uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80" },
  kebab: { uri: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=700&q=80" },
  salad: { uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80" },
  drink: { uri: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=80" },
  profile: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80" },
  qr: { uri: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=scanmenu://customer?restaurantId=rst_bistro_01%26table=5" }
} satisfies Record<string, ImageSourcePropType>;

export function getMenuItemImage(item: MenuItem): ImageSourcePropType {
  const text = `${item.id} ${item.displayName}`.toLowerCase();

  if (text.includes("ice")) return images.ice;
  if (text.includes("soup") || text.includes("lentil")) return images.soup;
  if (text.includes("kebab") || text.includes("adana")) return images.kebab;
  if (text.includes("salad") || text.includes("fattoush")) return images.salad;
  if (text.includes("ayran") || text.includes("drink")) return images.drink;
  if (text.includes("pizza") || text.includes("pepperoni")) return images.pizza;

  return images.bowl;
}

import type {
  MenuFormState,
  RestaurantProfile,
  StaffFormState,
} from "../types";

export const fallbackRestaurantId = "rst_bistro_01";
export const sessionStorageKey = "scanmenu-session";
export const defaultOwnerLanguage = "ru";
export const defaultRestaurantCurrency = "USD";

export const defaultRestaurantProfile: RestaurantProfile = {
  id: fallbackRestaurantId,
  name: "Bistro Aurora",
  operatingLanguage: defaultOwnerLanguage,
};

export const defaultMenuForm: MenuFormState = {
  name: "",
  description: "",
  imageUrl: "",
  price: "0",
  categoryId: "",
  ingredientIds: [],
};

export const defaultStaffForm: StaffFormState = {
  name: "",
  email: "",
  username: "",
  role: "viewer",
};

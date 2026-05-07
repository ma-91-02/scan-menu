import { useState } from "react";
import {
  createRestaurantStaff,
  fetchStaff,
} from "../api/restaurant-dashboard-api";
import { defaultStaffForm } from "../data/default-restaurant-data";
import type { StaffFormState, StaffUser } from "../types";

interface UseRestaurantEmployeesOptions {
  ownerLanguage: string;
  restaurantId: string;
  restaurantName: string;
}

export function useRestaurantEmployees({
  ownerLanguage,
  restaurantId,
  restaurantName,
}: UseRestaurantEmployeesOptions) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffForm, setStaffForm] = useState<StaffFormState>(defaultStaffForm);

  async function createStaff() {
    if (!staffForm.name.trim() || !staffForm.email.trim()) return;
    await createRestaurantStaff(
      restaurantId,
      restaurantName,
      ownerLanguage,
      staffForm,
    );
    setStaffForm(defaultStaffForm);
    setStaff(await fetchStaff(restaurantId));
  }

  return {
    createStaff,
    setStaff,
    setStaffForm,
    staff,
    staffForm,
  };
}

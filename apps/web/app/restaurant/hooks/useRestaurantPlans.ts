import { useState } from "react";
import { selectRestaurantPlan } from "../api/restaurant-dashboard-api";
import type { Plan, RestaurantProfile } from "../types";

interface UseRestaurantPlansOptions {
  restaurantId: string;
  setProfile: (profile: RestaurantProfile) => void;
}

export function useRestaurantPlans({
  restaurantId,
  setProfile,
}: UseRestaurantPlansOptions) {
  const [plans, setPlans] = useState<Plan[]>([]);

  async function selectPlan(planId: string) {
    const restaurant = await selectRestaurantPlan(restaurantId, planId);
    if (restaurant) {
      setProfile(restaurant);
    }
  }

  return {
    plans,
    selectPlan,
    setPlans,
  };
}

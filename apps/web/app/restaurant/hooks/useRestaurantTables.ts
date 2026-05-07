import { useState } from "react";
import {
  createRestaurantTable,
  fetchJson,
} from "../api/restaurant-dashboard-api";
import type { RestaurantTable } from "../types";

export function useRestaurantTables(restaurantId: string) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tableNumber, setTableNumber] = useState("");

  async function createTable() {
    if (!tableNumber.trim()) return;
    await createRestaurantTable(restaurantId, tableNumber);
    setTableNumber("");
    setTables(
      await fetchJson(
        `/restaurants/${restaurantId}/tables`,
        [] as RestaurantTable[],
      ),
    );
  }

  return {
    createTable,
    setTableNumber,
    setTables,
    tableNumber,
    tables,
  };
}

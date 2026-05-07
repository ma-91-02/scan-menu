import type { RestaurantTable, TextLookup } from "../types";

interface TablesPanelProps {
  tableNumber: string;
  tables: RestaurantTable[];
  text: TextLookup;
  onCreateTable: () => void;
  setTableNumber: (value: string) => void;
}

export function TablesPanel({
  tableNumber,
  tables,
  text,
  onCreateTable,
  setTableNumber,
}: TablesPanelProps) {
  return (
    <section className="owner-module-card">
      <h2>{text("restaurant.tables_qr")}</h2>
      <div className="menu-builder">
        <input
          placeholder={text("restaurant.table_number")}
          value={tableNumber}
          onChange={(event) => setTableNumber(event.target.value)}
        />
        <button type="button" onClick={() => void onCreateTable()}>
          {text("common.add")}
        </button>
      </div>
      {tables.map((table) => (
        <div className="language-row" key={table.id}>
          <strong>
            {text("restaurant.table")} {table.number}
          </strong>
          <span>{table.qrPath}</span>
        </div>
      ))}
    </section>
  );
}

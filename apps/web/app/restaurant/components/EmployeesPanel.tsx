import type { Dispatch, SetStateAction } from "react";
import type { StaffFormState, StaffUser, TextLookup } from "../types";

interface EmployeesPanelProps {
  staff: StaffUser[];
  staffForm: StaffFormState;
  text: TextLookup;
  onCreateStaff: () => void;
  setStaffForm: Dispatch<SetStateAction<StaffFormState>>;
}

const staffRoles = [
  "owner",
  "manager",
  "cashier",
  "kitchen",
  "waiter",
  "viewer",
];

export function EmployeesPanel({
  staff,
  staffForm,
  text,
  onCreateStaff,
  setStaffForm,
}: EmployeesPanelProps) {
  return (
    <section className="owner-module-card">
      <h2>{text("restaurant.employees")}</h2>
      <div className="menu-builder">
        <input
          placeholder={text("form.name")}
          value={staffForm.name}
          onChange={(event) =>
            setStaffForm({ ...staffForm, name: event.target.value })
          }
        />
        <input
          placeholder={text("form.email")}
          value={staffForm.email}
          onChange={(event) =>
            setStaffForm({ ...staffForm, email: event.target.value })
          }
        />
        <input
          placeholder={text("form.username")}
          value={staffForm.username}
          onChange={(event) =>
            setStaffForm({ ...staffForm, username: event.target.value })
          }
        />
        <select
          value={staffForm.role}
          onChange={(event) =>
            setStaffForm({ ...staffForm, role: event.target.value })
          }
        >
          {staffRoles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <button type="button" onClick={() => void onCreateStaff()}>
          {text("common.add")}
        </button>
      </div>
      {staff.map((user) => (
        <div className="language-row" key={user.id}>
          <strong>{user.name}</strong>
          <span className="status">{user.role}</span>
        </div>
      ))}
    </section>
  );
}

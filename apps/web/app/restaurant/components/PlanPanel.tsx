import type { Plan, RestaurantProfile, TextLookup } from "../types";

interface PlanPanelProps {
  plans: Plan[];
  profile: RestaurantProfile;
  text: TextLookup;
  onSelectPlan: (planId: string) => void;
}

export function PlanPanel({
  plans,
  profile,
  text,
  onSelectPlan,
}: PlanPanelProps) {
  return (
    <section className="pricing-grid">
      {plans.map((plan) => (
        <article className="pricing-card" key={plan.id}>
          <h3>{plan.name}</h3>
          <strong>
            ${plan.priceMonthly}/{text("common.month")}
          </strong>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <button
            className="public-button primary"
            type="button"
            onClick={() => void onSelectPlan(plan.id)}
          >
            {profile.selectedPlan === plan.id
              ? text("common.selected")
              : text("common.select")}
          </button>
        </article>
      ))}
    </section>
  );
}

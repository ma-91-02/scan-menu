import type { PublicPageContent } from "../../lib/public-page";
import styles from "./RestaurantPortalSection.module.scss";

interface RestaurantPortalSectionProps {
  portal: PublicPageContent["restaurantPortal"];
  subtitle: string;
}

export function RestaurantPortalSection({
  portal,
  subtitle,
}: RestaurantPortalSectionProps) {
  return (
    <section className={styles.section} id="restaurant">
      <aside className={styles.panel}>
        <h2>{portal.title}</h2>
        <p>{subtitle}</p>
      </aside>
      <div className={styles.menu}>
        {portal.menuItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

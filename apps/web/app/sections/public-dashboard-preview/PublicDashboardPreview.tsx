import type { PublicPageContent } from "../../lib/public-page";
import styles from "./PublicDashboardPreview.module.scss";

interface PublicDashboardPreviewProps {
  about: PublicPageContent["about"];
}

export function PublicDashboardPreview({ about }: PublicDashboardPreviewProps) {
  return (
    <section className={styles.section} id="about">
      <h2>{about.title}</h2>
      <p>{about.body}</p>
    </section>
  );
}

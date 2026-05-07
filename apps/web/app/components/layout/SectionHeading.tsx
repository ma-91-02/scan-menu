import styles from "./SectionHeading.module.scss";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  body?: string;
}

export function SectionHeading({ eyebrow, title, body }: SectionHeadingProps) {
  return (
    <div className={styles.heading}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

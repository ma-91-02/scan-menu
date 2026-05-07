interface EmptyStateProps {
  body: string;
  title: string;
}

export function EmptyState({ body, title }: EmptyStateProps) {
  return (
    <div className="menu-empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

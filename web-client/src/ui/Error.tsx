type Props = { error?: unknown };

export default function Error({ error }: Props) {
  return (
    <div className="alert alert-danger">
      Error loading tracks: {error || "unknown error"}
    </div>
  );
}

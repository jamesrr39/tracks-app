type Props = { error?: unknown };

export default function Error({ error }: Props) {
  return (
    <div className="alert alert-danger">
      Error loading tracks: {makeErrorText(error)}
    </div>
  );
}

function makeErrorText(error: unknown) {
  if (!error) {
    return "unknown error";
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch (e) {
    return `error, and error converting to text (${e})`;
  }
}

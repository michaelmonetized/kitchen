type FormAlertProps = {
  status?: string | null;
  error?: string | null;
};

export function FormAlert({ status, error }: FormAlertProps) {
  return (
    <>
      {status && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
    </>
  );
}
export function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const success = type === "success";
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded border border-l-[3px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
        success
          ? "border-brand-100 border-l-brand-600 bg-brand-50 text-brand-800"
          : "border-clay-100 border-l-clay-500 bg-clay-50 text-clay-700"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-[3px] h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        {success ? (
          <path d="m3 8.5 3.2 3.2L13 4.9" />
        ) : (
          <>
            <path d="M8 2.8 14.4 13.2H1.6L8 2.8Z" />
            <path d="M8 7v2.4M8 11.4h.01" />
          </>
        )}
      </svg>
      <p>{message}</p>
    </div>
  );
}

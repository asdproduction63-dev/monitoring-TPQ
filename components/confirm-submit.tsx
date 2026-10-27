"use client";

export function ConfirmSubmit({
  children,
  className,
  message,
}: {
  children: React.ReactNode;
  className?: string;
  message: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}

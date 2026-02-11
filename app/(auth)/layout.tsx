export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: "#0c111c",
        borderRight: "1px solid rgba(148,163,184,0.08)",
      }}
    >
      {children}
    </div>
  );
}

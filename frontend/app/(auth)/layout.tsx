/**
 * app/(auth)/layout.tsx
 * Auth pages use a bare layout — no Navbar/Footer.
 * The AuthProvider is still provided via the root layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

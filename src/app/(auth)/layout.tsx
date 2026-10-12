import { Logo } from "@/components/common/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <Logo className="justify-center" />
      {children}
    </main>
  );
}

import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AppUserRecord } from "@/lib/server/auth/types";

type AppShellProps = {
  children: React.ReactNode;
  email: string | null;
  appUser: AppUserRecord;
};

type NavItem = {
  href: string;
  label: string;
  hint: string;
};

const navByRole: Record<AppUserRecord["role"], NavItem[]> = {
  student: [
    { href: "/app/new", label: "Nouveau", hint: "point d'entree devoir" },
    { href: "/app/history", label: "Sessions", hint: "historique et resumes" },
    {
      href: "/app/settings",
      label: "Reglages",
      hint: "profil et confidentialite",
    },
  ],
  parent: [
    { href: "/app", label: "Overview", hint: "vision generale" },
    { href: "/app#students", label: "Eleves", hint: "liens et supervision" },
    {
      href: "/app/settings",
      label: "Reglages",
      hint: "billing, profil et confidentialite",
    },
  ],
  tutor: [
    { href: "/app", label: "Overview", hint: "surface tuteur" },
    { href: "/app#students", label: "Eleves", hint: "sessions et notes" },
    {
      href: "/app/settings",
      label: "Reglages",
      hint: "profil et confidentialite",
    },
  ],
  admin: [
    { href: "/app", label: "Overview", hint: "etat global" },
    { href: "/app/audit", label: "Audit", hint: "lectures sensibles" },
    {
      href: "/app/settings",
      label: "Reglages",
      hint: "profil et limites admin",
    },
  ],
};

const roleLabels: Record<AppUserRecord["role"], string> = {
  student: "Espace eleve",
  parent: "Espace parent",
  tutor: "Espace tuteur",
  admin: "Espace admin",
};

export function AppShell({ children, email, appUser }: AppShellProps) {
  const navItems = navByRole[appUser.role];

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {roleLabels[appUser.role]}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                Navigation protegee pour les prochains workflows
              </h1>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Le shell garde le chrome applicatif partage, pendant que chaque
                role evolue dans son propre module sans composant monolithique.
              </p>
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 transition hover:-translate-y-0.5"
                  href={item.href}
                  key={item.href}
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--ink-soft)]">
                    {item.hint}
                  </p>
                </Link>
              ))}
            </nav>

            <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm">
              <p className="font-medium">Session</p>
              <p className="text-[color:var(--ink-soft)]">
                {email ?? "email inconnu"}
              </p>
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-6">
          <header className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
                  <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                    Role: {appUser.role}
                  </span>
                  <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                    Statut: {appUser.account_status}
                  </span>
                  <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                    Interface: {appUser.preferred_ui_language}
                  </span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                    Application
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                    {roleLabels[appUser.role]}
                  </h2>
                </div>
              </div>

              <div className="hidden md:block lg:hidden">
                <SignOutButton />
              </div>
            </div>

            {appUser.account_status === "deletion_requested" ? (
              <div className="mt-5 rounded-[1.5rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-4 text-sm leading-6 text-[#6b5320]">
                Une suppression est deja en file pour ce compte. Les autres
                workflows sont geles tant que la file n&apos;est pas relevee.
              </div>
            ) : null}

            <nav className="mt-5 flex gap-3 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <Link
                  className="min-w-[11rem] rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 transition hover:-translate-y-0.5"
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--ink-soft)]">
                    {item.hint}
                  </p>
                </Link>
              ))}
            </nav>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}

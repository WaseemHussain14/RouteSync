import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { mockLogin, type Role } from "@/lib/auth";
import { ArrowLeft, LogIn, AlertCircle } from "lucide-react";
import logo from "@/assets/routesync-logo.png";

type Props = {
  role: Role;
  title: string;
  subtitle: string;
  idLabel: string;
  idPlaceholder: string;
  redirectTo: "/student" | "/driver";
  altLink: { to: "/login/student" | "/login/driver"; label: string };
  accent?: "gold" | "emerald";
};

export function LoginCard({
  role,
  title,
  subtitle,
  idLabel,
  idPlaceholder,
  redirectTo,
  altLink,
}: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      mockLogin(role, id, password, name);
      navigate({ to: redirectTo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <img src={logo} alt="RouteSync logo" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-semibold">RouteSync</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 py-10">
        <div className="glass rounded-2xl p-7 shadow-gold">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
            {role} sign-in
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Full name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="input-base"
              />
            </Field>

            <Field label={idLabel}>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={idPlaceholder}
                required
                className="input-base"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={4}
                className="input-base"
              />
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-semibold text-[color:var(--navy-deep)] transition hover:opacity-90 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Demo only · any ID + 4+ char password works
            </p>
          </form>
        </div>

        <Link
          to={altLink.to}
          className="mt-6 text-center text-sm text-muted-foreground hover:text-gold"
        >
          {altLink.label}
        </Link>
      </main>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: color-mix(in oklab, var(--card) 60%, transparent);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color .15s;
        }
        .input-base:focus { border-color: var(--gold); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

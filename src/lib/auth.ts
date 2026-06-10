// Simple mock auth using localStorage. No backend.
export type Role = "student" | "driver";

export type Session = {
  role: Role;
  name: string;
  id: string; // student id or driver id
  loginAt: number;
};

const KEY = "campustrack.session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

// Mock credential check — accepts any non-empty id + password >= 4 chars.
export function mockLogin(role: Role, id: string, password: string, name?: string): Session {
  if (!id.trim()) throw new Error("ID is required");
  if (password.length < 4) throw new Error("Password must be at least 4 characters");
  const session: Session = {
    role,
    id: id.trim(),
    name: name?.trim() || (role === "driver" ? `Driver ${id}` : `Student ${id}`),
    loginAt: Date.now(),
  };
  setSession(session);
  return session;
}

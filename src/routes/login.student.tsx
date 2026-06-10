import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/login/student")({
  head: () => ({
    meta: [
      { title: "Student Sign-in — RouteSync" },
      { name: "description", content: "Sign in to track your campus bus in real time." },
    ],
  }),
  ssr: false,
  component: StudentLogin,
});

function StudentLogin() {
  return (
    <LoginCard
      role="student"
      title="Welcome back, student"
      subtitle="Sign in to see live bus locations, ETAs, and route stops."
      idLabel="Student ID"
      idPlaceholder="e.g. CS21B042"
      redirectTo="/student"
      altLink={{ to: "/login/driver", label: "Are you a driver? Sign in here →" }}
    />
  );
}

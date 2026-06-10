import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/LoginCard";

export const Route = createFileRoute("/login/driver")({
  head: () => ({
    meta: [
      { title: "Driver Sign-in — RouteSync" },
      { name: "description", content: "Driver login to broadcast live bus location." },
    ],
  }),
  ssr: false,
  component: DriverLogin,
});

function DriverLogin() {
  return (
    <LoginCard
      role="driver"
      title="Driver sign-in"
      subtitle="Log in to start a trip and share your bus location with students."
      idLabel="Driver ID"
      idPlaceholder="e.g. DRV-204"
      redirectTo="/driver"
      altLink={{ to: "/login/student", label: "Are you a student? Sign in here →" }}
    />
  );
}

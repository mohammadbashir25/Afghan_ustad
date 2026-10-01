import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">
          AfghanUstad Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome, {session.user.name}
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">
            Your role
          </p>

          <p className="mt-1 text-xl font-semibold">
            {session.user.role}
          </p>
        </div>
      </div>
    </main>
  );
}
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Screen } from "@/components/layout/Screen";

/** Layout sin bottom nav para onboarding. */
export default async function OnboardingSeguirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <Screen noNav>{children}</Screen>;
}

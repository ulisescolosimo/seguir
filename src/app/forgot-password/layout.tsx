import { Screen } from "@/components/layout/Screen";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Screen noNav>{children}</Screen>;
}

import { Screen } from "@/components/layout/Screen";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Screen noNav>{children}</Screen>;
}

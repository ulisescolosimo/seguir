import { Screen } from "@/components/layout/Screen";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Screen noNav>{children}</Screen>;
}

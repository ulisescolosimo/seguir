import { Screen } from "@/components/layout/Screen";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Screen noNav>{children}</Screen>;
}

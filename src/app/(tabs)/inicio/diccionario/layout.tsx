import { Libre_Baskerville } from "next/font/google";

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-diccionario",
  display: "swap",
});

export default function DiccionarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={libreBaskerville.variable}>
      {children}
    </div>
  );
}

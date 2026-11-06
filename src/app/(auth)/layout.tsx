import Image from "next/image";
import logoNilaiHub from "../../../public/logo-nilaihub.png";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-otentikasi flex flex-col items-center">
        <Image
          src={logoNilaiHub}
          alt="nilaiHub"
          loading="eager"
          className="h-11 sm:h-12 w-auto mb-8"
        />

        <div className="w-full">{children}</div>

        <p className="mikro mt-8 text-center">NILAIHUB BY DODECLASS</p>
      </div>
    </div>
  );
}

import Image from "next/image";
import BrandTitle from "./BrandTitle";
import Tagline from "./Tagline";
import StartButton from "./StartButton";

const BG_IMAGE_URL = "/bg.jpg";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen flex items-center justify-center">
      {/* Background image */}
      <Image
        src={BG_IMAGE_URL}
        alt="사지선다 배경"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <BrandTitle />
        <Tagline />
        <StartButton />
      </div>
    </section>
  );
}

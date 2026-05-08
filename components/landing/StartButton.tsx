import Link from "next/link";

export default function StartButton() {
  return (
    <Link
      href="/main"
      className="mt-2 inline-flex items-center justify-center px-10 py-4 rounded-full bg-white text-black text-sm font-semibold tracking-wide transition-all duration-300 ease-out hover:bg-white/90 hover:scale-105 active:scale-95 animate-fade-in-up"
      style={{ animationDelay: "0.9s", opacity: 0 }}
    >
      테스트 시작하기
    </Link>
  );
}

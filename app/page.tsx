import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F0] font-sans overflow-hidden">
      {/* Top-right large circle */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#6E8450] opacity-80 pointer-events-none"></div>

      {/* Bottom-left large circle */}
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#6E8450] opacity-80 pointer-events-none"></div>

      <main className="relative flex min-h-screen w-full items-center justify-center">
        <div className="z-10 w-full max-w-md px-8">
          <div className="mx-auto rounded-3xl bg-white/90 p-10 shadow-xl backdrop-blur-md text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#A4B870]">
              <span className="text-3xl">🙂</span>
            </div>

            <h1 className="text-2xl font-bold text-[#6E8450]">Reflect, and<br/>Recharge</h1>
            <p className="mt-2 text-sm text-[#6E8450]">A Place to Write,</p>

            <div className="mt-8 flex flex-col gap-4">
              <Link href="/register" className="mx-auto w-48 rounded-full bg-[#A4B870] px-6 py-2 text-white shadow-sm">
                Register
              </Link>
              <Link href="/login" className="mx-auto w-48 rounded-full bg-[#A4B870] px-6 py-2 text-white/90">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

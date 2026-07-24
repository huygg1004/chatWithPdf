import FileUpload from "@/components/FileUpload";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Check,
  FileSearch,
  FileText,
  LogIn,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: MessageSquareText,
    title: "Ask anything",
    description:
      "Get clear answers, summaries, and explanations directly from your PDF.",
  },
  {
    icon: Zap,
    title: "Instant insights",
    description:
      "Find important information without manually searching through every page.",
  },
  {
    icon: ShieldCheck,
    title: "Private and secure",
    description:
      "Your uploaded documents remain protected and are only accessible by you.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  const isAuth = Boolean(userId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-[-10rem] top-[8rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-[-15rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <header className="border-b border-white/10">
          <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight">PDFChat</p>
                <p className="text-xs text-slate-400">AI document assistant</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {isAuth ? (
                <>
                  <Link
                    href="/chat"
                    className={buttonVariants({
                      variant: "ghost",
                      className:
                        "hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex",
                    })}
                  >
                    My chats
                  </Link>

                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9",
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={buttonVariants({
                      variant: "ghost",
                      className:
                        "hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex",
                    })}
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/sign-up"
                    className={buttonVariants({
                      className:
                        "rounded-full bg-white px-5 text-slate-950 hover:bg-slate-200",
                    })}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" />
              AI-powered document conversations
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Turn every PDF into a{" "}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                conversation.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Upload research papers, reports, textbooks, or contracts and get
              instant answers grounded in your document.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {isAuth ? (
                <>
                  <Link
                    href="#upload"
                    className={buttonVariants({
                      size: "lg",
                      className:
                        "h-12 rounded-full bg-white px-7 text-slate-950 hover:bg-slate-200",
                    })}
                  >
                    Upload a PDF
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/chat"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "h-12 rounded-full border-white/15 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white",
                    })}
                  >
                    View previous chats
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className={buttonVariants({
                      size: "lg",
                      className:
                        "h-12 rounded-full bg-white px-7 text-slate-950 hover:bg-slate-200",
                    })}
                  >
                    Start chatting for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/sign-in"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "h-12 rounded-full border-white/15 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white",
                    })}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              {[
                "Fast document analysis",
                "Answers based on your PDF",
                "No credit card required",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Upload panel */}
          <div id="upload" className="relative scroll-mt-24">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-violet-500/50 to-cyan-400/50 blur-2xl opacity-30" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.4rem] border border-white/10 bg-slate-900/90 p-6 sm:p-8">
                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Chat with your PDF</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Upload a document to begin
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                    <FileSearch className="h-5 w-5 text-violet-300" />
                  </div>
                </div>

                {isAuth ? (
                  <div className="overflow-hidden rounded-2xl bg-white text-slate-950">
                    <FileUpload />
                  </div>
                ) : (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                      <FileText className="h-7 w-7 text-slate-300" />
                    </div>

                    <h2 className="text-lg font-semibold">
                      Sign in to upload a PDF
                    </h2>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                      Create an account to upload documents, ask questions, and
                      save your conversations.
                    </p>

                    <Link href="/sign-in" className="mt-6">
                      <Button className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-200">
                        Sign in to continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                <p className="mt-4 text-center text-xs text-slate-500">
                  PDF files only · Your documents remain private
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>

                <h2 className="text-lg font-semibold">{title}</h2>

                <p className="mt-2 leading-7 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
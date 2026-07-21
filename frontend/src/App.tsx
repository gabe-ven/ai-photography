import { UploadPanel } from "@/features/upload/UploadPanel";

export default function App() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 text-center">
          <h1 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-4xl font-black text-transparent md:text-5xl lg:text-6xl">
            Photographer Brain
          </h1>
          <p className="mt-2 text-neutral-400">
            Upload a photograph and get an AI-powered critique.
          </p>
        </header>

        <UploadPanel />
      </div>
    </main>
  );
}

import SmoothScroll from "@/components/SmoothScroll";
import MemoryExperience from "@/components/MemoryExperience";

export const metadata = {
  title: "Weisfriends // Gallery of Memories",
  description: "Walk down a cinematic, immersive 3D corridor of glowing digital exhibition boards displaying historic and emotional memory captures.",
};

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-[500vh] w-full bg-[#050404] overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
        <MemoryExperience />
      </main>
    </SmoothScroll>
  );
}

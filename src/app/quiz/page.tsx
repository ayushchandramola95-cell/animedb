import { Metadata } from "next";
import { Suspense } from "react";
import AnimeQuizClient from "@/components/AnimeQuizClient";

export const metadata: Metadata = {
  title: "What Should I Watch Next? • Anime Taste Recommender | AnimeDB",
  description:
    "Answer 3 quick questions about your mood, time, and streaming platform to calculate your perfect next anime watch.",
};

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AnimeQuizClient />
    </Suspense>
  );
}

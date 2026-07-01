import type { Metadata } from "next";
import ExpTracker from "@/components/ExpTracker";

export const metadata: Metadata = {
  title: "EXP Tracker | MapleBoss",
  description: "Track MapleStory N character EXP gains, daily progress, and level estimates.",
};

export default function ExpTrackerPage() {
  return <ExpTracker />;
}

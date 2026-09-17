import type { Metadata } from "next";
import Settings from "./Settings";
import { Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your rules",
  description:
    "Set the risk limit and the smallest reward you consider worth taking. Your trades are graded against your numbers, not ours.",
};

export default function SettingsPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Your rules"
        title="Set your own limits"
        lede="Your trades are graded against these numbers. The lessons argue for 1% and 2 to 1, but a real plan can sit elsewhere — so they are yours to set."
      />
      <Settings />
    </Narrow>
  );
}

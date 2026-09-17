import type { Metadata } from "next";
import { Card, PageHeader, Shell } from "@/components/ui";
import { SECTIONS } from "@/content/sections";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "The nine sections of the algorithmic trading study guide, navigable and cross-linked.",
};

export default function LearnIndex() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Learn"
        title="The whole guide, in order"
        lede="Nine sections. Start at the top if you are new; jump straight to the pitfalls if you are revising."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card
            key={s.slug}
            href={`/learn/${s.slug}/`}
            title={s.title}
            meta={`Section ${s.number}`}
          >
            {s.blurb}
          </Card>
        ))}
      </div>
    </Shell>
  );
}

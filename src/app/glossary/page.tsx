import type { Metadata } from "next";
import GlossaryList from "./GlossaryList";
import { Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Every term from the algorithmic trading guide in plain English, with extra context for anyone meeting the idea for the first time.",
};

export default function GlossaryPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Reference"
        title="Glossary"
        lede="The guide's definitions, plus the context it assumes you already have."
      />
      <GlossaryList />
    </Narrow>
  );
}

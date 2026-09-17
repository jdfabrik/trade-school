import type { Metadata } from "next";
import GlossaryList from "./GlossaryList";
import { Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Every term this site uses, in plain English, with the context a new trader is usually assumed to already have.",
};

export default function GlossaryPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Reference"
        title="Glossary"
        lede="Plain definitions, plus why each one matters when you have real money on the line. Search it, or filter by topic."
      />
      <GlossaryList />
    </Narrow>
  );
}

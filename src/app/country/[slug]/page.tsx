import { redirect } from "next/navigation";

type LegacyCountryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCountryPage({ params }: LegacyCountryPageProps) {
  const { slug } = await params;
  redirect(`/countries/${slug}`);
}

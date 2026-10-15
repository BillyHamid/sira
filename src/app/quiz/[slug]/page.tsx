import QuizParticipant from "@/components/QuizParticipant";

export const metadata = { title: "Quiz en direct — BOX Academy", robots: { index: false, follow: false } };
export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <QuizParticipant slug={slug} />;
}

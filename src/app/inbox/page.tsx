import { InboxSimulator } from "@/components/inbox/inbox-simulator";
import { PageHeader } from "@/components/shared/page-header";
import { getConversations } from "@/lib/data-store";

export default async function InboxPage() {
  const conversations = await getConversations();

  return (
    <div>
      <PageHeader
        eyebrow="וואטסאפ נכנס"
        title="הודעות וואטסאפ"
        description="סימולטור רציני לזרימת ההודעות העתידית. כל הודעה נכנסת נשמרת, עוברת parser, ומייצרת הזמנה או שאלת המשך."
      />
      <InboxSimulator conversations={conversations} />
    </div>
  );
}

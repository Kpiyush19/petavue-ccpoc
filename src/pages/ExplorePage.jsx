import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getCurrentUser } from "../api";
import { useSessionContext } from "../contexts/SessionContext";
import { Composer } from "../components/sessions";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ExplorePage() {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const userName = currentUser?.firstName || "";
  const [createLoading, setCreateLoading] = useState(false);

  const handleSend = async (message, files) => {
    if (createLoading) return;
    if (!message && files.length === 0) return;

    setCreateLoading(true);
    try {
      const sid = await session.createSession("");
      navigate(`/session/${sid}`, {
        state: {
          initialMessage: message || null,
          initialFiles: files.length > 0 ? files : null
        }
      });
    } catch (e) {
      toast.error("Failed to create session: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const greeting = getGreeting();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      <div className="w-full max-w-[832px] flex flex-col items-center gap-6 relative">
        <motion.div {...fadeUp(0)} className="text-center">
          <div className="flex items-center justify-center mb-3">
            <img src="/petavue-logo.svg" alt="Petavue" className="w-8 h-10" />
          </div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
            {greeting}
            {userName ? `, ${userName}` : ""}
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-2">How can I help you today?</p>
        </motion.div>

        <motion.div {...fadeUp(0.08)} className="w-full">
          <Composer onSend={handleSend} disabled={createLoading} placeholder="Ask the agent to analyze your data..." />
        </motion.div>
      </div>
    </div>
  );
}

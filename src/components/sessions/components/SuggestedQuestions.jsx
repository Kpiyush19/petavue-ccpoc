import { motion } from "motion/react";
import { CircleHelp } from "lucide-react";

// Grounded follow-up chips for the latest turn. A click sends the question
// immediately. Provenance (the KD/skill it was grounded in) is hover-only via
// the button `title` — `grounded_type` rides along in the payload but isn't
// surfaced visually.
export default function SuggestedQuestions({ questions, onSelect, disabled }) {
  if (!questions || questions.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="s-suggested-questions"
      role="group"
      aria-label="Suggested follow-up questions"
    >
      <CircleHelp size={16} className="s-suggested-questions__icon" aria-hidden="true" />
      <div className="s-suggested-questions__chips">
        {questions.map((q, i) => (
          <button
            key={`${q.grounded_in || "q"}-${i}`}
            type="button"
            className="s-suggested-questions__chip"
            onClick={() => onSelect(q.question)}
            disabled={disabled}
            title={q.grounded_in ? `Based on ${q.grounded_in}` : undefined}
          >
            {q.question}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

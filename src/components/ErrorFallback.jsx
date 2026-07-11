import { motion } from "motion/react";
import { ArrowClockwise, House } from "@phosphor-icons/react";
import { Button } from "@/ui";

export function ErrorFallback({ error, resetError }) {
  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bg-white inset-0 flex items-center justify-center z-50 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl p-10 w-full max-w-[560px] flex flex-col items-center gap-8 mx-4 shadow-[0px_0px_20px_-10px]"
      >
        <div className="flex flex-col items-center gap-14">
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-4xl font-semibold text-[var(--text-primary)]"
            >
              Something went wrong
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-sm text-[var(--text-secondary)] px-2"
            >
              Something broke on our end and our team has been notified. Try refreshing or head back home.
            </motion.p>
          </div>
        </div>

        {import.meta.env.DEV && error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="w-full px-4"
          >
            <div className="text-xs text-[var(--error)] bg-[var(--error)]/5 border border-[var(--error)]/20 rounded-xl px-4 py-3 font-mono break-all max-h-28 overflow-auto">
              {error.message || String(error)}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex gap-3 w-full px-4"
        >
          <Button variant="primary" size="lg" onClick={handleReload} className="flex-1">
            <ArrowClockwise size={16} weight="bold" />
            Try again
          </Button>
          <Button variant="secondary" size="lg" onClick={() => (window.location.href = "/")} className="flex-1">
            <House size={16} weight="bold" />
            Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { motion } from 'motion/react'
import Composer from './Composer'

export default function WelcomeState({ onSend, disabled }) {
  return (
    <div className="s-welcome-state">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="s-welcome-state__icon-wrapper"
      >
        <div className="s-welcome-state__icon-glow" />
        <div className="s-welcome-state__icon">
          <img src="/petavue-logo.svg" alt="Petavue" style={{ width: 24, height: 30 }} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="s-welcome-state__text"
      >
        <h2 className="s-welcome-state__title">How can I help you today?</h2>
        <p className="s-welcome-state__subtitle">Ask a question about your data to get started</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="w-full max-w-[900px] px-6"
      >
        <Composer
          onSend={onSend}
          disabled={disabled}
          placeholder="Ask the agent to analyze your data..."
        />
      </motion.div>
    </div>
  )
}

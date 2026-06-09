import Composer from './components/Composer'

export default function InputArea({ onSend, onCancel, disabled, isThinking, connectionStatus, sessionId }) {
  const placeholder = connectionStatus === 'connected'
    ? 'Ask a question about your data...'
    : connectionStatus === 'connecting'
      ? 'Connecting...'
      : 'Ask a question about your data...'

  return (
    <div className="s-input-area">
      <div className="s-input-area__inner">
        <Composer
          onSend={onSend}
          onCancel={onCancel}
          disabled={disabled}
          isThinking={isThinking}
          placeholder={placeholder}
          sessionId={sessionId}
        />
        <div className="s-input-area__footer">
          <span className="s-input-area__disclaimer">AI can make mistakes. Ask how a result was calculated to verify.</span>
        </div>
      </div>
    </div>
  )
}

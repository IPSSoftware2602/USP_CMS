import { useSessionManager } from "./hooks/useSessionManager";
import SessionWarningModal from "./pages/components/sessionWarningModal";

export default function SessionRoot({ children }) {
  const {
    showWarning,
    timeLeft,
    timeLeftMs,
    extendSession,
    handleLogout,
  } = useSessionManager();

  return (
    <>
      {children}

      <SessionWarningModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        timeLeftMs={timeLeftMs}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </>
  );
}

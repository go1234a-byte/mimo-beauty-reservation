import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_DURATION_MS = 1400;

interface MimoSplashScreenProps {
  onFinish?: () => void;
}

export function MimoSplashScreen({ onFinish }: MimoSplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="mimo-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-3 px-6 text-center"
          >
            <span className="text-5xl font-bold tracking-tight text-primary">MIMO</span>
            <p className="text-base font-medium text-muted-foreground">지금 가능한 곳</p>
            <p className="text-sm text-muted-foreground/70">당신의 일상에 아름다움을 더하는 시간</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

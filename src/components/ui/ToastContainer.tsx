'use client';

import React from 'react';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ToastContainer() {
  const { notifications, dismissNotification } = useSkillBridge();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(n => {
          let icon = <CheckCircle2 className="w-5 h-5 text-[#31594B] shrink-0" />;
          let borderClass = 'border-[#C8D9C2] bg-white text-[#292F2B]';
          
          if (n.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-[#B5473C] shrink-0" />;
            borderClass = 'border-red-200 bg-red-50/95 text-red-900';
          } else if (n.type === 'info') {
            icon = <Info className="w-5 h-5 text-[#68716B] shrink-0" />;
            borderClass = 'border-[#E3E2D9] bg-white text-[#292F2B]';
          }

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-md flex items-start gap-3 ${borderClass}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{n.title}</p>
                <p className="text-xs text-[#68716B] mt-1 leading-relaxed">{n.message}</p>
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                className="text-[#8E9690] hover:text-[#292F2B] transition-colors p-1 rounded hover:bg-[#ECE8DD]/60 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastProvider';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export const CopyButton = ({ value, label, className = "" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast(`${label || 'Value'} copied to clipboard`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('Failed to copy', 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-500 active:scale-90 ${className}`}
      title={`Copy ${label || 'value'}`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Check className="w-3.5 h-3.5 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Copy className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

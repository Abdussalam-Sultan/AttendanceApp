import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
  className?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'indigo';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option", 
  className = "", 
  variant = "light" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const variantStyles = {
    light: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200",
    dark: "bg-slate-900 text-white border-slate-800",
    indigo: "bg-white/10 border-transparent text-white backdrop-blur-md shadow-lg shadow-indigo-500/10"
  };

  const groups = Array.from(new Set(options.map(opt => opt.group).filter(Boolean)));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] ${variantStyles[variant]}`}
      >
        <span className="truncate mr-2 flex items-center gap-2">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden py-2"
          >
            <div className="max-h-[240px] overflow-y-auto no-scrollbar">
              {groups.length > 0 ? (
                groups.map(group => (
                  <div key={group || 'ungrouped'} className="px-2 pb-2 last:pb-0">
                    <div className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {group}
                    </div>
                    {options.filter(opt => opt.group === group).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          value === opt.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'text-slate-600 dark:text-slate-400'
                        } ${opt.className || ''}`}
                      >
                         <div className="flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </div>
                        {value === opt.value && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      value === opt.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'text-slate-600 dark:text-slate-400'
                    } ${opt.className || ''}`}
                  >
                    <div className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                    </div>
                    {value === opt.value && <Check className="w-3 h-3" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

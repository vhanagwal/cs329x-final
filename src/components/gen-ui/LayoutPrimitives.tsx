import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface LayoutContainerProps {
  type: 'layout-row' | 'layout-col';
  children: React.ReactNode;
  className?: string;
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({ type, children, className }) => {
  const isRow = type === 'layout-row';
  return (
    <div className={cn(
      "flex w-full h-full overflow-hidden gap-3 p-2",
      isRow ? "flex-row" : "flex-col",
      className
    )}>
      {children}
    </div>
  );
};

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  flex?: number;
}

export const Panel: React.FC<PanelProps> = ({ title, children, className, flex = 1 }) => {
  return (
    <div 
      className={cn(
        "flex flex-col bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden animate-scale-in",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
      style={{ flex: flex }}
    >
      {title && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 px-4 py-2.5 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700 tracking-tight">{title}</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/30 hover:bg-red-400 transition-colors cursor-pointer" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30 hover:bg-amber-400 transition-colors cursor-pointer" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/30 hover:bg-green-400 transition-colors cursor-pointer" />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 relative bg-white">
        {children}
      </div>
    </div>
  );
};

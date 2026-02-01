import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-16 md:pt-0 md:pl-64"
      >
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}

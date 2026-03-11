import { motion } from 'motion/react';
import { Flag, Home } from 'lucide-react';
import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8 inline-block"
        >
          <Flag className="w-24 h-24 text-theme-primary" />
        </motion.div>
        
        <h1 className="text-6xl mb-4 telemetry-text text-theme-primary">404</h1>
        <h2 className="text-2xl mb-4">Race Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like you've gone off track. This page doesn't exist in our circuit.
        </p>

        <Link to="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-theme-primary hover:bg-theme-primary/90 text-black rounded-lg transition-all glow-primary telemetry-text"
          >
            <Home className="w-5 h-5" />
            RETURN TO PITS
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}

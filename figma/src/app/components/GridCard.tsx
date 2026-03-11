import { motion } from 'motion/react';
import { Users, Trophy, Shield } from 'lucide-react';
import { Grid } from '../data/mockData';
import { Link } from 'react-router';

interface GridCardProps {
  grid: Grid;
}

export function GridCard({ grid }: GridCardProps) {
  return (
    <Link to={`/grids/${grid.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="grid-panel p-4 rounded-lg hover:border-theme-primary transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3>{grid.name}</h3>
              {grid.isAdmin && (
                <Shield className="w-4 h-4 text-theme-primary" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{grid.members} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground telemetry-text">
            CODE: <span className="text-theme-primary">{grid.code}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

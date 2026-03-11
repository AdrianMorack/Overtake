import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { drivers, Driver } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';

interface DriverSelectorProps {
  label: string;
  value?: string;
  onChange: (driverId: string) => void;
  excludeDrivers?: string[];
}

export function DriverSelector({ label, value, onChange, excludeDrivers = [] }: DriverSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDriver = drivers.find(d => d.id === value);
  
  const filteredDrivers = drivers.filter(d => 
    !excludeDrivers.includes(d.id) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) ||
     d.code.toLowerCase().includes(search.toLowerCase()) ||
     d.team.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (driver: Driver) => {
    onChange(driver.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm mb-2 text-muted-foreground telemetry-text">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:border-theme-primary transition-colors"
      >
        {selectedDriver ? (
          <div className="flex items-center gap-3 flex-1 text-left">
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: selectedDriver.teamColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="telemetry-text text-theme-primary">{selectedDriver.code}</span>
                <span className="text-xs text-muted-foreground">#{selectedDriver.number}</span>
              </div>
              <div className="text-sm">{selectedDriver.name}</div>
              <div className="text-xs text-muted-foreground">{selectedDriver.team}</div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Select driver...</span>
        )}
        <div className="flex items-center gap-2">
          {selectedDriver && (
            <X
              className="w-4 h-4 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <input
                type="text"
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-theme-primary"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-64">
              {filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => handleSelect(driver)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: driver.teamColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="telemetry-text text-theme-primary">{driver.code}</span>
                      <span className="text-xs text-muted-foreground">#{driver.number}</span>
                    </div>
                    <div className="text-sm truncate">{driver.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{driver.team}</div>
                  </div>
                </button>
              ))}
              {filteredDrivers.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No drivers found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

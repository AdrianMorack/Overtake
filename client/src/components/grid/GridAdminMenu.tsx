import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { MoreVertical, Edit2, Users as UsersIcon, Trash2, X, AlertTriangle } from "lucide-react";
import { api } from "../../api/client";

interface GridAdminMenuProps {
  gridId: string;
  gridName: string;
  onUpdate: () => void;
}

export const GridAdminMenu: React.FC<GridAdminMenuProps> = ({ gridId, gridName, onUpdate }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState(gridName);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRename = async () => {
    if (!newName.trim() || newName === gridName) {
      setShowRenameModal(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.updateGrid(gridId, { name: newName.trim() });
      setShowRenameModal(false);
      setMenuOpen(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to rename grid");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.deleteGrid(gridId);
      navigate("/grids");
    } catch (err: any) {
      setError(err.message || "Failed to delete grid");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Grid settings"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-2 panel-header">
                <p className="text-xs text-muted-foreground telemetry-text">GRID SETTINGS</p>
              </div>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left text-sm"
                onClick={() => { setShowRenameModal(true); setMenuOpen(false); }}
              >
                <Edit2 className="w-4 h-4 text-muted-foreground" />
                <span>Rename Grid</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left text-sm"
                onClick={() => { setShowMembersModal(true); setMenuOpen(false); }}
              >
                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                <span>Manage Members</span>
              </button>
              <div className="border-t border-border" />
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors text-left text-sm"
                onClick={() => { setShowDeleteModal(true); setMenuOpen(false); }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Grid</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {showRenameModal && (
          <Modal onClose={() => setShowRenameModal(false)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Rename Grid</h3>
              <button onClick={() => setShowRenameModal(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <label className="block text-xs text-muted-foreground telemetry-text mb-2">GRID NAME</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Grid name"
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors text-sm mb-3"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            {error && (
              <p className="text-red-500 text-xs telemetry-text mb-3">{error}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRenameModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRename}
                disabled={loading || !newName.trim()}
                className="px-4 py-2 text-sm bg-theme-secondary hover:bg-theme-secondary/80 text-theme-secondary-fg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed telemetry-text"
              >
                {loading ? "SAVING…" : "SAVE"}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal
          gridId={gridId}
          onClose={() => setShowMembersModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <Modal onClose={() => { setShowDeleteModal(false); setDeleteConfirmation(""); setError(""); }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg">Delete Grid?</h3>
              </div>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(""); setError(""); }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete <strong className="text-foreground">{gridName}</strong> and all
              associated predictions. This action cannot be undone.
            </p>
            <label className="block text-xs text-muted-foreground telemetry-text mb-2">
              TYPE <span className="text-destructive">DELETE</span> TO CONFIRM
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => { setDeleteConfirmation(e.target.value); setError(""); }}
              placeholder="DELETE"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-destructive transition-colors text-sm mb-3 telemetry-text tracking-widest"
            />
            {error && (
              <p className="text-red-500 text-xs telemetry-text mb-3">{error}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(""); setError(""); }}
                disabled={loading}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                disabled={loading || deleteConfirmation !== "DELETE"}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed telemetry-text"
              >
                {loading ? "DELETING…" : "DELETE GRID"}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Shared Modal wrapper ─────────────────────────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="grid-panel rounded-lg p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── Members Modal ────────────────────────────────────────────────────────── */
interface MembersModalProps {
  gridId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({ gridId, onClose, onUpdate }) => {
  const [grid, setGrid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadGrid();
  }, []);

  const loadGrid = async () => {
    try {
      const data = await api.getGrid(gridId);
      setGrid(data);
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (userId: string) => {
    setKickingUserId(userId);
    setError("");
    try {
      await api.kickMember(gridId, userId);
      await loadGrid();
      onUpdate();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    } finally {
      setKickingUserId(null);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-theme-primary" />
          <h3 className="text-lg">Manage Members</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground telemetry-text text-sm animate-pulse">
          LOADING…
        </div>
      )}
      {error && <p className="text-red-500 text-xs telemetry-text mb-3">{error}</p>}

      {grid && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {grid.memberships.map((membership: any) => (
            <div
              key={membership.userId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {membership.user.avatarUrl ? (
                  <img
                    src={membership.user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-theme-primary/20 rounded-full flex items-center justify-center text-xs text-theme-primary telemetry-text">
                    {membership.user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm">{membership.user.username}</span>
                {membership.userId === grid.ownerId && (
                  <span className="px-1.5 py-0.5 bg-theme-primary/20 border border-theme-primary/30 rounded text-xs text-theme-primary telemetry-text">
                    OWNER
                  </span>
                )}
              </div>
              {membership.userId !== grid.ownerId && (
                <button
                  onClick={() => handleKick(membership.userId)}
                  disabled={kickingUserId === membership.userId}
                  className="px-3 py-1 text-xs text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50 telemetry-text"
                >
                  {kickingUserId === membership.userId ? "REMOVING…" : "REMOVE"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import "../../styles/GridAdminMenu.css";

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
    <div className="grid-admin-menu">
      <button
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Grid settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="menu-dropdown">
            <button
              className="menu-item"
              onClick={() => {
                setShowRenameModal(true);
                setMenuOpen(false);
              }}
            >
              <span>✏️</span> Edit Grid Name
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setShowMembersModal(true);
                setMenuOpen(false);
              }}
            >
              <span>👥</span> Manage Members
            </button>
            <button
              className="menu-item delete"
              onClick={() => {
                setShowDeleteModal(true);
                setMenuOpen(false);
              }}
            >
              <span>🗑️</span> Delete Grid
            </button>
          </div>
        </>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rename Grid</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Grid name"
              maxLength={50}
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button onClick={() => setShowRenameModal(false)} disabled={loading}>
                Cancel
              </button>
              <button onClick={handleRename} disabled={loading} className="primary">
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal
          gridId={gridId}
          onClose={() => setShowMembersModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Grid?</h3>
            <p>
              This will permanently delete <strong>{gridName}</strong> and all associated
              predictions. This action cannot be undone.
            </p>
            <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => {
                setDeleteConfirmation(e.target.value);
                setError("");
              }}
              placeholder="Type DELETE"
              autoFocus
              style={{ fontFamily: 'monospace' }}
            />
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                  setError("");
                }} 
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={loading || deleteConfirmation !== "DELETE"} 
                className="danger"
              >
                {loading ? "Deleting..." : "Delete Grid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MembersModalProps {
  gridId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({ gridId, onClose, onUpdate }) => {
  const [grid, setGrid] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [kickingUserId, setKickingUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
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
    <div className="modal-overlay">
      <div className="modal-content members-modal">
        <h3>Manage Members</h3>
        {loading && <p>Loading...</p>}
        {error && <div className="error-message">{error}</div>}
        {grid && (
          <div className="members-list">
            {grid.memberships.map((membership: any) => (
              <div key={membership.userId} className="member-item">
                <div className="member-info">
                  {membership.user.avatarUrl && (
                    <img src={membership.user.avatarUrl} alt="" className="member-avatar" />
                  )}
                  <span className="member-username">{membership.user.username}</span>
                  {membership.userId === grid.ownerId && <span className="owner-badge">Owner</span>}
                </div>
                {membership.userId !== grid.ownerId && (
                  <button
                    onClick={() => handleKick(membership.userId)}
                    disabled={kickingUserId === membership.userId}
                    className="kick-btn"
                  >
                    {kickingUserId === membership.userId ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

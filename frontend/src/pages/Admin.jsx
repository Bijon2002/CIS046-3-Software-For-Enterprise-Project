import { useEffect, useState } from "react";
import { getAdminDashboard, getAdminUsers, deleteAdminUser, updateUserRole } from "../api/game";
import "../styles/Admin.css";

export default function Admin() {
    const [dashboard, setDashboard] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            const [dashRes, usersRes] = await Promise.all([
                getAdminDashboard(),
                getAdminUsers(),
            ]);
            setDashboard(dashRes.data);
            setUsers(usersRes.data);
            setError("");
        } catch (err) {
            setError(err?.response?.data?.message || "Access denied or failed to load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (userId, nickname) => {
        if (!window.confirm(`Delete user "${nickname}"? This removes all their data.`)) return;
        try {
            await deleteAdminUser(userId);
            loadData();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to delete");
        }
    };

    const handleRoleToggle = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "player" : "admin";
        try {
            await updateUserRole(userId, newRole);
            loadData();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to update role");
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <p>Loading admin panel...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="glass-card" style={{ maxWidth: 500, textAlign: "center" }}>
                    <h2>🔒 Access Denied</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ alignItems: "flex-start", paddingTop: 40 }}>
            <div className="admin-container">
                {/* Dashboard Header */}
                <div className="glass-card">
                    <h2>🛡️ ADMIN PANEL</h2>

                    {/* Stats */}
                    <div className="admin-stats">
                        <div className="admin-stat-card">
                            <div className="admin-stat-value">{dashboard?.totalUsers || 0}</div>
                            <div className="admin-stat-label">Total Users</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-value">{dashboard?.totalGames || 0}</div>
                            <div className="admin-stat-label">Total Games</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-value">{dashboard?.avgScore || 0}</div>
                            <div className="admin-stat-label">Avg Score</div>
                        </div>
                        <div className="admin-stat-card">
                            <div className="admin-stat-value">
                                {dashboard?.topPlayer?.nickname || "—"}
                            </div>
                            <div className="admin-stat-label">Top Player</div>
                        </div>
                    </div>
                </div>

                {/* User Management */}
                <div className="glass-card">
                    <h2>👥 User Management</h2>
                    {users.length === 0 ? (
                        <p style={{ textAlign: "center" }}>No users found</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Nickname</th>
                                        <th>Email</th>
                                        <th>High Score</th>
                                        <th>Games</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id}>
                                            <td style={{ color: "#FFD700" }}>{u.nickname}</td>
                                            <td>{u.email}</td>
                                            <td style={{ color: "#7CFC00" }}>{u.highestScore}</td>
                                            <td>{u.gamesPlayed}</td>
                                            <td>
                                                <span className={`admin-role-badge ${u.role}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="admin-action-btn role-btn"
                                                    onClick={() => handleRoleToggle(u._id, u.role)}
                                                    title={u.role === "admin" ? "Demote to player" : "Promote to admin"}
                                                >
                                                    {u.role === "admin" ? "👤" : "🛡️"}
                                                </button>
                                                <button
                                                    className="admin-action-btn delete-btn"
                                                    onClick={() => handleDelete(u._id, u.nickname)}
                                                    title="Delete user"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Games */}
                <div className="glass-card">
                    <h2>📊 Recent Games</h2>
                    {dashboard?.recentGames?.length ? (
                        <div style={{ overflowX: "auto" }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Difficulty</th>
                                        <th>Score</th>
                                        <th>Solved</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard.recentGames.map((g) => (
                                        <tr key={g._id}>
                                            <td style={{ color: "#FFD700" }}>{g.user?.nickname || "?"}</td>
                                            <td>
                                                <span style={{
                                                    color: g.difficulty === "easy" ? "#7CFC00" :
                                                        g.difficulty === "medium" ? "#FFC107" : "#FF5722",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {g.difficulty}
                                                </span>
                                            </td>
                                            <td style={{ color: "#7CFC00" }}>{g.score}</td>
                                            <td>{g.puzzlesSolved}</td>
                                            <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ textAlign: "center" }}>No games recorded yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

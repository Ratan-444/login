// ---------------------------- FRONTEND ----------------------------
// File: frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://login-3hn2.onrender.com';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [editForm, setEditForm] = useState({ username: '', role: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => setToken(null));
    }
  }, [token]);

  const login = async () => {
    const res = await axios.post(`${API}/login`, form);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
  };

  const register = async () => {
    await axios.post(`${API}/register`, form);
    alert('Registered');
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(res.data);
  };

  const deleteUser = async (id) => {
    await axios.delete(`${API}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ username: user.username, role: user.role });
  };

  const submitEdit = async () => {
    await axios.put(`${API}/users/${editingId}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
    setEditingId(null);
    fetchUsers();
  };

  const createUser = async () => {
    await axios.post(`${API}/users`, form, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  return (
    <div>
      <h1>Auth System with Admin CRUD</h1>
      {!token ? (
        <div>
          <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
          <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
          <select onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={login}>Login</button>
          <button onClick={register}>Register</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {user?.username}</h2>
          <h3>Role: {user?.role}</h3>
          {user?.role === 'admin' && (
            <div>
              <button onClick={fetchUsers}>Fetch All Users</button>
              <h4>Create New User</h4>
              <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
              <input placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
              <select onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={createUser}>Create</button>
              <ul>
                {users.map(u => (
                  <li key={u._id}>
                    {editingId === u._id ? (
                      <span>
                        <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
                        <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={submitEdit}>Save</button>
                      </span>
                    ) : (
                      <span>{u.username} - {u.role}</span>
                    )}
                    <button onClick={() => startEdit(u)}>Edit</button>
                    <button onClick={() => deleteUser(u._id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => { setToken(null); localStorage.removeItem('token'); }}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;






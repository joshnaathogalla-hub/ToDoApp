import React, { useEffect, useMemo, useState } from "react";

function App() {
  // If you have a backend running at this URL, App will sync to it.
  // If not, it will still work with local state.
  const API = "http://localhost:8080/api/todos";

  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const canUseBackend = useMemo(() => true, []);

  useEffect(() => {
    const load = async () => {
      if (!canUseBackend) return;
      setLoading(true);
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Backend not reachable");
        const data = await res.json();
        setTodos(Array.isArray(data) ? data : []);
      } catch {
        // No backend: keep local empty list
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addTodo = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    // Optimistic UI: this guarantees the task appears below immediately.
    const optimistic = {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: trimmed,
      completed: false,
    };
    setTodos((prev) => [optimistic, ...prev]);
    setTitle("");

    if (!canUseBackend) return;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, completed: false }),
      });

      if (!res.ok) throw new Error("POST failed");

      // Refresh from backend to keep ids consistent.
      const listRes = await fetch(API);
      if (listRes.ok) {
        const data = await listRes.json();
        setTodos(Array.isArray(data) ? data : []);
      }
    } catch {
      // No backend: optimistic item remains.
    }
  };

  const deleteTodo = async (id) => {
    // Immediate UI removal
    setTodos((prev) => prev.filter((t) => t.id !== id));

    if (!canUseBackend) return;

    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: 16 }}>
      <h1>Todo App</h1>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task"
          style={{ flex: 1, padding: 8 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTodo();
          }}
        />
        <button onClick={addTodo} style={{ padding: "8px 14px" }}>
          Add
        </button>
      </div>

      {loading ? <p>Loading...</p> : null}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ wordBreak: "break-word" }}>{todo.title}</span>
            <button onClick={() => deleteTodo(todo.id)} style={{ cursor: "pointer" }}>
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;


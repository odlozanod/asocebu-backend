const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Obtener todas las tareas (solo las que no están eliminadas)
app.get('/tasks', async (req, res) => {
  const [rows] = await db.query("SELECT * FROM tasks WHERE deleted_at IS NULL");
  res.json(rows);
});

// Crear una nueva tarea
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  const [result] = await db.query("INSERT INTO tasks (title, completed) VALUES (?, ?)", [title, false]);
  res.json({ id: result.insertId, title, completed: false });
});

// Actualizar tarea (título, estado completado y eliminar si se indica)
app.put('/tasks/:id', async (req, res) => {
  const { title, completed, deleted_at } = req.body;

  // Si se proporciona deleted_at, marcamos la tarea como eliminada
  if (deleted_at) {
    await db.query("UPDATE tasks SET deleted_at = ? WHERE id = ?", [deleted_at, req.params.id]);
    return res.json({ success: true });
  }

  // Si no hay deleted_at, actualizamos el título y el estado completado
  await db.query("UPDATE tasks SET title = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [title, completed, req.params.id]);
  res.json({ success: true });
});

// Eliminar tarea (marcar como eliminada) - esta ruta ya no es necesaria si manejamos la eliminación en la ruta PUT de tareas
app.put('/tasks/:id/delete', async (req, res) => {
  const { deleted_at } = req.body;
  if (deleted_at) {
    await db.query("UPDATE tasks SET deleted_at = ? WHERE id = ?", [deleted_at, req.params.id]);
    return res.json({ success: true });
  }
  res.status(400).json({ message: 'El campo deleted_at es necesario para marcar como eliminada' });
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor backend activo en http://localhost:${process.env.PORT}`);
});

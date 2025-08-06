// routes/heroes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all heroes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM heroes");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET hero by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM heroes WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Hero not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar héroes cuyo nombre contenga un texto
router.get("/api/heroes/search", (req, res) => {
  const search = req.query.name; // ?name=man

  if (!search) {
    return res.status(400).json({ error: "Falta el parámetro 'name'" });
  }

  const sql = "SELECT * FROM heroes WHERE name LIKE ?";
  db.query(sql, [`%${search}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST create new hero
router.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      powerstats,
      appearance,
      biography,
      work,
      connections,
      images,
    } = req.body;
    const [result] = await db.query(
      `INSERT INTO heroes (name, slug, powerstats, appearance, biography, work, connections, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        JSON.stringify(powerstats),
        JSON.stringify(appearance),
        JSON.stringify(biography),
        JSON.stringify(work),
        JSON.stringify(connections),
        JSON.stringify(images),
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update hero
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      slug,
      powerstats,
      appearance,
      biography,
      work,
      connections,
      images,
    } = req.body;
    const [result] = await db.query(
      `UPDATE heroes SET name = ?, slug = ?, powerstats = ?, appearance = ?, biography = ?, work = ?, connections = ?, images = ? WHERE id = ?`,
      [
        name,
        slug,
        JSON.stringify(powerstats),
        JSON.stringify(appearance),
        JSON.stringify(biography),
        JSON.stringify(work),
        JSON.stringify(connections),
        JSON.stringify(images),
        req.params.id,
      ]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Hero not found" });
    res.json({ message: "Hero updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE hero
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM heroes WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Hero not found" });
    res.json({ message: "Hero deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  const heroes = req.body;

  if (!Array.isArray(heroes)) {
    return res.status(400).json({ error: "Se espera un array de héroes" });
  }

  try {
    const values = heroes.map((hero) => [
      hero.name,
      hero.slug,
      JSON.stringify(hero.powerstats),
      JSON.stringify(hero.appearance),
      JSON.stringify(hero.biography),
      JSON.stringify(hero.work),
      JSON.stringify(hero.connections),
      JSON.stringify(hero.images),
    ]);

    const sql = `
      INSERT INTO heroes (name, slug, powerstats, appearance, biography, work, connections, images)
      VALUES ?
    `;

    const [result] = await db.query(sql, [values]);
    res.status(201).json({ inserted: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

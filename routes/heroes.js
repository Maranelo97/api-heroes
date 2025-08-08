const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

function parseIfNeeded(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query("SELECT * FROM _heroes LIMIT $1 OFFSET $2", [
      limit,
      offset,
    ]);
    const rows = result.rows;

    const countResult = await db.query("SELECT COUNT(*) AS total FROM _heroes");
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM _heroes WHERE id = $1", [
      req.params.id,
    ]);
    const rows = result.rows;
    if (rows.length === 0)
      return res.status(404).json({ error: "Hero not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/heroes/search", async (req, res) => {
  const search = req.query.name;

  if (!search) {
    return res.status(400).json({ error: "Falta el parámetro 'name'" });
  }

  try {
    const sql = "SELECT * FROM _heroes WHERE name ILIKE $1"; // ILIKE para case insensitive
    const result = await db.query(sql, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
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

    let finalImages;
    if (req.file) {
      finalImages = { url: `/uploads/${req.file.filename}` };
    } else {
      finalImages = parseIfNeeded(images);
    }

    const insertQuery = `
      INSERT INTO _heroes 
      (name, slug, powerstats, appearance, biography, work, connections, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      name,
      slug,
      JSON.stringify(parseIfNeeded(powerstats)),
      JSON.stringify(parseIfNeeded(appearance)),
      JSON.stringify(parseIfNeeded(biography)),
      JSON.stringify(parseIfNeeded(work)),
      JSON.stringify(parseIfNeeded(connections)),
      JSON.stringify(finalImages),
    ]);

    res.status(201).json({
      id: result.rows[0].id,
      image: finalImages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    const updateQuery = `
      UPDATE _heroes SET
        name = $1,
        slug = $2,
        powerstats = $3,
        appearance = $4,
        biography = $5,
        work = $6,
        connections = $7,
        images = $8
      WHERE id = $9
    `;

    const result = await db.query(updateQuery, [
      name,
      slug,
      JSON.stringify(powerstats),
      JSON.stringify(appearance),
      JSON.stringify(biography),
      JSON.stringify(work),
      JSON.stringify(connections),
      JSON.stringify(images),
      req.params.id,
    ]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Hero not found" });

    res.json({ message: "Hero updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM _heroes WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0)
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
    const values = [];
    const placeholders = heroes
      .map((hero, i) => {
        const idx = i * 8;
        values.push(
          hero.name,
          hero.slug,
          JSON.stringify(hero.powerstats),
          JSON.stringify(hero.appearance),
          JSON.stringify(hero.biography),
          JSON.stringify(hero.work),
          JSON.stringify(hero.connections),
          JSON.stringify(hero.images)
        );
        return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${
          idx + 5
        }, $${idx + 6}, $${idx + 7}, $${idx + 8})`;
      })
      .join(", ");

    const sql = `
      INSERT INTO _heroes (name, slug, powerstats, appearance, biography, work, connections, images)
      VALUES ${placeholders}
    `;

    const result = await db.query(sql, values);
    res.status(201).json({ inserted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

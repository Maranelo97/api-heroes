// server.js
const express = require('express');
const cors = require('cors');
const heroesRoutes = require('./routes/heroes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/heroes', heroesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

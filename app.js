const express = require("express");
const routes = require("./src/routes"); // Автоматично підтягне src/routes/index.js

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Підключаємо всі маршрути з префіксом /api (або без нього, як тобі зручніше)
app.use("/", routes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Сервер СППР: http://localhost:${PORT}`));

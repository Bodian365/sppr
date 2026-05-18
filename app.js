const express = require("express");
const routes = require("./src/routes");

const app = express();

app.use(express.json());

app.use("/api", routes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Сервер СППР: http://localhost:${PORT}`));

const fs = require("fs");
const axios = require("axios");
const importService = require("../services/importService");

class ImportController {
  async importData(req, res) {
    const { method = "mean", mode, url } = req.body;
    let fileContent = "";

    try {
      // 1. Отримуємо контент (URL або Файл)
      if (url && url.startsWith("http")) {
        const response = await axios.get(url);
        fileContent = response.data;
      } else if (req.file) {
        fileContent = fs.readFileSync(req.file.path, "utf8");
      } else {
        return res.status(400).json({ error: "Немає файлу або URL" });
      }

      // 2. Передаємо контент у Сервіс для обробки
      const resultMessage = await importService.processImport(
        fileContent,
        mode,
        method,
      );

      res.json({ message: resultMessage });
    } catch (error) {
      res.status(500).json({ error: "Помилка імпорту: " + error.message });
    } finally {
      // 3. Завжди видаляємо тимчасовий файл, навіть якщо була помилка
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
}

module.exports = new ImportController();

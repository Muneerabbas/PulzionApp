import fs from "fs";
import path from "path";

app.get("/api/data", (req, res) => {
  const filePath = path.join(process.cwd(), "trending_stats.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Could not read file" });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      res.status(500).json({ error: "Invalid JSON format" });
    }
  });
});

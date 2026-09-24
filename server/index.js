import express from "express";
import "dotenv/config";

const app = express();
const port = process.env.port || 3000;

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to MarketLink backend API",
    endpoint: {
      note: "Shares soon",
    },
  });
});

app.listen(port, () => {
  console.log("Server is running on port ", port);
});

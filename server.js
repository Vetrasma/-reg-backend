import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { atlasBlueprint } from "./src/atlas/blueprint.js";

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_USER = {
  username: "admin",
  passwordHash: bcrypt.hashSync("admin123", 10)
};

const JWT_SECRET = process.env.JWT_SECRET || "REG_SECRET_KEY_123";

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER.username) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = bcrypt.compareSync(password, ADMIN_USER.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
});

app.get("/", (req, res) => {
  res.send("R.E.G Backend Online");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "reg-backend",
    system: "ATLAS",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/atlas/blueprint", (req, res) => {
  res.json(atlasBlueprint);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Backend running on port", port));

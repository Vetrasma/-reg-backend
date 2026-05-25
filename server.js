import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const app = express();

const config = (() => {
  const port = Number(process.env.PORT || 3000);
  const nodeEnv = process.env.NODE_ENV || "development";
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("PORT must be a valid positive number");
  }

  if (nodeEnv === "production" && !jwtSecret) {
    throw new Error("JWT_SECRET is required in production");
  }

  if (nodeEnv === "production" && !adminPassword) {
    throw new Error("ADMIN_PASSWORD is required in production");
  }

  if (adminPassword && adminPassword.length < 14) {
    throw new Error("ADMIN_PASSWORD must be at least 14 characters");
  }

  return {
    port,
    nodeEnv,
    jwtSecret: jwtSecret || crypto.randomBytes(48).toString("hex"),
    jwtExpiresIn,
    frontendOrigin,
    adminUsername,
    adminPassword: adminPassword || crypto.randomBytes(24).toString("base64url")
  };
})();

if (!process.env.JWT_SECRET) {
  console.warn("[SECURITY] JWT_SECRET not set; using ephemeral secret for this process.");
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn("[SECURITY] ADMIN_PASSWORD not set; using ephemeral admin password for this process.");
}

const security = {
  maxAttempts: 5,
  blockWindowMs: 15 * 60 * 1000,
  cleanupWindowMs: 60 * 60 * 1000,
  hashRounds: 12
};

const adminUser = {
  username: config.adminUsername,
  passwordHash: bcrypt.hashSync(config.adminPassword, security.hashRounds)
};

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: config.frontendOrigin,
    methods: ["GET", "POST"],
    credentials: true
  })
);
app.use(express.json({ limit: "32kb" }));

const attemptsByIp = new Map();

function getClientIp(req) {
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  return String(raw).split(",")[0].trim();
}

function cleanupAttempts(now) {
  for (const [ip, entry] of attemptsByIp.entries()) {
    if (entry.blockedUntil <= now && entry.lastSeen + security.cleanupWindowMs < now) {
      attemptsByIp.delete(ip);
    }
  }
}

function registerAttempt(ip, success) {
  const now = Date.now();
  cleanupAttempts(now);

  const state = attemptsByIp.get(ip) || { count: 0, blockedUntil: 0, lastSeen: now };
  state.lastSeen = now;

  if (state.blockedUntil > now) {
    attemptsByIp.set(ip, state);
    return { blocked: true, retryInMs: state.blockedUntil - now };
  }

  if (success) {
    attemptsByIp.delete(ip);
    return { blocked: false, retryInMs: 0 };
  }

  state.count += 1;
  if (state.count >= security.maxAttempts) {
    state.count = 0;
    state.blockedUntil = now + security.blockWindowMs;
  }

  attemptsByIp.set(ip, state);
  return { blocked: state.blockedUntil > now, retryInMs: Math.max(state.blockedUntil - now, 0) };
}

function validateCredentials(payload) {
  if (!payload || typeof payload !== "object") {
    return "Payload must be a JSON object";
  }

  const { username, password } = payload;
  if (typeof username !== "string" || typeof password !== "string") {
    return "username and password must be strings";
  }

  if (!username.trim() || !password.trim()) {
    return "username and password are required";
  }

  if (username.length > 120 || password.length > 200) {
    return "username or password too long";
  }

  return null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "R.E.G Backend",
    status: "online",
    environment: config.nodeEnv,
    auth: {
      login: "/api/auth/login",
      me: "/api/auth/me"
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const validationError = validateCredentials(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const ip = getClientIp(req);
  const blockedState = attemptsByIp.get(ip);
  if (blockedState?.blockedUntil && blockedState.blockedUntil > Date.now()) {
    const waitSeconds = Math.ceil((blockedState.blockedUntil - Date.now()) / 1000);
    return res.status(429).json({ error: `Too many attempts. Try again in ${waitSeconds}s` });
  }

  const { username, password } = req.body;
  const userMatches = username === adminUser.username;
  const passMatches = userMatches && bcrypt.compareSync(password, adminUser.passwordHash);

  if (!userMatches || !passMatches) {
    const lock = registerAttempt(ip, false);
    if (lock.blocked) {
      return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(lock.retryInMs / 1000)}s` });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  registerAttempt(ip, true);

  const token = jwt.sign(
    {
      sub: crypto.createHash("sha256").update(adminUser.username).digest("hex"),
      username: adminUser.username,
      role: "admin"
    },
    config.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: config.jwtExpiresIn,
      issuer: "reg-backend",
      audience: "reg-frontend"
    }
  );

  return res.status(200).json({ token, tokenType: "Bearer", expiresIn: config.jwtExpiresIn });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  return res.status(200).json({
    user: {
      username: req.user.username,
      role: req.user.role
    }
  });
});

app.use((_req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
  console.log(`Allowed frontend origin: ${config.frontendOrigin}`);
});

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function extractBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") return null;

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_err) {
    return null;
  }
}

export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
      };
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  req.user = {
    id: payload.sub,
    role: payload.role,
    email: payload.email,
  };
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
}

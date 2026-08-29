export function allowMethods(req, res, methods) {
  res.setHeader("Allow", methods);
  if (!methods.includes(req.method)) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}

export function apiError(res, error) {
  console.error(error);
  const status = error.status ?? 500;
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
}

export function requiredString(value, name, max = 500) {
  if (typeof value !== "string" || !(value = value.trim()) || value.length > max) {
    const error = new Error(`${name} must be a non-empty string up to ${max} characters`);
    error.status = 400;
    throw error;
  }
  return value;
}

export function requireId(value, name) { return requiredString(value, name, 100); }

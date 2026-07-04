const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'pos_token';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the auth cookie from a Next.js Request object (App Router).
 * Returns the decoded user payload or null.
 */
function getUserFromRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

module.exports = { signToken, verifyToken, getUserFromRequest, COOKIE_NAME };

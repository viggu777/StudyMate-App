const admin = require("firebase-admin");

const protect = async (req, res, next) => {
  // Check if the authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token from the header
      const token = req.headers.authorization.split(" ")[1];

      // Verify the token using the Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach the user's information (including UID) to the request object
      req.user = decodedToken;

      // Explicitly call next() and return to pass control to the next handler
      return next();
    } catch (error) {
      // This block runs if the token is expired, invalid, or verification fails
      console.error("TOKEN VERIFICATION FAILED:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  // If the authorization header was missing entirely, send an error
  return res
    .status(401)
    .json({ message: "Not authorized, no token provided." });
};

module.exports = { protect };

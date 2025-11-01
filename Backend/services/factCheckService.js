require("dotenv").config();
const axios = require("axios");

/**
 * factCheckClaims:
 * Accepts a request body with `claims` array, each containing text & claimant info.
 * Simplifies each claim to: text, claimant, reviewRating, publisher, url
 */
const factCheckClaims = async (req, res) => {
  const { claims } = req.body;

  if (!claims || !Array.isArray(claims) || claims.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Claims array is required",
    });
  }

  try {
    // Map over the claims array to simplify each claim
    const simplifiedClaims = claims.map(claim => {
      const review = claim.claimReview?.[0]; // take first review if exists
      return {
        text: claim.text || "",
        claimant: claim.claimant || "",
        reviewRating: review?.textualRating || "Not Verified",
        publisher: review?.publisher?.name || "",
        url: review?.url || "",
      };
    });

    res.status(200).json({
      success: true,
      claims: simplifiedClaims,
    });
  } catch (error) {
    console.error("Fact-check processing error:", error.message);
    res.status(500).json({ success: false, message: "Fact-check failed" });
  }
};

module.exports = { factCheckClaims };

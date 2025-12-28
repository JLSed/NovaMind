require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: EXPO_PUBLIC_GEMINI_API_KEY not found in .env file");
    return;
  }

  console.log("Using API Key:", apiKey.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // For listing models, we don't need a specific model instance,
    // but the SDK doesn't have a direct 'listModels' on the client.
    // We have to use the model manager if available, or just try a known model.
    // Actually, the SDK *does* have it on the GoogleGenerativeAI instance in newer versions,
    // or we might have to use the REST API if the SDK doesn't expose it easily.

    // Let's try a simple generation with 'gemini-pro' to see if *any* model works.
    // If this works, the key is fine.

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("Success! 'gemini-pro' is working.");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Error testing gemini-pro:", error.message);

    // If that failed, let's try to fetch the list of models via REST API to be sure.
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.error);
      } else if (data.models) {
        console.log("\nAvailable Models for this key:");
        data.models.forEach((m) =>
          console.log(`- ${m.name} (${m.supportedGenerationMethods})`)
        );
      } else {
        console.log("Unexpected response:", data);
      }
    } catch (fetchError) {
      console.error("Error fetching model list:", fetchError);
    }
  }
}

listModels();

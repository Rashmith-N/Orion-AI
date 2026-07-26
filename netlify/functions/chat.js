exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (!message || !message.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Message is required"
        })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "GEMINI_API_KEY is missing in Netlify environment variables"
        })
      };
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "You are Orion, a helpful and intelligent AI assistant. " +
                  "Answer clearly and naturally. The user asked: " +
                  message
              }
            ]
          }
        ]
      })
    });

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return {
        statusCode: geminiResponse.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error:
            result.error?.message ||
            "Gemini API returned an error"
        })
      };
    }

    const answer =
      result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Gemini returned no answer"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer: answer
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('[notify] ONESIGNAL_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: "4babeeb8-31f4-4cfa-8a8c-d5c109262d78",
        filters: [{ field: "tag", key: "user_role", relation: "=", value: "guidance" }],
        headings: { en: title },
        contents: { en: message },
        url: "https://qhsafety.vercel.app"
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error('[notify] OneSignal error:', e);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}

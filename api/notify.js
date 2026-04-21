export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url, reasons } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('[notify] ONESIGNAL_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Build the notification URL — deep link to the specific post/consultation
  const notifUrl = url || 'https://qhsafety.vercel.app';

  // Build subtitle from reasons if provided
  const subtitle = reasons && reasons.length > 0
    ? reasons.slice(0, 3).join(' · ')
    : undefined;

  try {
    const body = {
      app_id: "4babeeb8-31f4-4cfa-8a8c-d5c109262d78",
      filters: [{ field: "tag", key: "user_role", relation: "=", value: "guidance" }],
      headings:  { en: title },
      contents:  { en: message },
      url: notifUrl,
      // Show risk reasons as subtitle on iOS/Android
      ...(subtitle && { subtitle: { en: subtitle } }),
      // Large icon for visibility
      large_icon: "https://qhsafety.vercel.app/icon.png",
      // Make it urgent / high priority
      priority: 10,
      android_channel_id: "qhsafety-alerts",
      // Keep notification visible until dismissed
      ttl: 86400,
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error('[notify] OneSignal error:', e);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}

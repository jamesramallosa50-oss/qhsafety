export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url, reasons, target } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('[notify] ONESIGNAL_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const notifUrl = url || 'https://qhsafety.vercel.app';

  const subtitle = reasons && reasons.length > 0
    ? reasons.slice(0, 3).join(' · ')
    : undefined;

  // target = 'guidance' (default) or 'student' (broadcast)
  const role = target === 'student' ? 'student' : 'guidance';

  try {
    const body = {
      app_id: "4babeeb8-31f4-4cfa-8a8c-d5c109262d78",
      filters: [{ field: "tag", key: "user_role", relation: "=", value: role }],
      headings:  { en: title },
      contents:  { en: message },
      url: notifUrl,
      ...(subtitle && { subtitle: { en: subtitle } }),
      large_icon: "https://qhsafety.vercel.app/icon.png",
      priority: 10,
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
export

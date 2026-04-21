export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[analyze] ANTHROPIC_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a school safety AI for a Philippine high school. Analyze student-submitted text for ANY of the following risk categories — be sensitive and broad. It is better to flag a possible problem than to miss a real one.

RISK CATEGORIES TO DETECT (English AND Filipino/Tagalog):
1. Suicidal ideation or self-harm intent (direct or indirect)
2. Non-suicidal self-injury (cutting, burning, hitting oneself)
3. Physical, emotional, or sexual abuse (by family, partner, or anyone)
4. Bullying or cyberbullying (victim or perpetrator)
5. Substance use or addiction (drugs, alcohol, inhalants, vaping)
6. Eating disorders or dangerous diet behaviors (starving, purging, extreme restriction)
7. Sexual harassment, assault, or exploitation (including online)
8. Gang involvement, threats, or violence (as victim or participant)
9. Severe academic pressure or school-related crisis (failing, expulsion fear, cheating pressure)
10. Family crisis (domestic violence, separation trauma, neglect, parental substance abuse)
11. Mental health crisis signs (panic attacks, dissociation, psychosis hints, severe anxiety)
12. Hopelessness, emotional breakdown, or inability to cope
13. Dangerous or illegal behavior (running away, truancy linked to danger, crime exposure)
14. Peer pressure involving harmful activities
15. Identity crisis leading to distress (discrimination, gender-based threats)

SCORING:
- Each detected risk category adds to the score
- Multiple co-occurring categories significantly raise the score
- Vague or indirect distress signals still count (e.g. "I don't know how much longer I can do this")
- Understatement is common — treat hedged language like "maybe I should just disappear" as high risk
- Score 0-2 = Low, 3-6 = Low-Medium, 7-13 = Medium, 14+ = High

Respond ONLY with a valid JSON object, no preamble, no markdown fences.
Return exactly: {"score": <0-20 integer>, "level": <"Low"|"Low-Medium"|"Medium"|"High">, "flagged": <true|false>, "reasons": [<array of short reason strings, one per detected category>]}`,
        messages: [{
          role: "user",
          content: `Analyze this student submission for risk. Be thorough and sensitive — flag anything that could indicate a student in danger or crisis:\n\n${text}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[analyze] Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: 'AI analysis failed', detail: data });
    }

    const raw = (data.content || []).map(i => i.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    if (typeof parsed.score === 'number' && parsed.level && Array.isArray(parsed.reasons)) {
      return res.status(200).json(parsed);
    } else {
      throw new Error('Unexpected response shape from Claude');
    }
  } catch (e) {
    console.error('[analyze] Error:', e);
    return res.status(500).json({ error: 'AI analysis failed' });
  }
}

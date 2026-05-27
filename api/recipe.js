module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { budget, persons, meal, time, diets, ingredients } = req.body;
    const dietText = diets && diets.length > 0 ? `Dieetwensen: ${diets.join(', ')}.` : '';
    const ingredientText = ingredients ? `De gebruiker heeft al in huis: ${ingredients}. Verwerk deze ingrediënten in het recept en neem ze gewoon op in de ingrediëntenlijst — markeer ze niet als speciaal.` : '';
    const prompt = `Jij bent een ervaren Nederlandse kok. Genereer een ${meal}recept voor ${persons} personen, max budget €${budget} totaal, max ${time} minuten. ${dietText} ${ingredientText}

Schrijf in simpele Nederlandse spreektaal. Geen moeilijke kooktermen.

Antwoord ALLEEN in dit JSON formaat, geen andere tekst:
{
  "naam": "naam gerecht",
  "keuken": "type keuken",
  "bereidingstijd": "X minuten",
  "moeilijkheid": "Makkelijk",
  "omschrijving": "1 zin beschrijving",
  "ingredienten": [
    { "naam": "ingredient", "hoeveelheid": "200g", "prijs": "€0.89", "supermarkt_tip": "huismerk AH" }
  ],
  "totaal_prijs": "€X.XX",
  "stappen": ["stap 1", "stap 2", "stap 3"],
  "voedingswaarden": {
    "calorieen": 450,
    "eiwitten": 28,
    "koolhydraten": 52,
    "vetten": 14,
    "vezels": 6
  },
  "tip": "praktische kooktip"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(text));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

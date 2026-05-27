export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { budget, persons, meal, time, diets, ingredients } = req.body;

    const dietText = diets && diets.length > 0 ? `Dieetwensen: ${diets.join(', ')}.` : '';
    const ingredientText = ingredients ? `Gebruik bij voorkeur deze ingrediënten die de gebruiker al heeft: ${ingredients}.` : '';

    const prompt = `Jij bent een ervaren Nederlandse kok die simpel en duidelijk uitlegt. Genereer een ${meal}recept voor ${persons} persoon/personen met een maximaal budget van €${budget} voor alle ingrediënten samen. Kooktijd maximaal ${time === '90' ? 'geen limiet' : time + ' minuten'}. ${dietText} ${ingredientText}

Gebruik ALLEEN simpele, alledaagse Nederlandse woorden. Geen moeilijke kooktermen. Schrijf alsof je het aan een vriend uitlegt.

Antwoord ALLEEN in dit exacte JSON formaat, geen andere tekst of uitleg:
{
  "naam": "naam van het gerecht",
  "keuken": "type keuken",
  "bereidingstijd": "X minuten",
  "moeilijkheid": "Makkelijk",
  "omschrijving": "1 zin beschrijving in gewone taal",
  "ingredienten": [
    { "naam": "ingredient naam", "hoeveelheid": "bijv. 200g", "prijs": "€0.89", "supermarkt_tip": "bijv. huismerk AH" }
  ],
  "totaal_prijs": "€X.XX",
  "stappen": ["stap in simpele taal", "volgende stap"],
  "boodschappenlijst": ["item 1 met gewicht en prijs", "item 2 met gewicht en prijs"],
  "tip": "een simpele praktische kooktip"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(text);
    res.status(200).json(recipe);
  } catch (e) {
    res.status(500).json({ error: 'Er ging iets mis, probeer opnieuw.' });
  }
}

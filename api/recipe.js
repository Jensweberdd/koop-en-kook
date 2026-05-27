module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
 
  if (req.method !== 'POST') return res.status(405).end();
 
  res.setHeader('Access-Control-Allow-Origin', '*');
 
  try {
    const { budget, persons, meal, time, diets, ingredients } = req.body;
 
    const dietText = diets && diets.length > 0 ? `Dieetwensen: ${diets.join(', ')}.` : '';
    const ingredientText = ingredients ? `Gebruik bij voorkeur deze ingrediënten die de gebruiker al heeft: ${ingredients}.` : '';
 
    const prompt = `Jij bent een ervaren Nederlandse kok die simpel en duidelijk uitlegt. Genereer een ${meal}recept voor ${persons} persoon/personen met een maximaal budget van €${budget} voor alle ingrediënten samen. Kooktijd maximaal ${time === '90' ? 'geen limiet' : time + ' minuten'}. ${dietText} ${ingredientText}
 
Gebruik ALLEEN simpele, alledaagse Nederlandse woorden. Geen moeilijke kooktermen.
 
Antwoord ALLEEN in dit exacte JSON formaat, geen andere tekst:
{
  "naam": "naam van het gerecht",
  "keuken": "type keuken",
  "bereidingstijd": "X minuten",
  "moeilijkheid": "Makkelijk",
  "omschrijving": "1 zin beschrijving",
  "ingredienten": [
    { "naam": "ingredient", "hoeveelheid": "200g", "prijs": "€0.89", "supermarkt_tip": "huismerk AH" }
  ],
  "totaal_prijs": "€X.XX",
  "stappen": ["stap 1", "stap 2"],
  "boodschappenlijst": ["item 1 — €0.99", "item 2 — €1.49"],
  "tip": "een simpele kooktip"
}`;
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
 
    const data = await response.json();
    
    if (data.error) {
      console.error('Anthropic error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }
 
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(text);
    res.status(200).json(recipe);
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}

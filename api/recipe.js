module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { budget, persons, meal, time, diets, ingredients } = req.body;
    const dietText = diets && diets.length > 0 ? `Dieetwensen: ${diets.join(', ')}.` : '';
    const ingredientText = ingredients ? `Gebruik: ${ingredients}.` : '';
    const prompt = `Jij bent een Nederlandse kok. Genereer een ${meal}recept voor ${persons} personen, max budget €${budget}, max ${time} minuten. ${dietText} ${ingredientText} Antwoord ALLEEN in JSON: {"naam":"...","keuken":"...","bereidingstijd":"...","moeilijkheid":"Makkelijk","omschrijving":"...","ingredienten":[{"naam":"...","hoeveelheid":"...","prijs":"...","supermarkt_tip":"..."}],"totaal_prijs":"...","stappen":["..."],"boodschappenlijst":["item — €0.00"],"tip":"..."}`;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({model:'claude-sonnet-4-5',max_tokens:1500,messages:[{role:'user',content:prompt}]})
    });
    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g,'').trim();
    res.status(200).json(JSON.parse(text));
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}

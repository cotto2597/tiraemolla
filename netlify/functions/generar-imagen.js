const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error:'Method Not Allowed'}) };
  }

  const OPENAI_KEY = "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";

  let descripcion;
  try {
    descripcion = JSON.parse(event.body).descripcion;
  } catch(e) {
    return { statusCode: 400, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error:'Body inválido'}) };
  }

  const payload = JSON.stringify({
    model: 'dall-e-3',
    prompt: `Icono de producto para una verdulería premium argentina. El producto es: "${descripcion}". Estilo: ilustración flat minimalista sobre fondo negro profundo (#060D04). El producto debe verse realista, colorido y saturado, centrado, ocupando el 65% del encuadre. Sin texto, sin marcos, sin sombras complejas.`,
    n: 1,
    size: '1024x1024',
    response_format: 'url'
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ statusCode: 400, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error: parsed.error.message}) });
          } else {
            resolve({ statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({url: parsed.data?.[0]?.url || null}) });
          }
        } catch(e) {
          resolve({ statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error: 'Error parsing OpenAI response'}) });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error: e.message}) });
    });
    req.write(payload);
    req.end();
  });
};

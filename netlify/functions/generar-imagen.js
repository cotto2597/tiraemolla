const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error:'Method Not Allowed'}) };
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error:'Falta la API key'}) };
  }

  let descripcion;
  try {
    descripcion = JSON.parse(event.body).descripcion;
  } catch(e) {
    return { statusCode: 400, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error:'Body inválido'}) };
  }

  const payload = JSON.stringify({
    model: 'gpt-image-1',
    prompt: `Ilustración digital de "${descripcion}" estilo dibujo animado simpático, similar a los emojis de Apple. Fondo transparente. El objeto centrado, con colores vivos y saturados, líneas suaves, aspecto caricaturesco y amigable. Sin texto, sin sombras duras, sin fondos de color.`,
    n: 1,
    size: '1024x1024'
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
            const url = parsed.data?.[0]?.url || null;
            const b64 = parsed.data?.[0]?.b64_json || null;
            if (url) {
              resolve({ statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({url}) });
            } else if (b64) {
              resolve({ statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({url: `data:image/png;base64,${b64}`}) });
            } else {
              resolve({ statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error: 'No se recibió imagen'}) });
            }
          }
        } catch(e) {
          resolve({ statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({error: 'Error parsing response'}) });
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

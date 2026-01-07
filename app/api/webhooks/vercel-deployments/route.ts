import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-vercel-signature');
  
  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { type, payload } = JSON.parse(body);
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL || "";

  const isFailed = type === 'deployment.error';
  
  await fetch(discordWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: isFailed ? "🚨 Deployment Failed" : "✅ Deployment",
        description: `**${payload.deployment.name}** → ${payload.target || 'preview'}\n[View Deployment](${payload.links.deployment})`,
        color: isFailed ? 0xff0000 : 0x00ff00,
        timestamp: new Date().toISOString(),
      }]
    })
  });

  return new Response('OK', { status: 200 });
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const webhookSecret = process.env.VERCEL_DEPLOYMENT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET not set');
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha1', webhookSecret)
    .update(payload, 'utf8')
    .digest('hex');
    
  return signature === expectedSignature;
}
import crypto from 'crypto';

export async function POST(req: Request) {
  // Get the raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get('x-vercel-signature');
  
  // Verify the webhook signature
  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse the JSON after verification
  const { type, payload } = JSON.parse(body);

  const discordWebhook = process.env.DISCORD_WEBHOOK_URL || "";

  let title = "";
  let message = "";
  let color = 0xff0000;
  
  if (type === 'deployment.error') {
    title = "🚨 Deployment Failed";
    message = `Deployment failed for **${payload.deployment.name}**
- URL: ${payload.deployment.url}
- Target: ${payload.target || 'N/A'}
- Plan: ${payload.plan}
- [View Deployment](${payload.links.deployment})
- [View Project](${payload.links.project})`;
    color = 0xff0000;
  } else {
    title = type;
    message = `Vercel Event: ${type} for **${payload.deployment.name}**
- URL: ${payload.deployment.url}
- Target: ${payload.target || 'N/A'}`;
    color = 0x00ff00;
  }

  await fetch(discordWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: title,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "Project",
            value: payload.deployment.name,
            inline: true
          },
          {
            name: "Target",
            value: payload.target || 'N/A',
            inline: true
          },
          {
            name: "Plan",
            value: payload.plan,
            inline: true
          }
        ]
      }]
    })
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET environment variable is not set');
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha1', webhookSecret)
    .update(payload, 'utf8')
    .digest('hex');
    
  return signature === expectedSignature;
}
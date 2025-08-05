export async function POST(req: Request) {
  const { type, payload } = await req.json();

  const discordWebhook = process.env.DISCORD_WEBHOOK_URL || "";

  let title = "";
  let message = "";
  let color = 0xff0000;
  if (type === 'deployment.error') {
    title = "🚨 Deployment Failed";
    message = `Deployment failed for ${payload.deployment.url}, ${payload.deployment.branch}, ${payload.deployment.commit}`;
    color = 0xff0000;
  } else {
    title = type;
    message = `Verecel Event: ${type} for ${payload.deployment.url}, ${payload.deployment.branch}, ${payload.deployment.commit}`;
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
        timestamp: new Date().toISOString()
      }]
    })
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
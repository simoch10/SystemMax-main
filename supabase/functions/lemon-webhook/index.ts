import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
    const body = await req.json();
    const event = body.meta?.event_name;

    if (event !== "order_created") {
        return new Response("ignored", { status: 200 });
    }

    const email = body.data?.attributes?.user_email;
    const variantName = body.data?.attributes?.first_order_item?.variant_name;

    const { data: keyRow } = await supabase
        .from("licenses")
        .select("id, key")
        .eq("status", "unused")
        .eq("plan", variantName)
        .limit(1)
        .single();

    if (!keyRow) {
        return new Response("no keys available", { status: 500 });
    }

    await supabase
        .from("licenses")
        .update({ status: "active", activated_at: new Date().toISOString() })
        .eq("id", keyRow.id);

    await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "SystemMax <noreply@digitalsupportgroup.digital>",
            to: email,
            subject: `🔑 Your SystemMax License Key — Order ${Date.now()}`,
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
    .body { padding: 40px 40px 20px; }
    .body p { color: #444; line-height: 1.6; }
    .key-box { background: #f0f0ff; border: 2px dashed #6366f1; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
    .key-box span { font-size: 22px; font-weight: bold; color: #6366f1; letter-spacing: 2px; }
    .plan-badge { display: inline-block; background: #6366f1; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 20px; }
    .footer { background: #f4f4f4; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>&#9889; SystemMax</h1>
      <p>Optimizer Pro — License Key</p>
    </div>

    <div class="body">
      <p>Hello,</p>
      <p>Thank you for your purchase! Here is your license key for:</p>

      <div style="text-align:center">
        <span class="plan-badge">&#128230; ${variantName}</span>
      </div>

      <div class="key-box">
        <p style="margin:0 0 8px;color:#666;font-size:13px;">YOUR LICENSE KEY</p>
        <span>${keyRow.key}</span>
      </div>
    </div>

    <div class="footer">
      <p>&#169; 2026 SystemMax. All rights reserved.</p>
      <p>
        <a href="https://digitalsupportgroup.digital/privacy-policy">Privacy Policy</a> &nbsp;|&nbsp;
        <a href="https://digitalsupportgroup.digital/terms">Terms of Service</a> &nbsp;|&nbsp;
        <a href="mailto:groupdigitalpro@gmail.com">Contact Us</a>
      </p>
      <p style="margin-top:10px;font-size:11px;">You received this email because you purchased a SystemMax license.</p>
    </div>

  </div>
</body>
</html>`,
        }),
    });

    return new Response("ok", { status: 200 });
});

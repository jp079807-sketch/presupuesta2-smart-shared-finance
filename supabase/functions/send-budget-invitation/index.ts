import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  invitedEmail: string;
  budgetName: string;
  inviterName: string;
  budgetId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header to validate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client to verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { invitedEmail, budgetName, inviterName, budgetId }: InvitationRequest = await req.json();

    // Validate required fields
    if (!invitedEmail || !budgetName || !budgetId) {
      throw new Error("Missing required fields: invitedEmail, budgetName, budgetId");
    }

    const appUrl = Deno.env.get("APP_URL") || "https://id-preview--3e3806eb-6922-4705-9ca4-de69799927d0.lovable.app";

    console.log(`Sending invitation email to ${invitedEmail} for budget "${budgetName}"`);

    const emailResponse = await resend.emails.send({
      from: "Presupuesto Familiar <onboarding@resend.dev>",
      to: [invitedEmail],
      subject: `${inviterName} te ha invitado a un presupuesto compartido`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a Presupuesto Compartido</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">💰 Presupuesto Compartido</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">¡Hola!</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
              <strong>${inviterName}</strong> te ha invitado a colaborar en el presupuesto compartido 
              <strong>"${budgetName}"</strong>.
            </p>
            
            <p style="font-size: 16px; color: #4b5563;">
              Con un presupuesto compartido podrás:
            </p>
            
            <ul style="color: #4b5563; padding-left: 20px;">
              <li>Ver los ingresos y gastos del hogar</li>
              <li>Registrar gastos compartidos</li>
              <li>Ver la distribución proporcional de aportes</li>
              <li>Gestionar deudas compartidas</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                Aceptar Invitación
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Si no tienes una cuenta, podrás crear una al hacer clic en el botón. 
              La invitación quedará vinculada automáticamente a tu cuenta cuando uses este mismo email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

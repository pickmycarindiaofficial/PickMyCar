import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify PowerDesk permission
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check PowerDesk role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isPowerDesk = roles?.some((r: any) => r.role === "powerdesk");
    if (!isPowerDesk) {
      throw new Error("Only PowerDesk can approve dealers");
    }

    const { applicationId, planId, adminNotes } = await req.json();

    console.log("Approving dealer application:", applicationId);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from("dealer_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      throw new Error("Application not found");
    }

    if (application.status !== "pending") {
      throw new Error("Application is not pending");
    }

    // Generate random password
    const password = crypto.randomUUID().slice(0, 12);

    // Create auth account
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: application.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: application.email.split("@")[0],
        full_name: application.owner_name,
        phone_number: application.phone_number,
      },
    });

    if (createError || !authData.user) {
      console.error("Error creating user:", createError);
      throw new Error("Failed to create dealer account");
    }

    console.log("Created auth user:", authData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        username: application.email.split("@")[0],
        full_name: application.owner_name,
        phone_number: application.phone_number,
        is_active: true,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw new Error("Failed to create dealer profile");
    }

    // Assign dealer role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "dealer",
        assigned_by: user.id,
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error("Failed to assign dealer role");
    }

    // Create dealer profile
    const { error: dealerProfileError } = await supabase
      .from("dealer_profiles")
      .insert({
        id: authData.user.id,
        dealership_name: application.dealership_name,
        business_type: application.business_type,
        gst_number: application.gst_number,
        gst_certificate_url: application.gst_certificate_url,
        shop_registration_url: application.shop_registration_url,
        pan_number: application.pan_number,
        pan_card_url: application.pan_card_url,
        owner_aadhar_url: application.owner_aadhar_url,
        dealer_agreement_url: application.dealer_agreement_url,
        address: application.address,
        city_id: application.city_id,
        state: application.state,
        pincode: application.pincode,
        is_documents_verified: true,
      });

    if (dealerProfileError) {
      console.error("Error creating dealer profile:", dealerProfileError);
      throw new Error("Failed to create dealer business profile");
    }

    // Get plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      throw new Error("Invalid plan");
    }

    // Calculate subscription end date based on billing period
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    switch (plan.billing_period) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "half_yearly":
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case "annual":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Create subscription
    const { error: subError } = await supabase
      .from("dealer_subscriptions")
      .insert({
        dealer_id: authData.user.id,
        plan_id: planId,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: "active",
        manually_activated: true,
        activated_by: user.id,
        activation_notes: adminNotes,
      });

    if (subError) {
      console.error("Error creating subscription:", subError);
      throw new Error("Failed to activate subscription");
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("dealer_applications")
      .update({
        status: "approved",
        dealer_id: authData.user.id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
    }

    // Send welcome email (optional - requires email service)
    console.log("Dealer approved successfully. Email:", application.email, "Password:", password);

    return new Response(
      JSON.stringify({
        success: true,
        dealerId: authData.user.id,
        email: application.email,
        temporaryPassword: password,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in approve-dealer:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

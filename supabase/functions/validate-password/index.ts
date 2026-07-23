import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const checks = [
  { label: "Minimum 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "At least 1 uppercase letter (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "At least 1 number (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "At least 1 special character (@ $ ! % * ? & # ^)", test: (pw: string) => /[@$!%*?&#^]/.test(pw) },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    if (typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Password is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = checks.map((c) => ({ label: c.label, passed: c.test(password) }));
    const score = results.filter((r) => r.passed).length;
    const isStrong = score === checks.length;

    if (!isStrong) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "Password is too weak. Please create a strong password.",
          results,
          score,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, message: "Strong password", results, score }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

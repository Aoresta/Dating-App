import { NextResponse } from "next/server";

type ReviewPayload = {
  full_name?: string;
  age?: number;
  school_name?: string;
  grade?: string;
  religion?: string | null;
  height_cm?: number;
  avatar_url?: string | null;
  email?: string;
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ADMIN_REVIEW_EMAIL || "tejasbansal1809@gmail.com";
  const fromEmail = process.env.ADMIN_REVIEW_FROM_EMAIL || "Amis <login@aoresta.online>";

  if (!resendApiKey) {
    return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  const body = (await request.json()) as ReviewPayload;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #201a19;">
      <h2 style="margin-bottom: 16px;">New Amis signup to review</h2>
      <p><strong>Name:</strong> ${body.full_name || "Not provided"}</p>
      <p><strong>Email:</strong> ${body.email || "Not provided"}</p>
      <p><strong>Age:</strong> ${body.age ?? "Not provided"}</p>
      <p><strong>School:</strong> ${body.school_name || "Not provided"}</p>
      <p><strong>Class:</strong> ${body.grade || "Not provided"}</p>
      <p><strong>Height:</strong> ${body.height_cm ? `${body.height_cm} cm` : "Not provided"}</p>
      <p><strong>Religion:</strong> ${body.religion || "Not provided"}</p>
      ${body.avatar_url ? `<div style="margin-top: 16px;"><p><strong>Cover image:</strong></p><img alt="Cover image" src="${body.avatar_url}" style="max-width: 280px; border-radius: 18px;" /></div>` : ""}
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New Amis signup: ${body.full_name || "Unknown user"}`,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ ok: false, error: errorText }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

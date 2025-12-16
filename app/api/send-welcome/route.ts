import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type WelcomePayload = {
  email: string;
  name: string;
  role: string;
};

function getTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.FROM_EMAIL
  ) {
    throw new Error("Faltan credenciales SMTP para enviar correos.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildBody({ name, role }: WelcomePayload) {
  const roleCopy =
    role === "profesor"
      ? "En tu panel podrás aprobar reservas y dejar comentarios a tus clases."
      : "Ya puedes agendar tus clases y seguir tus confirmaciones.";

  return `
    <div style="font-family: Arial, sans-serif; padding: 24px; border-radius: 18px; background:#fff; border:1px solid #F7CACA;">
      <h2 style="color:#555;">¡Hola ${name || "bienvenido"}!</h2>
      <p style="color:#666;">Tu cuenta fue creada exitosamente y ya formas parte del sistema pastel de reservas.</p>
      <p style="color:#666;">${roleCopy}</p>
      <div style="margin:18px 0;padding:12px 18px;border-radius:999px;background:#F9E7E0;color:#555;display:inline-block;">
        Rol asignado: <strong>${role}</strong>
      </div>
      <p style="font-size:13px;color:#888;">Cualquier duda, responde este correo.</p>
      <p style="color:#777;">Equipo de Reservas Elegantes</p>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WelcomePayload;

    if (!payload.email || !payload.role) {
      return NextResponse.json(
        { error: "Faltan datos para el correo de bienvenida." },
        { status: 400 }
      );
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: payload.email,
      subject: "🎉 ¡Bienvenido al sistema pastel de reservas!",
      html: buildBody(payload),
    });

    return NextResponse.json({ message: "Welcome email sent." }, { status: 200 });
  } catch (error) {
    console.error("Error enviando correo de bienvenida:", error);
    return NextResponse.json(
      { message: "Registro completado, pero el correo de bienvenida falló." },
      { status: 200 }
    );
  }
}


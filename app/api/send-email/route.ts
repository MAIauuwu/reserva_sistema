import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function sendConfirmationEmail(
  recipientEmail: string,
  date: string,
  name: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: recipientEmail,
    subject: `✅ Confirmación de Reserva | ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #B0E0E6; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #333333;">¡Hola ${name}!</h2>
        <p style="color: #555555;">Tu reserva ha sido registrada con éxito y está pendiente de aprobación.</p>
        <p style="color: #555555;"><strong>Detalles de tu Reserva:</strong></p>
        <ul style="list-style: none; padding: 0; background-color: #F0FFF0; padding: 10px; border-radius: 5px;">
          <li style="margin-bottom: 5px;"><strong>Fecha y Hora:</strong> ${new Date(
            date
          ).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}</li>
          <li style="margin-bottom: 5px;"><strong>Estado:</strong> Pendiente</li>
        </ul>
        <p style="color: #555555;">Pronto recibirás un segundo correo con la confirmación final por parte del administrador.</p>
        <p style="margin-top: 20px; color: #777777;">Saludos, <br/>El equipo de Reservas</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(request: Request) {
  try {
    const { email, date, name } = await request.json();

    if (!email || !date || !name) {
      return NextResponse.json(
        { error: "Faltan datos de reserva o contacto." },
        { status: 400 }
      );
    }

    await sendConfirmationEmail(email, date, name);

    return NextResponse.json(
      { message: "Email de confirmación enviado." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return NextResponse.json(
      { message: "Reserva guardada, pero el envío de email falló." },
      { status: 200 }
    );
  }
}


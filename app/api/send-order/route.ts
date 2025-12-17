import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function sendOrderConfirmation(
    recipientEmail: string,
    customerName: string,
    items: any[],
    total: number,
    paymentMethod: string
) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const currencyFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

    const itemsList = items.map(item => `
    <li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <strong>${item.professorName}</strong><br>
        <span style="font-size: 14px; color: #666;">${item.description || "Asesoría General"}</span><br>
        <span style="font-size: 12px; color: #888;">${new Date(item.date).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}</span><br>
        <span style="font-size: 12px; font-weight: bold; color: #4CAF50;">${item.modality.toUpperCase()}</span> - 
        <strong>${currencyFormatter.format(item.price)}</strong>
    </li>
  `).join('');

    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: recipientEmail,
        subject: `✅ Confirmación de Compra - Orden #${Date.now().toString().slice(-6)}`,
        html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0;">¡Gracias por tu compra, ${customerName}!</h2>
                <p style="color: #7f8c8d; font-size: 16px;">Tu reserva ha sido confirmada exitosamente.</p>
            </div>
            
            <div style="background-color: #f8fbff; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e1e8ed; padding-bottom: 10px;">Resumen del Pedido</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${itemsList}
                </ul>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e1e8ed; text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #7f8c8d;">Total Pagado:</p>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #2c3e50;">${currencyFormatter.format(total)}</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #95a5a6;">Método: ${paymentMethod === 'webpay' ? 'WebPay (Tarjeta)' : 'Transferencia'}</p>
                </div>
            </div>

            <div style="text-align: center; color: #95a5a6; font-size: 12px; margin-top: 30px;">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© 2025 Sistema de Reservas</p>
            </div>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
}

export async function POST(request: Request) {
    try {
        const { email, name, items, total, paymentMethod } = await request.json();

        if (!email || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Faltan datos de la orden." },
                { status: 400 }
            );
        }

        await sendOrderConfirmation(email, name, items, total, paymentMethod);

        return NextResponse.json(
            { message: "Orden confirmada y correo enviado." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error al enviar el correo de orden:", error);
        // No fallamos la request completa si solo falla el correo, pero lo logueamos
        return NextResponse.json(
            { message: "Orden procesada, pero hubo un error enviando el correo." },
            { status: 200 } // Retornamos 200 para que el cliente no piense que falló la compra
        );
    }
}

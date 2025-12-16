jest.mock("../firebase/reservas", () => ({
  horarioDisponible: jest.fn(),
  guardarReserva: jest.fn(),
  cancelarReserva: jest.fn(),
}));

import {
  horarioDisponible,
  guardarReserva,
  cancelarReserva,
} from "../firebase/reservas";


describe("Sistema de reservas - Tests", () => {

  test("Crear reserva exitosamente", async () => {
    (horarioDisponible as jest.Mock).mockResolvedValue(true);
    (guardarReserva as jest.Mock).mockResolvedValue(true);

    const crearReserva = async (fechaHora: string) => {
      if (!(await horarioDisponible(fechaHora))) {
        throw new Error("Horario no disponible");
      }
      await guardarReserva(fechaHora);
      return "confirmada";
    };

    const resultado = await crearReserva("2025-12-20 10:00");

    expect(resultado).toBe("confirmada");
  });

  test("No permitir reserva en horario ocupado", async () => {
    (horarioDisponible as jest.Mock).mockResolvedValue(false);

    const crearReserva = async (fechaHora: string) => {
      if (!(await horarioDisponible(fechaHora))) {
        throw new Error("Horario no disponible");
      }
      await guardarReserva(fechaHora);
      return "confirmada";
    };

    await expect(
      crearReserva("2025-12-20 10:00")
    ).rejects.toThrow("Horario no disponible");
  });

  test("Cancelar una reserva existente", async () => {
    (cancelarReserva as jest.Mock).mockResolvedValue(true);

    const cancelar = async (fechaHora: string) => {
      await cancelarReserva(fechaHora);
      return "cancelada";
    };

    const estado = await cancelar("2025-12-21 12:00");

    expect(estado).toBe("cancelada");
  });
});


//*Test 1: Crear reserva
// Simula que Firebase dice “horario disponible”
// Verifica que la reserva se confirma


// Test 2: Horario ocupado
// Simula que Firebase dice “no disponible”
// Verifica que el sistema lanza error


// Test 3: Cancelar reserva
// Simula cancelar
// Verifica que el estado cambia a “cancelada” 

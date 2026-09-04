import { describe, it, expect, beforeEach, vi } from "vitest";
import { Autoregulacion } from "../src/autorregulacion.js";
import { Dialog } from "../src/dialog.js";

describe("Autoregulacion", () => {
  it("devuelve null si pesoActual no es provisto o si rpeReportado es null/undefined", () => {
    expect(Autoregulacion.sugerirProximoPeso(0, 8)).toBeNull();
    expect(Autoregulacion.sugerirProximoPeso(null, 8)).toBeNull();
    expect(Autoregulacion.sugerirProximoPeso(100, null)).toBeNull();
    expect(Autoregulacion.sugerirProximoPeso(100, undefined)).toBeNull();
  });

  it("sugiere subir peso cuando el RPE reportado es menor al objetivo", () => {
    const res = Autoregulacion.sugerirProximoPeso(100, 6, 8, 1.25);
    expect(res).not.toBeNull();
    expect(res.peso).toBe(105);
    expect(res.direccion).toBe("subir");
    expect(res.delta).toBe(5);
  });

  it("sugiere bajar peso cuando el RPE reportado es mayor al objetivo", () => {
    const res = Autoregulacion.sugerirProximoPeso(100, 10, 8, 1.25);
    expect(res).not.toBeNull();
    expect(res.peso).toBe(95);
    expect(res.direccion).toBe("bajar");
    expect(res.delta).toBe(-5);
  });

  it("sugiere mantener peso cuando el RPE reportado coincide con el objetivo", () => {
    const res = Autoregulacion.sugerirProximoPeso(100, 8, 8, 1.25);
    expect(res).not.toBeNull();
    expect(res.peso).toBe(100);
    expect(res.direccion).toBe("mantener");
    expect(res.delta).toBe(0);
  });
});

describe("Dialog (modal)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("confirm resuelve true al pulsar Confirmar", async () => {
    const promesa = Dialog.confirm("¿Deseas continuar?");
    const overlay = document.getElementById("dialogOverlay");
    expect(overlay).toBeTruthy();
    expect(overlay.classList.contains("hidden")).toBe(false);

    const btnConfirmar = document.getElementById("dialogConfirmar");
    btnConfirmar.click();

    const resultado = await promesa;
    expect(resultado).toBe(true);
    expect(overlay.classList.contains("hidden")).toBe(true);
  });

  it("confirm resuelve false al pulsar Cancelar", async () => {
    const promesa = Dialog.confirm("¿Deseas continuar?");
    const btnCancelar = document.getElementById("dialogCancelar");
    btnCancelar.click();

    const resultado = await promesa;
    expect(resultado).toBe(false);
  });

  it("confirmar es un alias de confirm", async () => {
    const promesa = Dialog.confirmar("¿Continuar?");
    document.getElementById("dialogConfirmar").click();
    const resultado = await promesa;
    expect(resultado).toBe(true);
  });

  it("cierra y resuelve false al presionar Escape", async () => {
    const promesa = Dialog.confirm("¿Continuar?");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const resultado = await promesa;
    expect(resultado).toBe(false);
  });

  it("pedirTexto resuelve con el texto ingresado al confirmar", async () => {
    const promesa = Dialog.pedirTexto("Ingresa tu nombre", "Atleta");
    const input = document.getElementById("dialogInput");
    expect(input.classList.contains("hidden")).toBe(false);
    expect(input.value).toBe("Atleta");

    input.value = "  Nuevo Atleta  ";
    document.getElementById("dialogConfirmar").click();

    const resultado = await promesa;
    expect(resultado).toBe("Nuevo Atleta");
  });

  it("pedirTexto resuelve null si se cancela o si el texto está vacío", async () => {
    let promesa = Dialog.pedirTexto("Ingresa algo");
    document.getElementById("dialogCancelar").click();
    expect(await promesa).toBeNull();

    promesa = Dialog.pedirTexto("Ingresa algo");
    const input = document.getElementById("dialogInput");
    input.value = "   ";
    document.getElementById("dialogConfirmar").click();
    expect(await promesa).toBeNull();
  });

  it("pedirTexto confirma al presionar Enter en el input", async () => {
    const promesa = Dialog.pedirTexto("Ingresa algo");
    const input = document.getElementById("dialogInput");
    input.value = "Texto Con Enter";
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(await promesa).toBe("Texto Con Enter");
  });
});

export function computeBmi(heightCm: string, weightKg: string): string {
  const height = Number(String(heightCm).replace(",", "."));
  const weight = Number(String(weightKg).replace(",", "."));
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
    return "";
  }
  const meters = height / 100;
  return (weight / (meters * meters)).toFixed(2);
}

function firstFilled(...values: Array<string | undefined>): string {
  return values.find((value) => String(value ?? "").trim() !== "") ?? "";
}

export function applyBmiToValues(
  values: Record<string, string>
): Record<string, string> {
  const bmi = computeBmi(
    firstFilled(values.height, values["Рост"]),
    firstFilled(values.weight, values["Вес"])
  );
  return { ...values, bmi, ИМТ: bmi };
}

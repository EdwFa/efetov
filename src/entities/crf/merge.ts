import type { Field } from "@/entities/patient/types";
import { computeBmi } from "./computed";
import {
  CRF_SCHEMA,
  fieldByKey,
  fieldNames,
  fieldsOf,
  normalizeHeader,
  type CrfFieldSchema,
} from "./schema";

function storedNameSet(field: CrfFieldSchema): Set<string> {
  return new Set(fieldNames(field).map((name) => normalizeHeader(name)));
}

export function matchStoredField(
  stored: Field[],
  field: CrfFieldSchema
): Field | undefined {
  const names = storedNameSet(field);
  return stored.find((item) => names.has(normalizeHeader(item.name)));
}

export function mergeBlock(block: string, stored: Field[] = []): Field[] {
  const used = new Set<Field>();
  const merged: Field[] = fieldsOf(block).map((field) => {
    const found = matchStoredField(stored, field);
    if (found) used.add(found);
    return {
      key: field.key,
      name: field.label,
      value: found?.value ?? "",
      hint: field.hint ?? found?.hint,
    };
  });
  const extras = stored.filter((item) => !used.has(item));
  return [...merged, ...extras];
}

export function getFieldValueByKey(
  blocks: Record<string, Field[]>,
  key: string
): string {
  const schema = CRF_SCHEMA.find((field) => field.key === key);
  if (!schema) return "";
  const found = matchStoredField(blocks[schema.block] || [], schema);
  return found?.value ?? "";
}

export function withComputed(fields: Field[]): Field[] {
  const height = fieldByKey("height");
  const weight = fieldByKey("weight");
  if (!height || !weight) return fields;
  const bmi = computeBmi(
    matchStoredField(fields, height)?.value ?? "",
    matchStoredField(fields, weight)?.value ?? ""
  );
  return fields.map((field) =>
    field.key === "bmi" || field.name === "ИМТ"
      ? { ...field, value: bmi || field.value }
      : field
  );
}

export function applyBlockValues(
  block: string,
  stored: Field[],
  values: Record<string, string>
): Field[] {
  return withComputed(
    mergeBlock(block, stored).map((field) => ({
      ...field,
      value: values[field.name] ?? values[field.key ?? ""] ?? field.value,
    }))
  );
}

export function resolveFieldValue(
  blocks: Record<string, Field[]>,
  key: string
): string {
  const stored = getFieldValueByKey(blocks, key);
  if (key === "bmi") {
    return (
      computeBmi(
        getFieldValueByKey(blocks, "height"),
        getFieldValueByKey(blocks, "weight")
      ) || stored
    );
  }
  return stored;
}

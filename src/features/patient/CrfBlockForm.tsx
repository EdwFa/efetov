import type { Field } from "@/entities/patient/types";
import { fieldByKey } from "@/entities/crf/schema";
import { Badge, Button, Card, FieldControl } from "@/shared/ui";

export function CrfBlockForm({
  block,
  fields,
  values,
  editable,
  onChange,
  onSave,
  onBack,
}: {
  block: string;
  fields: Field[];
  values: Record<string, string>;
  editable: boolean;
  onChange: (name: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{block}</h2>
          <p className="mt-1 text-slate-500">
            {editable
              ? "Поля доступны для редактирования текущей роли. При сохранении данные меняются в демо-хранилище."
              : "Только просмотр для текущей роли."}
          </p>
        </div>
        <Badge tone={editable ? "green" : "slate"}>
          {editable ? "редактирование" : "только просмотр"}
        </Badge>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {fields.map((field) => {
          const computed = Boolean(
            field.key && fieldByKey(field.key)?.computedFrom
          );
          return (
            <FieldControl
              key={field.key || field.name}
              name={field.name}
              value={values[field.name] ?? field.value ?? ""}
              hint={field.hint}
              editable={editable && !computed}
              onChange={(value) => onChange(field.name, value)}
            />
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={!editable} onClick={onSave}>
          Сохранить
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Назад в журнал
        </Button>
      </div>
    </Card>
  );
}

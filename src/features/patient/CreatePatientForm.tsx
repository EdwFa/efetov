import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import { useRuntime } from "@/api/useRuntime";
import { applyBmiToValues } from "@/entities/crf/computed";
import { fieldsOfSection } from "@/entities/crf/schema";
import { CRF_SECTIONS, sectionLabel } from "@/entities/crf/sections";
import { CENTERS, centerCode, nextCode, nextPatientId } from "@/entities/patient/code";
import { useAuth } from "@/features/auth/useAuth";
import { setUnsavedChanges } from "@/features/patient/unsaved";
import { now } from "@/shared/lib/dates";
import {
  Button,
  Card,
  FieldControl,
  Kpi,
  Label,
  Select,
  TextInput,
} from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function CreatePatientForm({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { patients } = useRuntime();
  const { showToast } = useToast();
  const nextId = nextPatientId(patients.map((item) => item.id));
  const [center, setCenter] = useState<string>(CENTERS[0]);
  const [code, setCode] = useState(nextCode(nextId, "С"));
  const [operationDate, setOperationDate] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const previewCode = useMemo(
    () => nextCode(nextId, centerCode(center)),
    [center, nextId]
  );
  const dirty =
    center !== CENTERS[0] ||
    code !== nextCode(nextId, centerCode(CENTERS[0])) ||
    operationDate.trim() !== "" ||
    Object.values(values).some((value) => value.trim() !== "");

  useEffect(() => {
    setUnsavedChanges(dirty);
  }, [dirty]);

  useEffect(() => () => setUnsavedChanges(false), []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const created = await tryApi(
      () =>
        api.createPatient(user, {
          code,
          center,
          operationDate,
          values,
        }),
      (error) => showToast(error.message)
    );
    if (!created.ok) return;
    showToast("Карточка добавлена в общий журнал");
    onCreated(created.value.id);
  };

  return (
    <>
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Kpi title="Новый ID" value={nextId} note="автоматически" />
        <Kpi
          title="Шифр пациента"
          value={previewCode}
          note="задается отдельно от ID"
          tone="green"
        />
        <Kpi
          title="Автор"
          value={user?.id || "—"}
          note="фиксируется при сохранении"
        />
        <Kpi
          title="Дата и время"
          value={now()}
          note="фиксируется при сохранении"
          tone="amber"
        />
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <Card className="p-5">
          <h2 className="text-base font-black text-slate-900">
            Ключевые поля общего журнала
          </h2>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div>
              <Label>ID</Label>
              <TextInput value={nextId} disabled />
            </div>
            <div>
              <Label>Шифр</Label>
              <TextInput value={code} onChange={(event) => setCode(event.target.value)} />
            </div>
            <div>
              <Label>Группа/центр</Label>
              <Select
                value={center}
                onChange={(event) => {
                  const nextCenter = event.target.value;
                  setCenter(nextCenter);
                  setCode(nextCode(nextId, centerCode(nextCenter)));
                }}
              >
                {CENTERS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Дата операции</Label>
              <TextInput
                value={operationDate}
                placeholder="дд.мм.гггг"
                onChange={(event) => setOperationDate(event.target.value)}
              />
            </div>
          </div>
        </Card>
        {CRF_SECTIONS.filter((section) => section.id <= 10).map((section) => {
          const fields = fieldsOfSection(section.id);
          if (fields.length === 0) return null;
          return (
            <Card key={section.id} className="p-5">
              <h2 className="text-base font-black text-slate-900">
                {sectionLabel(section.id)}
              </h2>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                {fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    name={field.label}
                    value={values[field.key] || ""}
                    hint={field.hint}
                    editable={!field.computedFrom}
                    onChange={(value) =>
                      setValues((current) =>
                        applyBmiToValues({
                          ...current,
                          [field.key]: value,
                        })
                      )
                    }
                  />
                ))}
              </div>
            </Card>
          );
        })}
        <Card className="bg-slate-50 p-5">
          <h2 className="text-base font-black text-slate-900">
            Разделы 11–15
          </h2>
          <p className="mt-2 text-slate-500">
            При создании карточки эти разделы не заполняются. Их редактирует врач
            амбулатории или руководитель в уже созданной карточке.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Сохранить карточку</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </>
  );
}

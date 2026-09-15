import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/mock";
import { CREATE_BLOCKS, fieldKey } from "@/entities/crf/blocks";
import { CENTERS, centerCode, nextCode, nextPatientId } from "@/entities/patient/code";
import { useAuth } from "@/features/auth/useAuth";
import { useRuntime } from "@/api/useRuntime";
import { now } from "@/shared/lib/dates";
import {
  Button,
  Card,
  FieldControl,
  Kpi,
  Label,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function PatientNewPage() {
  const { user, pwr } = useAuth();
  const { patients } = useRuntime();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const nextId = nextPatientId(patients.map((item) => item.id));
  const [center, setCenter] = useState<string>(CENTERS[0]);
  const [code, setCode] = useState(nextCode(nextId, "С"));
  const [operationDate, setOperationDate] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const previewCode = useMemo(
    () => nextCode(nextId, centerCode(center)),
    [center, nextId]
  );

  if (!pwr.canCreate) {
    return (
      <PageHeader
        title="Создание карточки пациента"
        description="Создание карты пациента доступно врачу стационара и руководителю."
      />
    );
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const created = api.createPatient(user, {
      code,
      center,
      operationDate,
      values,
    });
    showToast("Карточка добавлена в общий журнал");
    navigate(`/patients/${created.id}`);
  };

  return (
    <>
      <PageHeader
        title="Создание карточки пациента"
        description="Отдельная форма создания. При сохранении карточка добавляется в общий журнал; фиксируются автор, логин автора и дата/время создания."
      />
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Kpi title="Новый ID" value={nextId} note="автоматически" />
        <Kpi
          title="Шифр пациента"
          value={previewCode}
          note="вариант A: ID и шифр отдельно"
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
        {Object.entries(CREATE_BLOCKS)
          .filter(([block]) => block !== "Послеоперационные наблюдения")
          .map(([block, fields], index) => (
            <Card key={block} className="p-5">
              <h2 className="text-base font-black text-slate-900">
                {index + 1}. {block}
              </h2>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                {fields.map((name) => (
                  <FieldControl
                    key={name}
                    name={name}
                    value={values[fieldKey(block, name)] || ""}
                    editable
                    onChange={(value) =>
                      setValues((current) => ({
                        ...current,
                        [fieldKey(block, name)]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </Card>
          ))}
        <Card className="bg-slate-50 p-5">
          <h2 className="text-base font-black text-slate-900">
            5. Послеоперационные наблюдения
          </h2>
          <p className="mt-2 text-slate-500">
            Этот блок не заполняется при первичном создании карточки. Блок будет
            доступен врачу амбулатории и руководителю в карточке пациента.
          </p>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Сохранить карточку</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/journal")}
          >
            Отмена
          </Button>
        </div>
      </form>
    </>
  );
}

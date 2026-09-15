import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/mock";
import { useRuntime } from "@/api/useRuntime";
import { CRF_BLOCK_ORDER } from "@/entities/crf/blocks";
import { canEditBlock, canViewBlock } from "@/entities/user/roles";
import { useAuth } from "@/features/auth/useAuth";
import {
  Badge,
  Button,
  Card,
  FieldControl,
  Kpi,
  Modal,
  PageHeader,
} from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function PatientCardPage() {
  const { id } = useParams();
  const { patients } = useRuntime();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const currentPatient = patients.find((item) => item.id === id);
  const visibleBlocks = CRF_BLOCK_ORDER.filter((block) =>
    canViewBlock(user?.role, block)
  );
  const [activeBlock, setActiveBlock] = useState(visibleBlocks[0] || "Общие данные");
  const [values, setValues] = useState<Record<string, string>>({});
  const [leaderEditOpen, setLeaderEditOpen] = useState(false);

  const block = visibleBlocks.includes(activeBlock)
    ? activeBlock
    : visibleBlocks[0] || "Общие данные";
  const editable = canEditBlock(user?.role, block);
  const fields = currentPatient?.blocks[block] || [];

  useEffect(() => {
    if (activeBlock !== block) setActiveBlock(block);
  }, [activeBlock, block]);

  useEffect(() => {
    if (!currentPatient) return;
    const next: Record<string, string> = {};
    (currentPatient.blocks[block] || []).forEach((field) => {
      next[field.name] = field.value ?? "";
    });
    setValues(next);
  }, [currentPatient, block]);

  if (!currentPatient) {
    return (
      <PageHeader title="Карточка пациента" description="Нет доступных карточек." />
    );
  }

  const creator =
    currentPatient.createdByLogin ||
    currentPatient.createdByName ||
    currentPatient.createdBy ||
    "неизвестный пользователь";

  const applySave = () => {
    if (!user) return;
    api.savePatientBlock(user, currentPatient.id, block, values);
    setLeaderEditOpen(false);
    showToast("Изменения сохранены в карточке пациента");
  };

  const requestSave = () => {
    if (!user || !editable) {
      showToast("Редактирование блока недоступно");
      return;
    }
    if (user.role === "leader" && currentPatient.createdBy !== user.id) {
      setLeaderEditOpen(true);
      return;
    }
    applySave();
  };

  return (
    <>
      <PageHeader
        title="Карточка пациента"
        description="CRF состоит из 5 блоков. Доступность просмотра и редактирования зависит от роли пользователя."
      />
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Kpi title="ID" value={currentPatient.id} note="ключевое поле журнала" />
        <Kpi
          title="Шифр"
          value={currentPatient.code}
          note="код исследования"
          tone="green"
        />
        <Kpi
          title="Группа/центр"
          value={currentPatient.center}
          note="ключевое поле журнала"
        />
        <Kpi
          title="Дата операции"
          value={currentPatient.operationDate}
          note="ключевое поле журнала"
          tone="amber"
        />
      </div>
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap gap-2">
          {CRF_BLOCK_ORDER.map((item) => (
            <Button
              key={item}
              variant={block === item ? "primary" : "secondary"}
              disabled={!canViewBlock(user?.role, item)}
              onClick={() => setActiveBlock(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </Card>
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
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              name={field.name}
              value={values[field.name] ?? field.value ?? ""}
              hint={field.hint}
              editable={editable}
              onChange={(value) =>
                setValues((current) => ({ ...current, [field.name]: value }))
              }
            />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={!editable} onClick={requestSave}>
            Сохранить
          </Button>
          <Button variant="secondary" onClick={() => navigate("/journal")}>
            Назад в журнал
          </Button>
        </div>
      </Card>
      {leaderEditOpen ? (
        <Modal onClose={() => setLeaderEditOpen(false)}>
          <Card className="p-6">
            <h2 className="text-xl font-black">Подтверждение редактирования</h2>
            <p className="mt-3 text-slate-700">
              Вы уверены, что хотите внести изменения? Данные о пациенте были
              внесены другим пользователем – <b>{creator}</b>.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setLeaderEditOpen(false)}>
                Отмена
              </Button>
              <Button onClick={applySave}>Внести исправления</Button>
            </div>
          </Card>
        </Modal>
      ) : null}
    </>
  );
}

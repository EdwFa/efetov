import { useEffect, useState } from "react";
import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import { useRuntime } from "@/api/useRuntime";
import { CRF_BLOCK_ORDER } from "@/entities/crf/blocks";
import { applyBmiToValues } from "@/entities/crf/computed";
import { mergeBlock, withComputed } from "@/entities/crf/merge";
import {
  holdsLock,
  isLockedByOther,
  LOCK_FREE,
  lockOwnerId,
} from "@/entities/patient/lock";
import { canEditBlock, canViewBlock } from "@/entities/user/roles";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/shared/ui/toast";

export function usePatientCard(id: string | undefined) {
  const { patients } = useRuntime();
  const { user } = useAuth();
  const { showToast } = useToast();
  const patient = patients.find((item) => item.id === id);
  const visibleBlocks: string[] = CRF_BLOCK_ORDER.filter((block) =>
    canViewBlock(user?.role, block)
  );
  const [activeBlock, setActiveBlock] = useState<string>(
    visibleBlocks[0] || "Общие данные"
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [leaderEditOpen, setLeaderEditOpen] = useState(false);

  const block = visibleBlocks.includes(activeBlock)
    ? activeBlock
    : visibleBlocks[0] || "Общие данные";
  const lockedByOther = isLockedByOther(patient?.lock, user?.id);
  const ownsLock = holdsLock(patient?.lock, user?.id);
  const lockOwner = lockOwnerId(patient?.lock);
  const editable = canEditBlock(user?.role, block) && !lockedByOther;
  const fields = patient
    ? withComputed(mergeBlock(block, patient.blocks[block] || []))
    : [];

  useEffect(() => {
    if (activeBlock !== block) setActiveBlock(block);
  }, [activeBlock, block]);

  useEffect(() => {
    if (!patient) return;
    const next: Record<string, string> = {};
    withComputed(mergeBlock(block, patient.blocks[block] || [])).forEach(
      (field) => {
        next[field.name] = field.value ?? "";
        if (field.key) next[field.key] = field.value ?? "";
      }
    );
    setValues(next);
  }, [patient, block]);

  const creator =
    patient?.createdByLogin ||
    patient?.createdByName ||
    patient?.createdBy ||
    "неизвестный пользователь";

  const applySave = async () => {
    if (!user || !patient) return;
    const saved = await tryApi(
      () => api.savePatientBlock(user, patient.id, block, values),
      (error) => showToast(error.message)
    );
    if (!saved.ok) return;
    setLeaderEditOpen(false);
    showToast("Изменения сохранены в карточке пациента");
  };

  const requestSave = () => {
    if (!user || !patient || !editable) {
      showToast(
        lockedByOther
          ? `Карточка редактируется пользователем ${lockOwner}`
          : "Редактирование блока недоступно"
      );
      return;
    }
    if (user.role === "leader" && patient.createdBy !== user.id) {
      setLeaderEditOpen(true);
      return;
    }
    applySave();
  };

  const takeLock = async () => {
    if (!user || !patient) return;
    const locked = await tryApi(
      () => api.lockPatient(user, patient.id),
      (error) => showToast(error.message)
    );
    if (locked.ok) showToast("Карточка взята в работу");
  };

  const releaseLock = async () => {
    if (!user || !patient) return;
    const unlocked = await tryApi(
      () => api.unlockPatient(user, patient.id),
      (error) => showToast(error.message)
    );
    if (unlocked.ok) showToast("Блокировка снята");
  };

  return {
    patient,
    block,
    fields,
    values,
    editable,
    lockedByOther,
    ownsLock,
    lockLabel: patient?.lock || LOCK_FREE,
    canTakeLock: Boolean(
      user && patient && (!lockOwner || user.role === "leader") && !ownsLock
    ),
    canReleaseLock: Boolean(
      user && patient && lockOwner && (ownsLock || user.role === "leader")
    ),
    creator,
    leaderEditOpen,
    setActiveBlock,
    setField: (name: string, value: string) =>
      setValues((current) => {
        const field = fields.find((item) => item.name === name);
        const next = { ...current, [name]: value };
        if (field?.key) next[field.key] = value;
        return applyBmiToValues(next);
      }),
    requestSave,
    applySave,
    closeLeaderEdit: () => setLeaderEditOpen(false),
    takeLock,
    releaseLock,
  };
}

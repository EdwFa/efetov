import { useEffect, useState } from "react";
import { api } from "@/api/mock";
import { tryApi } from "@/api/errors";
import { useRuntime } from "@/api/useRuntime";
import { applyBmiToValues } from "@/entities/crf/computed";
import { mergeSection, withComputed } from "@/entities/crf/merge";
import { sectionById, sectionLabel } from "@/entities/crf/sections";
import {
  holdsLock,
  isLockedByOther,
  LOCK_FREE,
  lockOwnerId,
} from "@/entities/patient/lock";
import type { Patient } from "@/entities/patient/types";
import { canEditSection, visibleSectionIds } from "@/entities/user/roles";
import { useAuth } from "@/features/auth/useAuth";
import { setUnsavedChanges } from "@/features/patient/unsaved";
import { useToast } from "@/shared/ui/toast";

function sectionValues(patient: Patient, sectionId: number): Record<string, string> {
  const next: Record<string, string> = {};
  withComputed(mergeSection(sectionId, patient.blocks)).forEach((field) => {
    if (field.key) next[field.key] = field.value ?? "";
  });
  return next;
}

export function usePatientCard(id: string | undefined) {
  const { patients } = useRuntime();
  const { user } = useAuth();
  const { showToast } = useToast();
  const patient = patients.find((item) => item.id === id);
  const visibleSections = visibleSectionIds(user?.role);
  const [activeSection, setActiveSection] = useState<number>(
    visibleSections[0] ?? 1
  );
  const [drafts, setDrafts] = useState<Record<number, Record<string, string>>>({});
  const [leaderEditOpen, setLeaderEditOpen] = useState(false);

  const sectionId = visibleSections.includes(activeSection)
    ? activeSection
    : visibleSections[0] ?? 1;
  const lockedByOther = isLockedByOther(patient?.lock, user?.id);
  const ownsLock = holdsLock(patient?.lock, user?.id);
  const lockOwner = lockOwnerId(patient?.lock);
  const editable = canEditSection(user?.role, sectionId) && !lockedByOther;
  const fields = patient
    ? withComputed(mergeSection(sectionId, patient.blocks))
    : [];
  const values = patient
    ? drafts[sectionId] ?? sectionValues(patient, sectionId)
    : {};
  const canSave = Boolean(
    user &&
      patient &&
      !lockedByOther &&
      (editable ||
        Object.keys(drafts).some((key) => canEditSection(user.role, Number(key))))
  );

  useEffect(() => {
    setDrafts({});
    setLeaderEditOpen(false);
  }, [id]);

  useEffect(() => {
    setUnsavedChanges(Object.keys(drafts).length > 0);
  }, [drafts]);

  useEffect(() => () => setUnsavedChanges(false), []);

  useEffect(() => {
    if (activeSection !== sectionId) setActiveSection(sectionId);
  }, [activeSection, sectionId]);

  const creator =
    patient?.createdByLogin ||
    patient?.createdByName ||
    patient?.createdBy ||
    "неизвестный пользователь";

  const sectionsToSave = (): Record<number, Record<string, string>> => {
    if (!user) return {};
    const payload: Record<number, Record<string, string>> = {};
    Object.entries(drafts).forEach(([key, draft]) => {
      const section = Number(key);
      if (canEditSection(user.role, section)) payload[section] = draft;
    });
    return payload;
  };

  const applySave = async () => {
    if (!user || !patient) return;
    const payload = sectionsToSave();
    if (Object.keys(payload).length === 0) {
      showToast("Нет изменений для сохранения");
      setLeaderEditOpen(false);
      return;
    }
    try {
      const saved = await tryApi(
        () => api.savePatientSections(user, patient.id, payload),
        (error) => showToast(error.message)
      );
      if (!saved.ok) return;
      setDrafts({});
      setLeaderEditOpen(false);
      showToast("Изменения сохранены в карточке пациента");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось сохранить карточку");
    }
  };

  const requestSave = () => {
    if (!user || !patient || !canSave) {
      showToast(
        lockedByOther
          ? `Карточка редактируется пользователем ${lockOwner}`
          : "Редактирование раздела недоступно"
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
    sectionId,
    sectionLabel: sectionById(sectionId)
      ? sectionLabel(sectionId)
      : "Раздел",
    fields,
    values,
    editable,
    canSave,
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
    setActiveSection,
    setField: (key: string, value: string) => {
      if (!patient || !canEditSection(user?.role, sectionId)) return;
      setDrafts((current) => {
        const base = current[sectionId] ?? sectionValues(patient, sectionId);
        const next = { ...base, [key]: value };
        const touchesAnthropometry = key === "height" || key === "weight";
        return {
          ...current,
          [sectionId]: touchesAnthropometry ? applyBmiToValues(next) : next,
        };
      });
    },
    requestSave,
    applySave,
    closeLeaderEdit: () => setLeaderEditOpen(false),
    takeLock,
    releaseLock,
  };
}

import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { CrfBlockForm } from "@/features/patient/CrfBlockForm";
import { CrfTabs } from "@/features/patient/CrfTabs";
import { LeaderEditConfirm } from "@/features/patient/LeaderEditConfirm";
import { PatientHeader } from "@/features/patient/PatientHeader";
import { PatientLockBar } from "@/features/patient/PatientLockBar";
import { usePatientCard } from "@/features/patient/usePatientCard";
import { PageHeader } from "@/shared/ui";

export function PatientCardPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const card = usePatientCard(id);

  if (!card.patient) {
    return (
      <PageHeader title="Карточка пациента" description="Нет доступных карточек." />
    );
  }

  return (
    <>
      <PageHeader
        title="Карточка пациента"
        description="CRF состоит из 5 блоков. Доступность просмотра и редактирования зависит от роли пользователя."
      />
      <PatientHeader patient={card.patient} />
      <PatientLockBar
        lockLabel={card.lockLabel}
        lockedByOther={card.lockedByOther}
        holdsLock={card.ownsLock}
        canTake={card.canTakeLock}
        canRelease={card.canReleaseLock}
        onTake={card.takeLock}
        onRelease={card.releaseLock}
      />
      <CrfTabs
        role={user?.role}
        active={card.block}
        onChange={card.setActiveBlock}
      />
      <CrfBlockForm
        block={card.block}
        fields={card.fields}
        values={card.values}
        editable={card.editable}
        onChange={card.setField}
        onSave={card.requestSave}
        onBack={() => navigate("/journal")}
      />
      {card.leaderEditOpen ? (
        <LeaderEditConfirm
          creator={card.creator}
          onCancel={card.closeLeaderEdit}
          onConfirm={card.applySave}
        />
      ) : null}
    </>
  );
}

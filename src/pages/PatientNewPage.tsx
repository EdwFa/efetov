import { useNavigate } from "react-router-dom";
import { CreatePatientForm } from "@/features/patient/CreatePatientForm";
import { useAuth } from "@/features/auth/useAuth";
import { PageHeader } from "@/shared/ui";

export function PatientNewPage() {
  const { pwr } = useAuth();
  const navigate = useNavigate();

  if (!pwr.canCreate) {
    return (
      <PageHeader
        title="Создание карточки пациента"
        description="Создание карты пациента доступно врачу стационара и руководителю."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Создание карточки пациента"
        description="Отдельная форма создания. При сохранении карточка добавляется в общий журнал; фиксируются автор, логин автора и дата/время создания."
      />
      <CreatePatientForm
        onCreated={(id) => navigate(`/patients/${id}`)}
        onCancel={() => navigate("/journal")}
      />
    </>
  );
}

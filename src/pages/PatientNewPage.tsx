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
        description="После сохранения карточка появляется в общем журнале."
      />
      <CreatePatientForm
        onCreated={(id) => navigate(`/patients/${id}`)}
        onCancel={() => navigate("/journal")}
      />
    </>
  );
}

import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/Field";
import { PageTitle, Panel } from "@/components/admin/ui";
import { ROLE_LABELS } from "@/lib/permissions";
import { requirePage } from "@/server/auth";
import { changeOwnPassword } from "../../actions/settings";

export const metadata = { title: "Hesabım" };

export default async function AccountPage() {
  const user = await requirePage();
  return (
    <>
      <PageTitle title="Hesabım" description={`${user.name} · ${user.email} · ${ROLE_LABELS[user.role]}`} />
      <Panel title="Parola değiştir" className="max-w-xl">
        <ActionForm action={changeOwnPassword} submitLabel="Parolayı değiştir" resetOnSuccess className="grid gap-4">
          <Field name="current" label="Mevcut parola" type="password" autoComplete="current-password" />
          <Field name="password" label="Yeni parola" type="password" autoComplete="new-password" hint="En az 10 karakter." />
          <Field name="confirm" label="Yeni parola (tekrar)" type="password" autoComplete="new-password" />
        </ActionForm>
      </Panel>
    </>
  );
}

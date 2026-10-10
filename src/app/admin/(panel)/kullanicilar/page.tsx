import { ActionForm } from "@/components/admin/ActionForm";
import { Field, Toggle } from "@/components/admin/Field";
import { Badge, PageTitle, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/time";
import { requirePage } from "@/server/auth";
import { createUser, updateUser } from "../../actions/settings";

export const metadata = { title: "Kullanıcılar" };

function RoleOptions() {
  return (
    <>
      {Object.entries(ROLE_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  );
}

export default async function UsersPage() {
  const me = await requirePage("users");
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageTitle
        title="Kullanıcılar"
        description="Yönetici: tüm yetkiler. Servis/Satış personeli: randevular, talepler, müşteri bilgileri ve içerik. İçerik editörü: yalnızca katalog ve metinler; müşteri bilgilerini göremez."
      />
      <div className="grid gap-6">
        <Panel title="Yeni kullanıcı">
          <ActionForm action={createUser} submitLabel="Kullanıcı oluştur" resetOnSuccess className="grid gap-4 md:grid-cols-2">
            <Field name="name" label="Ad soyad" />
            <Field name="email" label="E-posta" type="email" autoComplete="off" />
            <Field as="select" name="role" label="Rol" defaultValue="STAFF">
              <RoleOptions />
            </Field>
            <Field name="password" label="Geçici parola" type="password" autoComplete="new-password" hint="En az 10 karakter. Kullanıcı girişten sonra değiştirmeli." />
          </ActionForm>
        </Panel>
        <Panel title={`Kullanıcılar (${users.length})`}>
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{u.name}</span>
                      <span className="text-sm text-muted">{u.email}</span>
                      <Badge tone="blue">{ROLE_LABELS[u.role]}</Badge>
                      {!u.active && <Badge tone="red">Pasif</Badge>}
                      {u.id === me.id && <Badge>Siz</Badge>}
                    </span>
                    <span className="text-xs text-muted">Son giriş: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</span>
                  </summary>
                  <div className="mt-4 rounded-lg bg-paper p-4">
                    <ActionForm action={updateUser} className="grid gap-4 md:grid-cols-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Field as="select" name="role" label="Rol" defaultValue={u.role}>
                        <RoleOptions />
                      </Field>
                      <Field name="password" label="Yeni parola (isteğe bağlı)" type="password" autoComplete="new-password" hint="Değiştirilirse kullanıcının oturumları kapanır." />
                      <Toggle name="active" label="Hesap aktif" defaultChecked={u.active} />
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

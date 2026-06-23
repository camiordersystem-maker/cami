"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "スーパー管理者",
  editor: "編集者",
  viewer: "閲覧者",
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

export default function AdminAdministratorsPage() {
  const { data: session } = useSession();
  const myAdminRole = (session?.user as { adminRole?: string })?.adminRole;

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" as string });

  async function load() {
    const res = await fetch("/api/admin/administrators");
    if (res.ok) setAdmins(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "editor" });
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(admin: Admin) {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, password: "", role: admin.role });
    setShowForm(true);
    setMessage(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const body = editing
        ? { id: editing.id, name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const res = await fetch("/api/admin/administrators", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(false);

      if (res.ok) {
        setMessage({ text: editing ? "管理者情報を更新しました" : "管理者を登録しました", ok: true });
        setShowForm(false);
        setEditing(null);
        load();
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "エラーが発生しました", ok: false });
      }
    } catch {
      setSaving(false);
      setMessage({ text: "ネットワークエラーが発生しました", ok: false });
    }
  }

  async function toggleActive(admin: Admin) {
    const action = admin.isActive ? "無効化" : "有効化";
    if (!confirm(`${admin.name} を${action}しますか？`)) return;
    try {
      const res = await fetch("/api/admin/administrators", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, isActive: !admin.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ text: `${admin.name} を${action}しました`, ok: true });
        load();
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "エラーが発生しました", ok: false });
      }
    } catch {
      setMessage({ text: "ネットワークエラーが発生しました", ok: false });
    }
  }

  const myId = session?.user?.id;

  if (myAdminRole !== "superadmin") {
    return (
      <div className="py-20 text-center text-slate-500">
        この画面はスーパー管理者のみアクセスできます
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">管理者設定</h1>
          <p className="text-slate-500 text-sm mt-1">本部ユーザーの登録・権限管理</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + 管理者を追加
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 max-w-2xl">
          <h2 className="font-semibold text-slate-900 mb-4">{editing ? "管理者を編集" : "新規管理者追加"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">名前 <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">権限 <span className="text-red-500">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="superadmin">スーパー管理者（全操作）</option>
                  <option value="editor">編集者（閲覧+編集）</option>
                  <option value="viewer">閲覧者（閲覧のみ）</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">メールアドレス <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                パスワード {editing ? "（変更する場合のみ入力）" : <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                required={!editing}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={editing ? "変更しない場合は空白" : "8文字以上"}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : (editing ? "更新する" : "登録する")}
              </button>
              <button type="button" onClick={cancelForm} className="text-slate-600 px-4 py-2 text-sm">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins list */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <div key={admin.id} className={`flex items-center justify-between px-6 py-4 ${!admin.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {admin.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">{admin.name}</span>
                      {admin.id === myId && (
                        <span className="text-xs text-slate-400">(自分)</span>
                      )}
                      {!admin.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">無効</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{admin.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLOR[admin.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {ROLE_LABEL[admin.role] ?? admin.role}
                  </span>
                  <button
                    onClick={() => openEdit(admin)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    編集
                  </button>
                  {admin.id !== myId && (
                    <button
                      onClick={() => toggleActive(admin)}
                      className={`text-sm hover:underline ${admin.isActive ? "text-red-500" : "text-green-600"}`}
                    >
                      {admin.isActive ? "無効化" : "有効化"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

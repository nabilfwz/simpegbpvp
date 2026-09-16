"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ALL_ROLES, ROLE_LABELS, ROLE_BADGE_COLORS, type UserRole } from "@/lib/constants";

const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["superadmin", "admin", "user"]),
  aktif: z.boolean().optional(),
});

type UserForm = z.infer<typeof userSchema>;

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  aktif: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nama: "",
      email: "",
      password: "",
      role: "user",
      aktif: true,
    },
  });

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=${pagination.limit}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();

      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (formData: UserForm) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      toast.success(editingUser ? "User berhasil diperbarui" : "User berhasil ditambahkan");
      setDialogOpen(false);
      setEditingUser(null);
      reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      nama: user.nama,
      email: user.email,
      role: user.role as UserRole,
      aktif: user.aktif,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("User berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus user");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003399]">Manajemen User</h1>
        <p className="text-gray-600 mt-1">Kelola akses dan hak user sistem</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Daftar User</h2>
          <button
            onClick={() => {
              setEditingUser(null);
              reset({ nama: "", email: "", password: "", role: "user", aktif: true });
              setDialogOpen(true);
            }}
            className="bg-[#003399] text-white px-4 py-2 rounded-lg hover:bg-[#002266] transition"
          >
            + Tambah User
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Memuat data...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dibuat</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada user
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{user.nama}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        ROLE_BADGE_COLORS[user.role as UserRole] || "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {ROLE_LABELS[user.role as UserRole] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.aktif
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-[#003399] hover:underline text-sm"
                      >
                        Edit
                      </button>
                      {user.email !== "admin@bpvp.local" && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Sebelumnya
          </button>
          <span className="px-4 py-1 text-sm">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input
                  {...register("nama")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                  placeholder="Nama lengkap"
                />
                {errors.nama && (
                  <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  {...register("email")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                  placeholder="Password minimal 6 karakter"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  {...register("role")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("aktif")}
                    className="rounded text-[#003399] focus:ring-[#003399]"
                  />
                  <span className="text-sm font-medium">Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingUser(null);
                    reset();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003399] text-white rounded-lg hover:bg-[#002266]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
  Eye,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import api from "../../lib/api";
import { toast } from "sonner";
import type { User } from "../../types";
import { Pagination } from "../ui/pagination";
// import validator from "validator";

export function UserManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for stats
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
  }>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  

  const getUsers = async (
    page = 1,
    limit = itemsPerPage,
    role = roleFilter
  ) => {
    try {
      setLoading(true);
      // When filtering by role, fetch ALL users first, then paginate client-side
      const fetchLimit = role !== "all" ? 1000 : limit;
      let url = `/api/users?page=1&limit=${fetchLimit}`;

      // Add search query if provided
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery)}`;
      }
      const res = await api.get(url);
      // response shape: { status, results, meta, data: { users }}
      let fetchedUsers = res.data?.data?.users || [];

      // Apply role filter if not "all"
      if (role !== "all") {
        fetchedUsers = fetchedUsers.filter((u: User) => u.userType === role);
      }

      // Apply client-side pagination
      const total = fetchedUsers.length;
      const totalPagesCalc = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = fetchedUsers.slice(startIndex, endIndex);

      setUsers(paginatedUsers);
      setCurrentPage(page);
      setTotalPages(totalPagesCalc);
      setTotalItems(total);
      setItemsPerPage(limit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for statistics
  const fetchAllUsersForStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/api/users?page=1&limit=10000");
      setAllUsers(res.data?.data?.users || []);
    } catch (err) {
      console.error("Failed to fetch all users for stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    getUsers(currentPage, itemsPerPage, roleFilter).catch(console.error);
    fetchAllUsersForStats();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      getUsers(1, itemsPerPage, roleFilter).catch(console.error);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refetch when filter changes
  useEffect(() => {
    setCurrentPage(1);
    getUsers(1, itemsPerPage, roleFilter).catch(console.error);
  }, [roleFilter]);

  // Role translation
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير";
      case "merchant":
        return "تاجر";
      case "courier":
        return "مندوب توصيل";
      case "employee":
        return "موظف";
      default:
        return role;
    }
  };

  // Badge style
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "merchant":
        return "secondary";
      case "courier":
        return "default";
      case "employee":
        return "outline";
      default:
        return "outline";
    }
  };

  const validateUserForm = (
    formData: { fullName: string; email: string },
    users: User[],
    currentUserId?: string
  ) => {
    const errors: { fullName?: string; email?: string } = {};

    // Full Name
    if (!formData.fullName.trim()) {
      errors.fullName = "الاسم الكامل مطلوب";
    } else if (
      users.some(
        (u) =>
          u.fullName.trim() === formData.fullName.trim() &&
          u._id !== currentUserId
      )
    ) {
      errors.fullName = "الاسم موجود بالفعل";
    }

    // Email
    if (!formData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!validator.isEmail(formData.email)) {
      errors.email = "صيغة البريد الإلكتروني غير صحيحة";
    } else if (
      users.some((u) => u.email === formData.email && u._id !== currentUserId)
    ) {
      errors.email = "البريد الإلكتروني موجود بالفعل";
    }

    return errors;
  };

  const [formData, setFormData] = useState({
    fullName: selectedUser?.fullName || "",
    email: selectedUser?.email || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Run validation for the changed field only
    const errors = validateUserForm(
      { ...formData, [field]: value },
      users,
      selectedUser?._id
    );
    setFormErrors(errors);
  };

  // update user
  const updateUser = async (id: string) => {
    try {
      // Validate form using already fetched users
      const errors = validateUserForm(formData, users, id);
      if (Object.keys(errors).length > 0) {
        Object.values(errors).forEach((err) => toast.error(err));
        return;
      }
      await api.put(`/api/users/${id}`, {
        fullName: formData.fullName,
        email: formData.email,
      });
      toast.success("تم تحديث المستخدم بنجاح");

      // ✅ Close popup after success
      setEditModalOpen(false);

      // ✅ Reset all fields
      setFormData({
        fullName: "",
        email: "",
      });

      // ✅ Refresh the user list immediately
      await getUsers(); // 🔹 Re-fetch updated users from the server
      await fetchAllUsersForStats(); // Update stats
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث المستخدم");
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/users/${userToDelete._id}`);
      toast.success("تم حذف المستخدم بنجاح");
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      await fetchAllUsersForStats();
      setUserToDelete(null);
    } catch (err) {
      setDeleteError("فشل في حذف المستخدم");
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔹 Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/api/users/${id}`);
      toast.success("تم حذف المستخدم بنجاح");
      setUsers((prev) => prev.filter((u) => u._id !== id));
      await fetchAllUsersForStats(); // Update stats after deletion
    } catch {
      toast.error("فشل في حذف المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // Use users directly since filtering is now handled in getUsers
  const filteredUsers = users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            إدارة حسابات المستخدمين وصلاحياتهم
          </p>
        </div>
        <Button
          className="cursor-pointer bg-blue-400 hover:bg-blue-500"
          onClick={() => navigate("/add-user")}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          إضافة مستخدم جديد
        </Button>
      </div>
      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                allUsers.length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المديرين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              ) : (
                allUsers.filter((user) => user.userType === "admin").length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">العمال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              ) : (
                allUsers.filter((user) => user.userType === "employee").length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">التجار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              ) : (
                allUsers.filter((user) => user.userType === "merchant").length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              مندوبي التوصيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              ) : (
                allUsers.filter((user) => user.userType === "courier").length
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            إدارة جميع المستخدمين المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 space-x-reverse mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 text-right"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter} dir="rtl">
              <SelectTrigger className="w-48 mr-2">
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="employee">موظف</SelectItem>
                <SelectItem value="merchant">تاجر</SelectItem>
                <SelectItem value="courier">مندوب توصيل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم الكامل</TableHead>
                  <TableHead className="text-right">
                    البريد الإلكتروني
                  </TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.userType)}>
                        {getRoleLabel(user.userType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-gray-100 transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          sideOffset={6}
                          className="w-52 rounded-xl border border-gray-200 bg-background shadow-lg ring-1 ring-gray-100"
                          dir="rtl"
                        >
                          <DropdownMenuLabel className="text-foreground text-sm font-medium px-3 py-1">
                            الإجراءات
                          </DropdownMenuLabel>

                          <DropdownMenuSeparator className="my-1" />

                          {/* ✏️ Edit */}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setEditModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded-md transition"
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                            تعديل المستخدم
                          </DropdownMenuItem>

                          {/* 👁️ View */}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setViewModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-green-50 hover:text-green-600 cursor-pointer rounded-md transition"
                          >
                            <Eye className="h-4 w-4 text-green-500" />
                            عرض التفاصيل
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1" />

                          {/*  Delete (with confirmation) */}
                          <DropdownMenuItem
                            onClick={() => setUserToDelete(user)}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition font-medium"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            حذف المستخدم
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد نتائج تطابق البحث
            </div>
          )}

          {/* Pagination controls */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setCurrentPage(p);
                getUsers(p, itemsPerPage, roleFilter);
              }}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
                getUsers(1, n, roleFilter);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-center" dir="rtl">
              تفاصيل المستخدم
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-right">
              <p>{selectedUser.fullName}: الاسم</p>
              <p>{selectedUser.email} :البريد الإلكتروني</p>
              <p>الدور: {getRoleLabel(selectedUser.userType)}</p>
              <p>الهاتف: {selectedUser.phone}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/*  Edit Modal (simplified example) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-center" dir="rtl">
              تعديل بيانات المستخدم
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <Input
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="الاسم الكامل"
              />
              {formErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.fullName}
                </p>
              )}
              <Input
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="البريد الإلكتروني"
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
              <Button
                onClick={() => updateUser?.(selectedUser._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                حفظ التغييرات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- نافذة تأكيد حذف المستخدم --- */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <DialogContent className="bg-background text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-blue-600 text-right">تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-primary text-right">
              هل أنت متأكد أنك تريد حذف المستخدم{" "}
              {userToDelete?.fullName}؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              className="text-white ml-1 border-2 mr-2"
              variant="destructive"
              onClick={handleConfirmDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              تأكيد الحذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

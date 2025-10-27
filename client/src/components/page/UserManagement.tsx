import { useEffect, useState } from "react";
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
	Key,
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
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
} from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import api from "../../lib/api";
import { toast } from "sonner";
import type { User } from "../../types";

interface UserManagementProps {
	onNavigate?: (page: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps = {}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const getUsers = async () => {
		const res = await api.get("api/users/");
		setUsers(res.data);
	};

	useEffect(() => {
		getUsers().catch(console.error);
	}, []);

	// 🔹 Role translation
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

	// 🔹 Badge style
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

	// 🔹 Reset password
	const handleResetPassword = async (id: string) => {
		try {
			await api.post(`/api/users/${id}/reset-password`);
			toast.success("تمت إعادة تعيين كلمة المرور بنجاح");
		} catch {
			toast.error("حدث خطأ أثناء إعادة التعيين");
		}
	};

	// 🔹 Delete user
	const handleDeleteUser = async (id: string) => {
		try {
			setLoading(true);
			await api.delete(`/api/users/${id}`);
			toast.success("تم حذف المستخدم بنجاح");
			setUsers((prev) => prev.filter((u) => u._id !== id));
		} catch {
			toast.error("فشل في حذف المستخدم");
		} finally {
			setLoading(false);
		}
	};

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole =
			roleFilter === "all" || user.userType === roleFilter;
		return matchesSearch && matchesRole;
	});

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
					className="bg-blue-600 hover:bg-blue-700"
					onClick={() => onNavigate?.("add-user")}
				>
					<UserPlus className="h-4 w-4 mr-2" />
					إضافة مستخدم جديد
				</Button>
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

						<Select
							value={roleFilter}
							onValueChange={setRoleFilter}
						>
							<SelectTrigger className="w-48 me-1">
								<SelectValue placeholder="تصفية حسب الدور" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									جميع الأدوار
								</SelectItem>
								<SelectItem value="admin">مدير</SelectItem>
								<SelectItem value="employee">عامل</SelectItem>
								<SelectItem value="merchant">تاجر</SelectItem>
								<SelectItem value="courier">
									مندوب توصيل
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-right">
										الاسم الكامل
									</TableHead>
									<TableHead className="text-right">
										البريد الإلكتروني
									</TableHead>
									<TableHead className="text-right">
										الدور
									</TableHead>
									<TableHead className="text-right">
										الهاتف
									</TableHead>
									<TableHead className="text-center">
										الإجراءات
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user._id}>
										<TableCell>{user.fullName}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge
												variant={getRoleBadgeVariant(
													user.userType
												)}
											>
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
													className="w-52 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-100"
												>
													<DropdownMenuLabel className="text-gray-500 text-sm font-medium px-3 py-1">
														الإجراءات
													</DropdownMenuLabel>

													<DropdownMenuSeparator className="my-1" />

													{/* ✏️ Edit */}
													<DropdownMenuItem
														onClick={() => {
															setSelectedUser(
																user
															);
															setEditModalOpen(
																true
															);
														}}
														className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded-md transition"
													>
														<Edit className="h-4 w-4 text-blue-500" />
														تعديل المستخدم
													</DropdownMenuItem>

													{/* 👁️ View */}
													<DropdownMenuItem
														onClick={() => {
															setSelectedUser(
																user
															);
															setViewModalOpen(
																true
															);
														}}
														className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer rounded-md transition"
													>
														<Eye className="h-4 w-4 text-green-500" />
														عرض التفاصيل
													</DropdownMenuItem>

													{/* 🔑 Reset Password */}
													<DropdownMenuItem
														onClick={() =>
															handleResetPassword(
																user._id
															)
														}
														className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 cursor-pointer rounded-md transition"
													>
														<Key className="h-4 w-4 text-amber-500" />
														إعادة تعيين كلمة المرور
													</DropdownMenuItem>

													<DropdownMenuSeparator className="my-1" />

													{/* 🗑️ Delete (with confirmation) */}
													<AlertDialog>
														<AlertDialogTrigger
															asChild
														>
															<DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer rounded-md transition font-medium">
																<Trash2 className="h-4 w-4 text-red-500" />
																حذف المستخدم
															</DropdownMenuItem>
														</AlertDialogTrigger>
														<AlertDialogContent className="rounded-xl p-6">
															<AlertDialogHeader>
																<AlertDialogTitle className="text-lg font-semibold text-gray-800">
																	هل أنت
																	متأكد؟
																</AlertDialogTitle>
																<AlertDialogDescription className="text-gray-500 mt-2">
																	سيتم حذف هذا
																	المستخدم
																	نهائيًا ولا
																	يمكن التراجع
																	عن هذا
																	الإجراء.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter className="mt-4">
																<AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
																	إلغاء
																</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() =>
																		handleDeleteUser(
																			user._id
																		)
																	}
																	disabled={
																		loading
																	}
																	className="bg-red-600 hover:bg-red-700 text-white"
																>
																	{loading
																		? "جارٍ الحذف..."
																		: "تأكيد الحذف"}
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
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
				</CardContent>
			</Card>

			{/* 👁️ View Modal */}
			<Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>تفاصيل المستخدم</DialogTitle>
					</DialogHeader>
					{selectedUser && (
						<div className="space-y-3 text-right">
							<p>الاسم: {selectedUser.fullName}</p>
							<p>البريد الإلكتروني: {selectedUser.email}</p>
							<p>الدور: {getRoleLabel(selectedUser.userType)}</p>
							<p>الهاتف: {selectedUser.phone}</p>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* ✏️ Edit Modal (simplified example) */}
			<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>تعديل بيانات المستخدم</DialogTitle>
					</DialogHeader>
					{selectedUser && (
						<div className="space-y-4">
							<Input
								defaultValue={selectedUser.fullName}
								placeholder="الاسم الكامل"
							/>
							<Input
								defaultValue={selectedUser.email}
								placeholder="البريد الإلكتروني"
							/>
							<Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
								حفظ التغييرات
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

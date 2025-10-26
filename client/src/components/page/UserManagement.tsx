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
	Filter,
	MoreHorizontal,
	UserPlus,
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
import api from "../../lib/api";
import type { User } from "../../types";

const getUsers = async () => {
	const res = await api.get("/api/users/");
	return res.data;
};

const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
	getUsers().then(setUsers).catch(console.error);
}, []);

interface UserManagementProps {
	onNavigate?: (page: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps = {}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");

	const getRoleLabel = (role: string) => {
		switch (role) {
			case "admin":
				return "مدير";
			case "merchant":
				return "تاجر";
			case "delivery":
				return "مندوب توصيل";
			default:
				return role;
		}
	};

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case "admin":
				return "destructive";
			case "merchant":
				return "default";
			case "delivery":
				return "secondary";
			default:
				return "outline";
		}
	};

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.username.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole =
			roleFilter === "all" || user.userType === roleFilter;
		return matchesSearch && matchesRole;
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1>إدارة المستخدمين</h1>
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

			{/* إحصائيات سريعة */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							إجمالي المستخدمين
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{users.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							المديرين
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{users.filter(user => user.userType === 'admin').length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							التجار
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{users.filter(user => user.userType === 'merchant').length}
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
							{users.filter(user => user.userType === 'driver').length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* أدوات البحث والتصفية */}
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
							<SelectTrigger className="w-48">
								<SelectValue placeholder="تصفية حسب الدور" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									جميع الأدوار
								</SelectItem>
								<SelectItem value="admin">مدير</SelectItem>
								<SelectItem value="merchant">تاجر</SelectItem>
								<SelectItem value="delivery">
									مندوب توصيل
								</SelectItem>
							</SelectContent>
						</Select>

						<Button variant="outline">
							<Filter className="h-4 w-4 mr-2" />
							تصفية متقدمة
						</Button>
					</div>

					{/* جدول المستخدمين */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-right">
										الاسم الكامل
									</TableHead>
									<TableHead className="text-right">
										اسم المستخدم
									</TableHead>
									<TableHead className="text-right">
										البريد الإلكتروني
									</TableHead>
									<TableHead className="text-right">
										الدور
									</TableHead>
									{/* <TableHead className="text-right">
										الحالة
									</TableHead>
									<TableHead className="text-right">
										آخر دخول
									</TableHead> */}
									<TableHead className="text-right">
										الإجراءات
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.map((user) => (
									<TableRow key={user._id}>
										<TableCell className="font-medium">
											{user.fullName}
										</TableCell>
										<TableCell>{user.username}</TableCell>
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
										{/* <TableCell>
											<Badge
												variant={
													user.status === "نشط"
														? "default"
														: "secondary"
												}
											>
												{user.status}
											</Badge>
										</TableCell>
										<TableCell>{user.lastLogin}</TableCell> */}
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>
														الإجراءات
													</DropdownMenuLabel>
													<DropdownMenuItem>
														<Edit className="mr-2 h-4 w-4" />
														تعديل المستخدم
													</DropdownMenuItem>
													<DropdownMenuItem>
														عرض التفاصيل
													</DropdownMenuItem>
													<DropdownMenuItem>
														إعادة تعيين كلمة المرور
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600">
														<Trash2 className="mr-2 h-4 w-4" />
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
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								لا توجد نتائج تطابق البحث
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

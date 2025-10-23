import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
	Package,
	Truck,
	DollarSign,
	Users,
	TrendingUp,
	Clock,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

const chartData = [
	{ day: "السبت", orders: 45 },
	{ day: "الأحد", orders: 52 },
	{ day: "الاثنين", orders: 38 },
	{ day: "الثلاثاء", orders: 67 },
	{ day: "الأربعاء", orders: 71 },
	{ day: "الخميس", orders: 58 },
	{ day: "الجمعة", orders: 43 },
];

const recentOrders = [
	{
		id: "#2024-001",
		customer: "أحمد محمد",
		status: "تم التسليم",
		amount: "150 جنيه",
	},
	{
		id: "#2024-002",
		customer: "فاطمة علي",
		status: "في الطريق",
		amount: "95 جنيه",
	},
	{
		id: "#2024-003",
		customer: "محمد عبدالله",
		status: "قيد المعالجة",
		amount: "220 جنيه",
	},
	{
		id: "#2024-004",
		customer: "نورا حسن",
		status: "تم التسليم",
		amount: "75 جنيه",
	},
	{
		id: "#2024-005",
		customer: "خالد أحمد",
		status: "ملغي",
		amount: "180 جنيه",
	},
];

const Admin_Dashboard = () => {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1>لوحة تحكم المدير</h1>
					<p className="text-muted-foreground">
						نظرة شاملة على أداء نظام الشحن
					</p>
				</div>
				<div className="flex space-x-2 space-x-reverse">
					<Button>إنشاء تقرير</Button>
					<Button variant="outline">تصدير البيانات</Button>
				</div>
			</div>

			{/* إحصائيات سريعة */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							الطلبات اليوم
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">127</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+12%</span> من
							الأمس
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							الشحنات المعلقة
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">23</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-orange-600">+3</span> منذ
							الصباح
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							الإيرادات اليوم
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">12,450 جنيه</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+8%</span> من الأمس
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							المستخدمين النشطين
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">89</div>
						<p className="text-xs text-muted-foreground">
							<span className="text-green-600">+5</span> مستخدمين
							جدد
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>حجم الطلبات خلال الأسبوع</CardTitle>
						<CardDescription>
							إجمالي الطلبات المسجلة في آخر 7 أيام
						</CardDescription>
					</CardHeader>
					<CardContent className="pl-2">
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="day" />
								<YAxis />
								<Tooltip />
								<Line
									type="monotone"
									dataKey="orders"
									stroke="#2563eb"
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* ===== QuickActions =====*/}
				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>الإجراءات السريعة</CardTitle>
						<CardDescription>
							الوصول السريع للمهام الأساسية
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{[
							{
								label: "إدارة المستخدمين",
								icon: <Users className="h-4 w-4" />,
							},
							{
								label: "إدارة الطلبات",
								icon: <Package className="h-4 w-4" />,
							},
							{
								label: "تقارير الأداء",
								icon: <TrendingUp className="h-4 w-4" />,
							},
							{
								label: "تتبع المركبات",
								icon: <Truck className="h-4 w-4" />,
							},
						].map((item, i) => (
							<Button
								key={i}
								variant={item.active ? "secondary" : "outline"}
								className={`flex justify-between ${
									item.active ? "bg-muted" : ""
								}`}
							>
								<span>{item.label}</span>
								{item.icon}
							</Button>
						))}
					</CardContent>
				</Card>
			</div>

			{/* آخر الطلبات */}
			<Card>
				<CardHeader>
					<CardTitle>آخر الطلبات</CardTitle>
					<CardDescription>
						أحدث 5 طلبات تم تسجيلها في النظام
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{recentOrders.map((order) => (
							<div
								key={order.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex items-center space-x-4 space-x-reverse">
									<div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
										<Package className="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<p className="font-medium">
											{order.customer}
										</p>
										<p className="text-sm text-muted-foreground">
											رقم الطلب: {order.id}
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-4 space-x-reverse">
									<span
										className={`px-2 py-1 rounded-full text-xs ${
											order.status === "تم التسليم"
												? "bg-green-100 text-green-800"
												: order.status === "في الطريق"
												? "bg-blue-100 text-blue-800"
												: order.status ===
												  "قيد المعالجة"
												? "bg-yellow-100 text-yellow-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{order.status}
									</span>
									<span className="font-medium">
										{order.amount}
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Admin_Dashboard;

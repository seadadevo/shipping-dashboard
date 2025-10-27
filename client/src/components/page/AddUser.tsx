import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import {
	ArrowRight,
	Save,
	X,
	User,
	Mail,
	Lock,
	Phone,
	MapPin,
	Building,
	Store,
	DollarSign,
	Percent,
} from "lucide-react";
import api from "../../lib/api";

// ... (Interface and constant data remain unchanged)
interface AddUserProps {
	onBack?: () => void;
	onSave?: (userData: any) => void;
}

const branches = [
	{ id: "1", name: "الفرع الرئيسي - القاهرة" },
	{ id: "2", name: "فرع الجيزة" },
	{ id: "3", name: "فرع الإسكندرية" },
	{ id: "4", name: "فرع الدلتا - طنطا" },
	{ id: "5", name: "فرع الصعيد - أسيوط" },
];

const governorates = [
	{
		id: "1",
		name: "القاهرة",
		cities: ["القاهرة الجديدة", "المعادي", "حلوان", "مدينة نصر", "شبرا"],
	},
	{
		id: "2",
		name: "الجيزة",
		cities: ["الجيزة", "الشيخ زايد", "السادس من أكتوبر", "فيصل", "الهرم"],
	},
	{
		id: "3",
		name: "الإسكندرية",
		cities: ["الإسكندرية", "برج العرب", "العجمي", "المنتزه"],
	},
	{
		id: "4",
		name: "الدقهلية",
		cities: ["المنصورة", "ميت غمر", "بلقاس", "طلخا"],
	},
	{
		id: "5",
		name: "البحيرة",
		cities: ["دمنهور", "كفر الدوار", "إدكو", "أبو حمص"],
	},
	{
		id: "6",
		name: "الشرقية",
		cities: ["الزقازيق", "العاشر من رمضان", "بلبيس", "فأقوس"],
	},
	{
		id: "7",
		name: "أسيوط",
		cities: ["أسيوط", "ديروط", "منفلوط", "أبنوب"],
	},
];

export function AddUser({ onBack, onSave }: AddUserProps) {
	const [userType, setUserType] = useState<
		"merchant" | "courier" | "employee"
	>("employee");

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		phone: "",
		address: "",
		storeName: "",
		branchId: "",
		governorateId: "",
		cityId: "",
		pickupCost: "",
		rejectionFeePercentage: "",
	});

	const [selectedGovernorate, setSelectedGovernorate] = useState<any>(null);
	const [availableCities, setAvailableCities] = useState<string[]>([]);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleGovernorateChange = (governorateId: string) => {
		const governorate = governorates.find((g) => g.id === governorateId);
		setSelectedGovernorate(governorate);
		setAvailableCities(governorate?.cities || []);
		handleInputChange("governorateId", governorateId);
		handleInputChange("cityId", ""); // إعادة تعيين المدينة عند تغيير المحافظة
	};

	const handleSubmit = async () => {
		// ... (Submit logic remains unchanged)
		const requiredFields = ["name", "email", "password", "phone"];

		if (userType === "merchant" || userType === "courier") {
			requiredFields.push(
				"address",
				"branchId",
				"governorateId",
				"cityId"
			);
		}

		if (userType === "merchant") {
			requiredFields.push(
				"storeName",
				"pickupCost",
				"rejectionFeePercentage"
			);
		}

		const missingFields = requiredFields.filter(
			(field) => !formData[field as keyof typeof formData]
		);

		if (missingFields.length > 0) {
			alert("يرجى ملء جميع الحقول المطلوبة");
			return;
		}

		try {
			const newUser = {
				userType,
				fullName: formData.name,
				email: formData.email,
				password: formData.password,
				phone: formData.phone,
				address: formData.address || undefined,
				governorate: formData.governorateId || undefined,
				city: formData.cityId || undefined,
				storeName: formData.storeName || undefined,
				branchId: formData.branchId,
				pickupCost: formData.pickupCost || undefined,
				rejectionFeePercentage:
					formData.rejectionFeePercentage || undefined,
			};

			// إرسال الطلب إلى الخادم
			const { data } = await api.post("/api/users/add", newUser);

			alert(
				`✅ تم إنشاء حساب ${
					userType === "merchant" ? "التاجر" : userType === "courier" ? "المندوب" : "العامل"
				} بنجاح!`
			);
			// console.log("User created:", data);

			onSave?.(data);

			// ✅ إعادة تعيين الحقول بعد النجاح
			setFormData({
				name: "",
				email: "",
				password: "",
				phone: "",
				address: "",
				storeName: "",
				branchId: "",
				governorateId: "",
				cityId: "",
				pickupCost: "",
				rejectionFeePercentage: "",
			});

			setSelectedGovernorate(null);
			setAvailableCities([]);

			onBack?.();
		} catch (error: any) {
			console.error(error);
			if (error.response) {
				alert(error.response.data.message || "فشل في إضافة المستخدم");
			} else {
				alert("حدث خطأ أثناء الاتصال بالخادم");
			}
		}
	};

	return (
		<div className="space-y-8">
			{/* ======================= قسم العنوان والعودة ======================= */}
			<div className="flex items-center justify-between border-b pb-4">
				<div className="flex items-center space-x-4 space-x-reverse">
					<Button
						className="ml-3 cursor-pointer"
						variant="outline"
						onClick={() => onBack?.()}
					>
						<ArrowRight className="h-4 w-4 mr-2" />
						العودة
					</Button>
					<div>
						<h1 className="text-2xl font-bold">
							إضافة {userType === "merchant" ? "تاجر" : "مندوب"}{" "}
							جديد
						</h1>
						<p className="text-sm text-muted-foreground">
							أدخل بيانات{" "}
							{userType === "merchant" ? "التاجر" : "المندوب"}{" "}
							الجديد لإنشاء حساب في النظام
						</p>
					</div>
				</div>
			</div>

			{/* ======================= قسم اختيار نوع المستخدم (الحدود إزيلت وأضيف الظل) ======================= */}
			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle>نوع المستخدم</CardTitle>
					<CardDescription>
						اختر نوع الحساب المراد إنشاؤه
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 space-x-4 space-x-reverse">
						<Button
							onClick={() => setUserType("employee")}
							className={`flex-1 cursor-pointer transition-all duration-200 font-semibold ${
								userType === "employee"
									? "bg-green-600 text-white hover:bg-green-700 shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
							}`}
						>
							<Store
								className={`h-4 w-4 mr-2 ${
									userType === "employee"
										? "text-white"
										: "text-gray-500"
								}`}
							/>
							عامل
						</Button>

						<Button
							onClick={() => setUserType("merchant")}
							className={`flex-1 cursor-pointer transition-all duration-200 font-semibold ${
								userType === "merchant"
									? "bg-green-600 text-white hover:bg-green-700 shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
							}`}
						>
							<Store
								className={`h-4 w-4 mr-2 ${
									userType === "merchant"
										? "text-white"
										: "text-gray-500"
								}`}
							/>
							تاجر
						</Button>

						<Button
							onClick={() => setUserType("courier")}
							className={`flex-1 cursor-pointer transition-all duration-200 font-semibold ${
								userType === "courier"
									? "bg-green-600 text-white hover:bg-green-700 shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200 border"
							}`}
						>
							<User
								className={`h-4 w-4 mr-2 ${
									userType === "courier"
										? "text-white"
										: "text-gray-500"
								}`}
							/>
							مندوب توصيل
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* ======================= قسم البيانات الأساسية (الحدود إزيلت وأضيف الظل) ======================= */}
			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle>البيانات الأساسية</CardTitle>
					<CardDescription>
						المعلومات الشخصية ومعلومات تسجيل الدخول والفرع
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* المجموعة الأولى: الاسم والبريد الإلكتروني */}
					<div className="grid gap-4 md:grid-cols-2">
						{/* الاسم الكامل */}
						<div className="space-y-2">
							<Label htmlFor="name" className="flex items-center">
								<User className="h-4 w-4 ml-1 text-primary" />
								الاسم الكامل *
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									handleInputChange("name", e.target.value)
								}
								placeholder="أدخل الاسم الكامل"
								className="text-right"
								required
							/>
						</div>

						{/* البريد الإلكتروني */}
						<div className="space-y-2">
							<Label
								htmlFor="email"
								className="flex items-center"
							>
								<Mail className="h-4 w-4 ml-1 text-primary" />
								البريد الإلكتروني *
							</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									handleInputChange("email", e.target.value)
								}
								placeholder="example@domain.com"
								className="text-right"
								required
							/>
						</div>
					</div>

					{/* فاصل مرئي */}
					<div className="border-t pt-6" />

					{/* المجموعة الثانية: كلمة المرور ورقم الهاتف */}
					<div className="grid gap-4 md:grid-cols-2">
						{/* كلمة المرور */}
						<div className="space-y-2">
							<Label
								htmlFor="password"
								className="flex items-center"
							>
								<Lock className="h-4 w-4 ml-1 text-primary" />
								كلمة المرور *
							</Label>
							<Input
								id="password"
								type="password"
								value={formData.password}
								onChange={(e) =>
									handleInputChange(
										"password",
										e.target.value
									)
								}
								placeholder="أدخل كلمة مرور قوية"
								className="text-right"
								required
							/>
						</div>

						{/* رقم الهاتف */}
						<div className="space-y-2">
							<Label
								htmlFor="phone"
								className="flex items-center"
							>
								<Phone className="h-4 w-4 ml-1 text-primary" />
								رقم الهاتف *
							</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									handleInputChange("phone", e.target.value)
								}
								placeholder="05xxxxxxxx"
								className="text-right"
								required
							/>
						</div>
					</div>

					{/* فاصل مرئي */}
					<div className="border-t pt-6" />

					{(userType === "merchant" || userType === "courier") && (
						<div className="space-y-2">
							<Label
								htmlFor="branch"
								className="flex items-center"
							>
								<Building className="h-4 w-4 ml-1 text-primary" />
								الفرع *
							</Label>
							<Select
								value={formData.branchId}
								onValueChange={(value) =>
									handleInputChange("branchId", value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="اختر الفرع" />
								</SelectTrigger>
								<SelectContent>
									{branches.map((branch) => (
										<SelectItem
											key={branch.id}
											value={branch.id}
										>
											{branch.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{(userType === "merchant" || userType === "courier") && (
						<div className="space-y-2">
							<Label
								htmlFor="address"
								className="flex items-center"
							>
								<MapPin className="h-4 w-4 ml-1 text-primary" />
								العنوان *
							</Label>
							<Textarea
								id="address"
								value={formData.address}
								onChange={(e) =>
									handleInputChange("address", e.target.value)
								}
								placeholder="أدخل العنوان التفصيلي"
								className="text-right"
								rows={3}
								required
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ======================= معلومات المتجر (للتجار فقط) (الحدود إزيلت وأضيف الظل) ======================= */}
			{userType === "merchant" && (
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle>معلومات المتجر والتكاليف</CardTitle>
						<CardDescription>
							بيانات المتجر والتكاليف الخاصة للشحن والرفض
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* اسم المتجر */}
						<div className="space-y-2">
							<Label
								htmlFor="storeName"
								className="flex items-center"
							>
								<Store className="h-4 w-4 ml-1 text-primary" />
								اسم المتجر *
							</Label>
							<Input
								id="storeName"
								value={formData.storeName}
								onChange={(e) =>
									handleInputChange(
										"storeName",
										e.target.value
									)
								}
								placeholder="أدخل اسم المتجر"
								className="text-right"
								required
							/>
						</div>

						{/* فاصل مرئي */}
						<div className="border-t pt-6" />

						{/* تكلفة البيك أب ونسبة الرفض */}
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label
									htmlFor="pickupCost"
									className="flex items-center"
								>
									<DollarSign className="h-4 w-4 ml-1 text-primary" />
									تكلفة Pickup خاصة (دولار) *
								</Label>
								<Input
									id="pickupCost"
									type="number"
									step="0.01"
									min="0"
									value={formData.pickupCost}
									onChange={(e) =>
										handleInputChange(
											"pickupCost",
											e.target.value
										)
									}
									placeholder="0.00"
									className="text-right"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="rejectionFeePercentage"
									className="flex items-center"
								>
									<Percent className="h-4 w-4 ml-1 text-primary" />
									نسبة تحمل التاجر للطلبات المرفوضة (%) *
								</Label>
								<Input
									id="rejectionFeePercentage"
									type="number"
									min="0"
									max="100"
									step="0.1"
									value={formData.rejectionFeePercentage}
									onChange={(e) =>
										handleInputChange(
											"rejectionFeePercentage",
											e.target.value
										)
									}
									placeholder="0.0"
									className="text-right"
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* ======================= قسم الموقع الجغرافي (الحدود إزيلت وأضيف الظل) ======================= */}
			{userType === "merchant" ||
				(userType === "courier" && (
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>الموقع الجغرافي</CardTitle>
							<CardDescription>المحافظة والمدينة</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								{/* المحافظة */}
								<div className="space-y-2">
									<Label
										htmlFor="governorate"
										className="flex items-center"
									>
										<MapPin className="h-4 w-4 ml-1 text-primary" />
										المحافظة *
									</Label>
									<Select
										value={formData.governorateId}
										onValueChange={handleGovernorateChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="اختر المحافظة" />
										</SelectTrigger>
										<SelectContent>
											{governorates.map((governorate) => (
												<SelectItem
													key={governorate.id}
													value={governorate.id}
												>
													{governorate.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* المدينة */}
								<div className="space-y-2">
									<Label
										htmlFor="city"
										className="flex items-center"
									>
										<MapPin className="h-4 w-4 ml-1 text-primary" />
										المدينة *
									</Label>
									<Select
										value={formData.cityId}
										onValueChange={(value) =>
											handleInputChange("cityId", value)
										}
										disabled={!selectedGovernorate}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													selectedGovernorate
														? "اختر المدينة"
														: "اختر المحافظة أولاً"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{availableCities.map(
												(city, index) => (
													<SelectItem
														key={index}
														value={city}
													>
														{city}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

			{/* ======================= قسم أزرار الإجراءات (الحدود إزيلت وأضيف الظل) ======================= */}
			<Card className="shadow-lg">
				<CardContent className="pt-6 flex justify-end gap-3">
					<Button
						className="cursor-pointer"
						variant="outline"
						onClick={() => onBack?.()}
					>
						<X className="h-4 w-4 mr-2" />
						إلغاء
					</Button>
					<Button
						onClick={handleSubmit}
						className="bg-green-600 hover:bg-green-700"
					>
						<Save className="h-4 w-4 mr-2" />
						حفظ البيانات
					</Button>
				</CardContent>
			</Card>

			{/* ======================= قسم ملاحظات مهمة (حافظنا على حدود الإشعار) ======================= */}
			{/* لاحظ أننا حافظنا على نمط الحدود هنا لأنه تصميم خاص "للتنبيه" وليس لـ "تجميع المحتوى" */}
			<Card className="border-l-4 border-orange-500 bg-orange-50/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-orange-800 text-lg">
						ملاحظات هامة قبل الحفظ
					</CardTitle>
				</CardHeader>
				<CardContent className="text-orange-700">
					<ul className="list-disc list-inside space-y-2 text-sm pr-4">
						<li>
							تأكد من صحة البريد الإلكتروني حيث سيتم إرسال تفاصيل
							الحساب إليه.
						</li>
						<li>
							كلمة المرور يجب أن تكون قوية وتحتوي على أحرف وأرقام
							ورموز.
						</li>
						<li>رقم الهاتف مطلوب للتواصل وإرسال الإشعارات.</li>
						{userType === "merchant" && (
							<>
								<hr className="my-3 border-orange-200" />
								<li>
									**تكلفة Pickup الخاصة:** ستُطبق على جميع
									طلبات هذا التاجر بدلاً من التكلفة العامة.
								</li>
								<li>
									**نسبة تحمل الرفض:** تحدد النسبة المئوية
									للتكلفة التي يتحملها التاجر عند رفض العميل
									للطلب.
								</li>
							</>
						)}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

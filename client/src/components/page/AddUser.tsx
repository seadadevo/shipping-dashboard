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
// import { Separator } from "../ui/separator";

interface AddUserProps {
	onBack?: () => void;
	onSave?: (userData: any) => void;
}

const branches = [
	{ id: "1", name: "الفرع الرئيسي - الرياض" },
	{ id: "2", name: "فرع جدة" },
	{ id: "3", name: "فرع الدمام" },
	{ id: "4", name: "فرع الطائف" },
	{ id: "5", name: "فرع المدينة المنورة" },
];

const governorates = [
	{
		id: "1",
		name: "الرياض",
		cities: ["الرياض", "الخرج", "الدرعية", "حريملاء"],
	},
	{
		id: "2",
		name: "مكة المكرمة",
		cities: ["جدة", "مكة المكرمة", "الطائف", "رابغ"],
	},
	{
		id: "3",
		name: "المنطقة الشرقية",
		cities: ["الدمام", "الخبر", "الظهران", "القطيف"],
	},
	{
		id: "4",
		name: "المدينة المنورة",
		cities: ["المدينة المنورة", "ينبع", "العلا", "بدر"],
	},
	{ id: "5", name: "القصيم", cities: ["بريدة", "عنيزة", "الرس", "البكيرية"] },
];

export function AddUser({ onBack, onSave }: AddUserProps) {
	const [userType, setUserType] = useState<"merchant" | "courier">(
		"merchant"
	);

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
		// التحقق من صحة البيانات
		const requiredFields = [
			"name",
			"email",
			"password",
			"phone",
			"address",
			"branchId",
			"governorateId",
			"cityId",
		];

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
				address: formData.address,
				governorate: formData.governorateId,
				city: formData.cityId,
				storeName: formData.storeName || undefined,
				branchId: formData.branchId,
				pickupCost: formData.pickupCost || undefined,
				rejectionFeePercentage:
					formData.rejectionFeePercentage || undefined,
			};
console.log("Submitting new user:", newUser);
			// إرسال الطلب إلى الخادم
			const { data } = await api.post("/api/users/add", newUser);

			alert(
				`✅ تم إنشاء حساب ${
					userType === "merchant" ? "التاجر" : "المندوب"
				} بنجاح!`
			);
			console.log("User created:", data);

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

		// // إنشاء كائن المستخدم الجديد
		// const newUser = {
		// 	...formData,
		// 	userType,
		// 	id: Date.now().toString(),
		// 	createdAt: new Date().toISOString(),
		// 	status: "نشط",
		// };

		// console.log("إنشاء مستخدم جديد:", newUser);

		// // استدعاء دالة الحفظ إذا تم تمريرها
		// onSave?.(newUser);

		// // إظهار رسالة نجاح
		// alert(
		// 	`تم إنشاء حساب ${
		// 		userType === "merchant" ? "التاجر" : "المندوب"
		// 	} بنجاح!`
		// );

		// // العودة للصفحة السابقة
		// onBack?.();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4 space-x-reverse">
					<Button variant="outline" onClick={onBack}>
						<ArrowRight className="h-4 w-4 mr-2" />
						العودة
					</Button>
					<div>
						<h1>
							إضافة {userType === "merchant" ? "تاجر" : "مندوب"}{" "}
							جديد
						</h1>
						<p className="text-muted-foreground">
							أدخل بيانات{" "}
							{userType === "merchant" ? "التاجر" : "المندوب"}{" "}
							الجديد لإنشاء حساب في النظام
						</p>
					</div>
				</div>
			</div>

			{/* اختيار نوع المستخدم */}
			<Card>
				<CardHeader>
					<CardTitle>نوع المستخدم</CardTitle>
					<CardDescription>
						اختر نوع الحساب المراد إنشاؤه
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex space-x-4 space-x-reverse">
						<Button
							variant={
								userType === "merchant" ? "default" : "outline"
							}
							onClick={() => setUserType("merchant")}
							className="flex-1"
						>
							<Store className="h-4 w-4 mr-2" />
							تاجر
						</Button>
						<Button
							variant={
								userType === "courier" ? "default" : "outline"
							}
							onClick={() => setUserType("courier")}
							className="flex-1"
						>
							<User className="h-4 w-4 mr-2" />
							مندوب توصيل
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* نموذج البيانات */}
			<Card>
				<CardHeader>
					<CardTitle>البيانات الأساسية</CardTitle>
					<CardDescription>
						المعلومات الشخصية ومعلومات تسجيل الدخول
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* الصف الأول */}
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name" className="flex items-center">
								<User className="h-4 w-4 mr-2" />
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

						<div className="space-y-2">
							<Label
								htmlFor="email"
								className="flex items-center"
							>
								<Mail className="h-4 w-4 mr-2" />
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

					{/* الصف الثاني */}
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label
								htmlFor="password"
								className="flex items-center"
							>
								<Lock className="h-4 w-4 mr-2" />
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

						<div className="space-y-2">
							<Label
								htmlFor="phone"
								className="flex items-center"
							>
								<Phone className="h-4 w-4 mr-2" />
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

					{/* الفرع */}
					<div className="space-y-2">
						<Label htmlFor="branch" className="flex items-center">
							<Building className="h-4 w-4 mr-2" />
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

					{/* العنوان */}
					<div className="space-y-2">
						<Label htmlFor="address" className="flex items-center">
							<MapPin className="h-4 w-4 mr-2" />
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
				</CardContent>
			</Card>

			{/* معلومات المتجر (للتجار فقط) */}
			{userType === "merchant" && (
				<Card>
					<CardHeader>
						<CardTitle>معلومات المتجر</CardTitle>
						<CardDescription>
							بيانات المتجر والتكاليف الخاصة
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label
								htmlFor="storeName"
								className="flex items-center"
							>
								<Store className="h-4 w-4 mr-2" />
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

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label
									htmlFor="pickupCost"
									className="flex items-center"
								>
									<DollarSign className="h-4 w-4 mr-2" />
									تكلفة Pickup خاصة (ريال) *
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
									<Percent className="h-4 w-4 mr-2" />
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

			{/* الموقع الجغرافي */}
			<Card>
				<CardHeader>
					<CardTitle>الموقع الجغرافي</CardTitle>
					<CardDescription>المحافظة والمدينة</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label
								htmlFor="governorate"
								className="flex items-center"
							>
								<MapPin className="h-4 w-4 mr-2" />
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

						<div className="space-y-2">
							<Label htmlFor="city" className="flex items-center">
								<MapPin className="h-4 w-4 mr-2" />
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
									{availableCities.map((city, index) => (
										<SelectItem key={index} value={city}>
											{city}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* أزرار الإجراءات */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex justify-between">
						<Button variant="outline" onClick={onBack}>
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
					</div>
				</CardContent>
			</Card>

			{/* ملاحظات مهمة */}
			<Card className="border-orange-200 bg-orange-50">
				<CardHeader>
					<CardTitle className="text-orange-800">
						ملاحظات مهمة
					</CardTitle>
				</CardHeader>
				<CardContent className="text-orange-700">
					<ul className="list-disc list-inside space-y-1 text-sm">
						<li>
							تأكد من صحة البريد الإلكتروني حيث سيتم إرسال تفاصيل
							الحساب إليه
						</li>
						<li>
							كلمة المرور يجب أن تكون قوية وتحتوي على أحرف وأرقام
						</li>
						<li>رقم الهاتف مطلوب للتواصل وإرسال الإشعارات</li>
						{userType === "merchant" && (
							<>
								<li>
									تكلفة Pickup الخاصة ستُطبق على جميع طلبات
									هذا التاجر
								</li>
								<li>
									نسبة تحمل الطلبات المرفوضة تحدد المبلغ الذي
									يدفعه التاجر عند رفض الطلب
								</li>
							</>
						)}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

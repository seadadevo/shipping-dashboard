import React, { useState } from "react";
import {  Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { useTheme } from '../ui/theme-provider';
import { toast } from 'sonner';

import {
	Card,
	CardHeader,
	CardDescription,
	CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { ApiError, LoginResponse } from "../../types";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await api.post<LoginResponse>(
				"/api/v1/auth/login",
				{
					email,
					password,
				}
			);

			//localStorage.setItem("token", response.data.token);

			const { user } = response.data.data;
			const { token } = response.data;

			toast.success(`مرحباً ${user.fullName}! تم تسجيل الدخول بنجاح`);
			login(user, token);
		} catch (err) {
			setLoading(false);
			const error = err as ApiError;

			if (error.response?.data?.message) {
				setError(error.response.data.message);
			} else {
				setError("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
			}
			console.error(err);
		}
	};

	  const { theme } = useTheme();

	return (
		<div
			className="flex items-center justify-center min-h-screen bg-background"
			dir="rtl"
		>
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center">
						<img src={theme === 'dark' ? '/dark-logo.png' : '/light-logo.png'} className='w-40' alt="flash line logo" />
					</div>
					{/* <Package className="h-12 w-12 text-blue-600 mx-auto" />
					<CardTitle className="text-2xl font-bold mt-4">
						نظام الشحن
					</CardTitle> */}
					<CardDescription>
						تسجيل الدخول إلى لوحة التحكم
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="email"
							></label>
							<div className="relative">
								<Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									className="pr-10"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								className="text-sm font-medium"
								htmlFor="password"
							>
								كلمة المرور
							</label>
							<div className="relative">
								<Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="********"
									className="pr-10 pl-10"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
								<AlertCircle className="h-4 w-4 ml-2" />
								<p className="text-sm">{error}</p>
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-accent-foreground"
							disabled={loading}
						>
							{loading ? "جاري التحقق..." : "تسجيل الدخول"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default Login;

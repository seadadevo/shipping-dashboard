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
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
			<Card className="w-full max-w-xl shadow-2xl border-0 bg-card/90 backdrop-blur-md overflow-hidden relative z-10">
				<div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>
				<CardHeader className="text-center space-y-8 pb-8 pt-12 px-10">
					<div className="flex items-center justify-center">
						<div className="relative">
							<div className="absolute inset-0 bg-linear-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl rounded-full animate-pulse"></div>
							<img 
								src={theme === 'dark' ? '/dark-logo.png' : '/light-logo.png'} 
								className='w-56 h-auto relative z-10 drop-shadow-2xl' 
								alt="flash line logo" 
							/>
						</div>
					</div>
					<div className="space-y-3">
						<h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
							مرحباً بعودتك 
						</h1>
						<CardDescription className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
							سجل دخولك للوصول إلى لوحة التحكم الخاصة بك وإدارة عملياتك بكل سهولة
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="px-10 pb-10">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2.5">
							<label
								className="text-sm font-semibold text-foreground flex items-center gap-2"
								htmlFor="email"
							>
								<Mail className="w-4 h-4 text-blue-500" />
								البريد الإلكتروني
							</label>
							<div className="relative group">
								<div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
								<Input
									id="email"
									type="email"
									placeholder="example@domain.com"
									className="relative pr-4 h-12 text-base bg-background border-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl transition-all"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
						</div>

						<div className="space-y-2.5">
							<label
								className="text-sm font-semibold text-foreground flex items-center gap-2"
								htmlFor="password"
							>
								<Lock className="w-4 h-4 text-purple-500" />
								كلمة المرور
							</label>
							<div className="relative group">
								<div className="absolute -inset-0.5 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••••••"
									className="relative pr-4 pl-12 h-12 text-base bg-background border-2 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 rounded-xl transition-all"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-purple-600 transition-colors z-10"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 p-4 rounded-xl">
								<AlertCircle className="h-5 w-5 shrink-0" />
								<p className="text-sm font-medium">{error}</p>
							</div>
						)}

						<Button
							type="submit"
							className="w-full bg-accent-foreground h-12 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center gap-2">
									<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: 'spin 1s linear infinite' }}></span>
									جاري التحقق...
								</span>
							) : (
								"تسجيل الدخول"
							)}
						</Button>
					</form>

					<div className="mt-8 pt-6 border-t border-border/50">
						<div className="flex items-center justify-center gap-2 text-sm">
							<div className="flex items-center gap-2 bg-linear-to-r from-green-500/10 to-emerald-500/10 px-5 py-2.5 rounded-full border border-green-500/20">
								<div className="relative flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
								</div>
								<Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
								<span className="font-medium text-green-700 dark:text-green-300">نظام آمن ومشفر بالكامل</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Login;

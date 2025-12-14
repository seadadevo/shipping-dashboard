import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  DollarSign,
  Users,
  Download,
  Loader2,
  // TrendingUp,
  // Truck,
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

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import type { ApiError, GetOrdersResponse, Order, User } from "../../types";
import { getMenuItemsByRole } from "../../constants/menuItems.ts";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api.ts";
import { generatePDFReport, generateAdminReportCSVSingleFile } from "../../lib/exportUtils";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const menuItems = getMenuItemsByRole(user?.userType || "admin");

  // calc order number today ////////////////////////////////////////////////////////
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const getUsers = async (): Promise<void> => {
    try {
      const res = await api.get("/api/users?limit=1000");
      // Handle paginated response: { status, results, meta, data: { users } }
      const usersList = res.data?.data?.users || res.data || [];
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    getUsers().catch(console.error);
  }, []);

  function isDateToday(dateString: string): "today" | "normal" | "oldOrder" {
    const date = new Date(dateString);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setUTCHours(0, 0, 0, 0); // set to start of today UTC
    twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 15); // subtract ~2 weeks

    // Start of today (UTC)
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    // End of today (UTC)
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    return date >= start && date <= end
      ? "today"
      : date > twoWeeksAgo && date <= end
      ? "normal"
      : "oldOrder";
  }

  function getDayOfLast7DaysOrders(dateString: string): boolean {
    const date = new Date(dateString);

    // Start of today (UTC)
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0); // set to start of today UTC
    start.setUTCDate(start.getUTCDate() - 6); // subtract 14 days

    // End of today (UTC)
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    return date >= start && date <= end;
  }

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  // const [loading, setLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);

    const [countOrdersToday, setCountOrdersToday] = useState<number>(0);
    const [pendingOrdersToday, setPendingOrdersToday] = useState<number>(0);
    const [previousPendingOrders, setPreviousPendingOrders] = useState<number>(0);
    const [moneysToday, setMoneysToday] = useState<number>(0);
    const [chartData, setChartData] = useState<{ day: string; orders: number }[]>([]);
    const [ordersTodayRelativeToWeek, setOrdersTodayRelativeToWeek] = useState<number>(0);
    const [profitTodayRelativeToWeek, setProfitTodayRelativeToWeek] = useState<number>(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shippingTypes, setShippingTypes] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cities, setCities] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [weightSettings, setWeightSettings] = useState<any[]>([]);

    useEffect(() => {
      // جلب أنواع الشحن
      api.get("/api/shipping-types").then(res => setShippingTypes(res.data.data));
      // جلب المدن
      api.get("/api/locations/cities")
      .then(res => setCities(res.data.data || []))
      .catch(err => {
          console.error("خطأ في جلب المدن:", err);
          setCities([]);
      });
      // جلب إعدادات الوزن
      api.get("/api/weight-settings").then(res => {
        const weightData = Array.isArray(res.data) ? res.data : [res.data];
        setWeightSettings(weightData);
      });
    }, []);

  const fetchOrders = async (): Promise<void> => {
    try {
      const response = await api.get<GetOrdersResponse>(
        "/api/orders?limit=1000"
      );
      const ordersList = response.data?.data?.orders || [];
      const safeOrders = Array.isArray(ordersList) ? ordersList : [];

      setAllOrders(safeOrders);

      // Local accumulators
      let localCountOrdersToday = 0;
      let localPendingOrdersToday = 0;
      let localPreviousPendingOrders = 0;
      let localMoneysToday = 0;
      let localTotalOrders = 0;
      let localTotalProfitAWeek = 0;

      const counts: Record<string, number> = {
        الأحد: 0,
        الاثنين: 0,
        الثلاثاء: 0,
        الأربعاء: 0,
        الخميس: 0,
        الجمعة: 0,
        السبت: 0,
      };

      const todayNum = new Date().getDay();
      
      if (safeOrders.length > 0) {
        for (const order of safeOrders) {
          if (isDateToday(order.createdAt) === "today") {
            localCountOrdersToday += 1;
          }
          if (order.status.toLowerCase() === "pending") {
            localPendingOrdersToday += 1;
          }
          if (
            order.status.toLowerCase() === "delivered" &&
            isDateToday(order.updatedAt) === "today"
          ) {
            localMoneysToday += order.orderCost;
          }
          if (isDateToday(order.updatedAt) === "oldOrder") {
            localPreviousPendingOrders += 1;
          }
          if (getDayOfLast7DaysOrders(order.createdAt)) {
            const day = new Date(order.createdAt).getDay();
            if (day !== todayNum) {
              localTotalProfitAWeek += order.orderCost;
            }
            const dayKey = Object.keys(counts)[day];
            counts[dayKey] += 1;
          }
        }

        const todayIndex = new Date().getDay();
        const sortedChart = Array.from({ length: 7 })
          .map((_, i) => {
            const index = (todayIndex - i + 7) % 7;
            const day = Object.keys(counts)[index];
            if (i !== 0) localTotalOrders += counts[day];
            return { day, orders: counts[day] };
          })
          .reverse();

        setChartData(sortedChart);
      } else {
        setChartData([]);
      }

      const avgOrders = localTotalOrders / 6 || 0;
      const avgProfit = localTotalProfitAWeek / 6 || 0;

      const localOrdersTodayRelativeToWeek =
        avgOrders > 0
          ? Math.ceil((localCountOrdersToday / avgOrders) * 100)
          : 0;
      const localProfitTodayRelativeToWeek =
        avgProfit > 0 ? Math.ceil((localMoneysToday / avgProfit) * 100) : 0;

      setCountOrdersToday(localCountOrdersToday);
      setPendingOrdersToday(localPendingOrdersToday);
      setPreviousPendingOrders(localPreviousPendingOrders);
      setMoneysToday(localMoneysToday);
      setOrdersTodayRelativeToWeek(localOrdersTodayRelativeToWeek);
      setProfitTodayRelativeToWeek(localProfitTodayRelativeToWeek);
    } catch (err) {
      const error = err as ApiError;
      console.error("Error fetching orders:", error);
    } finally {
      console.log("Orders fetched successfully");
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  ///////////////////////////////////////////////////////////////////////
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          <p className="text-gray-500">نظرة شاملة على أداء نظام الشحن</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button onClick={() => {
            generatePDFReport({
              orders: allOrders,
              users: users,
              stats: {
                "الطلبات اليوم": countOrdersToday,
                "الشحنات المعلقة": pendingOrdersToday,
                "الشحنات المعلقة منذ اكثر من اسبوعين": previousPendingOrders,
                "طلبات اليوم بالنسبة لمتوسط الطلبات خلال الاسبوع": ordersTodayRelativeToWeek,
                "الإيرادات اليوم": moneysToday,
                "ايرادات اليوم بالنسبة لمتوسط الايرادات خلال الاسبوع": profitTodayRelativeToWeek,
                "المستخدمين النشطين": users.length,
              }
            });
          }}>إنشاء تقرير</Button>
          <Button variant="outline" className="mr-2"
            onClick={() => {
                generateAdminReportCSVSingleFile({
                  orders: allOrders,
                  users: users,
                  stats: {
                    "الطلبات اليوم": countOrdersToday,
                    "الشحنات المعلقة": pendingOrdersToday,
                    "الشحنات المعلقة منذ اكثر من اسبوعين": previousPendingOrders,
                    "طلبات اليوم بالنسبة لمتوسط الطلبات خلال الاسبوع": ordersTodayRelativeToWeek,
                    "الإيرادات اليوم": moneysToday,
                    "ايرادات اليوم بالنسبة لمتوسط الايرادات خلال الاسبوع": profitTodayRelativeToWeek,
                    "المستخدمين النشطين": users.length,
                  },
                   shippingTypes: shippingTypes,
                    cities: cities,
                    weightSettings: weightSettings
                });
            }}
          >
              <Download className="h-4 w-4 mr-2" />
              تصدير البيانات
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات اليوم</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                countOrdersToday
              )}
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">
                %{ordersTodayRelativeToWeek}{" "}
              </span>
              بالنسبة لمتوسط الطلبات خلال الاسبوع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الشحنات المعلقة
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                pendingOrdersToday
              )}
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-orange-600">+{previousPendingOrders} </span>{" "}
              منذ اكثر من اسبوعين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الإيرادات اليوم
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${moneysToday} جنيه`
              )}
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">
                {profitTodayRelativeToWeek}%
              </span>{" "}
              بالنسبة لمتوسط الايرادات خلال الاسبوع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المستخدمين النشطين
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                users.length
              )}
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600"></span> مستخدمين جدد
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>الوصول السريع للمهام الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {menuItems.map((item) => {
              if (
                item.label !== "لوحة التحكم" &&
                item.label !== "المجموعات والأذونات"
              ) {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="w-full cursor-pointer flex items-center px-3 py-2 rounded-lg text-right transition-colors text-primary hover:bg-gray-200 hover:text-black "
                  >
                    <Icon className="h-5 w-5 ml-3 text-gray-400" />
                    <span>{item.label}</span>
                  </button>
                );
              }
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

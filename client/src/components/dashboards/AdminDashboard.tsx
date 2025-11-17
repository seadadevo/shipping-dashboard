import React, {useEffect, useState} from "react";
import {
    Package,
    Clock,
    DollarSign,
    Users, Download,
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
import type {ApiError, GetOrdersResponse, Order, SidebarProps, User} from '../../types';
import {getMenuItemsByRole} from "../../constants/menuItems.ts";
import api from "../../lib/api.ts";

const AdminDashboard: React.FC<SidebarProps> = ({currentPage, onPageChange, userRole}) => {
    const menuItems = getMenuItemsByRole(userRole);

    // calc order number today ////////////////////////////////////////////////////////
    const [users, setUsers] = useState<User[]>([]);
    const getUsers = async () => {
        const res = await api.get("api/users/");
        setUsers(res.data);
    };

    useEffect(() => {
        getUsers().catch(console.error);
    }, []);

    function isDateToday(dateString) {
        const date = new Date(dateString);

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setUTCHours(0, 0, 0, 0);  // set to start of today UTC
        twoWeeksAgo.setUTCDate(twoWeeksAgo.getUTCDate() - 15); // subtract 14 days

        // Start of today (UTC)
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);

        // End of today (UTC)
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        return date >= start && date <= end ? "today" : date > twoWeeksAgo && date <= end ? "normal" : "oldOrder";
    }

    function getDayOfLast7DaysOrders(dateString) {
        const date = new Date(dateString);

        // Start of today (UTC)
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);  // set to start of today UTC
        start.setUTCDate(start.getUTCDate() - 6); // subtract 14 days

        // End of today (UTC)
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        return date >= start && date <= end;
    }

    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [countOrdersToday, setCountOrdersToday] = useState(0);
    const [pendingOrdersToday, setPendingOrdersToday] = useState(0);
    const [previousPendingOrders, setPreviousPendingOrders] = useState(0);
    const [moneysToday, setMoneysToday] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalProfitAWeek, setTotalProfitAWeek] = useState(0);
    const [ordersTodayRelativeToWeek, setOrdersTodayRelativeToWeek] = useState(0);
    const [profitTodayRelativeToWeek, setProfitTodayRelativeToWeek] = useState(0);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<GetOrdersResponse>("/api/orders");
            setAllOrders(response.data.data.orders);
        } catch (err) {
            const error = err as ApiError;
            setError(error.response?.data?.message || "فشل في جلب الطلبات.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        setCountOrdersToday(0);
        setPendingOrdersToday(0);
        setPreviousPendingOrders(0);
        setMoneysToday(0);
        setChartData([]);
        setTotalOrders(0);
        setTotalProfitAWeek(0);

        const counts = {
            "الأحد": 0,
            "الاثنين": 0,
            "الثلاثاء": 0,
            "الأربعاء": 0,
            "الخميس": 0,
            "الجمعة": 0,
            "السبت": 0,
        };

        if(allOrders.length) {
            allOrders.forEach(order => {
                if (isDateToday(order.createdAt) === "today") {
                    setCountOrdersToday(c => c + 1);
                }
                if (order.status.toLowerCase() === "pending") {
                    setPendingOrdersToday(c => c + 1);
                }
                if (order.status.toLowerCase() === "delivered" && isDateToday(order.updatedAt) === "today") {
                    setMoneysToday(c => c + order.orderCost);
                }
                if (isDateToday(order.updatedAt) === "oldOrder") {
                    setPreviousPendingOrders(c => c + 1);
                }
                if (getDayOfLast7DaysOrders(order.createdAt)) {
                    const day = new Date(order.createdAt).getDay();
                    if(day !== new Date().getDay())
                        setTotalProfitAWeek(c => c + order.orderCost);
                    counts[Object.keys(counts)[day]] += 1;
                }
            });
            const todayIndex = new Date().getDay();

            const sortedChart = Array.from({ length: 7 }).map((_, i) => {
                const index = (todayIndex - i + 7) % 7;
                const day = Object.keys(counts)[index];
                if(i !== 0)
                    setTotalOrders(c => c + counts[day]);

                return {
                    day,
                    orders: counts[day]
                };
            }).reverse();

            setChartData(sortedChart);
        }
        setOrdersTodayRelativeToWeek(Math.ceil((countOrdersToday / (totalOrders / 6)) * 100));
        setProfitTodayRelativeToWeek(Math.ceil((moneysToday / (totalProfitAWeek / 6)) * 100));
    }, [allOrders]);

///////////////////////////////////////////////////////////////////////
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          <p className="text-gray-500">نظرة شاملة على أداء نظام الشحن</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button>إنشاء تقرير</Button>
          <Button variant="outline"
                className="ml-2"
                onClick={() => {
                    const data = [{
                        "الطلبات اليوم": countOrdersToday,
                        "الشحنات المعلقة": pendingOrdersToday,
                        "الشحنات المعلقة منذ اكثر من اسبوعين": previousPendingOrders,
                        "طلبات اليوم بالنسبة لمتوسط الطلبات خلال الاسبوع": ordersTodayRelativeToWeek,
                        "الإيرادات اليوم": moneysToday,
                        "ايرادات اليوم بالنسبة لمتوسط الايرادات خلال الاسبوع": profitTodayRelativeToWeek,
                        "المستخدمين النشطين": users.length,
                    }];
                    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "dashboard-info.json";
                    a.click();

                    URL.revokeObjectURL(url);
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
            <div className="text-2xl font-bold">{countOrdersToday}</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">%{ordersTodayRelativeToWeek} </span>بالنسبة لمتوسط الطلبات خلال الاسبوع
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
            <div className="text-2xl font-bold">{pendingOrdersToday}</div>
            <p className="text-xs text-gray-500">
              <span className="text-orange-600">+{previousPendingOrders} </span> منذ اكثر من اسبوعين
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
            <div className="text-2xl font-bold">{moneysToday} جنيه</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">{profitTodayRelativeToWeek}%</span> بالنسبة لمتوسط الايرادات خلال الاسبوع
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
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600">+createdAt(db)</span> مستخدمين جدد
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
                  if(item.label !== "لوحة التحكم" && item.label !== "المجموعات والأذونات"){
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                      <button
                          key={item.id}
                          onClick={() => onPageChange(item.id)}
                          className={`w-full cursor-pointer flex items-center px-3 py-2 rounded-lg text-right transition-colors ${
                              isActive
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                          <Icon className={`h-5 w-5 ml-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span>{item.label}</span>
                      </button>
                  );
              }})}
              {/*{menuItems.map((item) => {*/}
              {/*<Button*/}
              {/*  key={item.id}*/}
              {/*  onClick={() => onPageChange(item.id)}*/}
              {/*  variant="outline"*/}
              {/*  className="flex justify-between"*/}
              {/*>*/}
              {/*  <span>{item.label}</span>*/}
              {/*  {item.icon}*/}
              {/*</Button>*/}
              {/*})}*/}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

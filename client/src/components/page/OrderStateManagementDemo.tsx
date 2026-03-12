import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import type { Order, UserRole, OrderState } from '../../types';
import { OrderStateManager, StateHistoryDialog } from './OrderStateManager';
import { orderStateService } from '../../lib/orderStateService';
import { STATE_LABELS, getStateBadgeColor } from '../../lib/orderStateManager';
import { CheckCircle, AlertCircle, Clock, Truck, Package, XCircle } from 'lucide-react';

interface OrderStateManagementDemoProps {
  order: Order;
  currentUser: { 
    _id: string; 
    userType: UserRole; 
    fullName: string; 
  };
  onOrderUpdate?: (updatedOrder: Order) => void;
}

export const OrderStateManagementDemo: React.FC<OrderStateManagementDemoProps> = ({
  order,
  currentUser,
  onOrderUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showStateHistory, setShowStateHistory] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Get current order permissions
  const permissions = orderStateService.getOrderPermissions(order, currentUser.userType);

  // Handle state change
  const handleStateChange = useCallback(async (
    orderId: string,
    newState: OrderState,
    reason?: string
  ) => {
    setIsLoading(true);
    setNotification(null);

    try {
      const result = await orderStateService.changeOrderState(
        order,
        newState,
        currentUser.userType,
        currentUser._id,
        reason
      );

      if (result.success) {
        // Generate success notification
        const notificationMsg = orderStateService.generateNotificationMessage(
          order,
          order.status as OrderState,
          newState,
          currentUser.userType
        );

        setNotification({
          type: notificationMsg.type,
          title: notificationMsg.title,
          message: notificationMsg.description
        });

        // Update the order object (in a real app, you'd refetch from server)
        const updatedOrder = { ...order, status: newState };
        onOrderUpdate?.(updatedOrder);

      } else {
        setNotification({
          type: 'error',
          title: 'فشل في تحديث حالة الطلب',
          message: result.message || 'حدث خطأ غير متوقع'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'خطأ في الشبكة',
        message: 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [order, currentUser, onOrderUpdate]);

  // Get status icon
  const getStateIcon = (state: OrderState) => {
    const icons = {
      'Pending': <Clock className="w-4 h-4" />,
      'Processing': <Package className="w-4 h-4" />,
      'On the Way': <Truck className="w-4 h-4" />,
      'Delivered': <CheckCircle className="w-4 h-4" />,
      'Cancelled': <XCircle className="w-4 h-4" />
    };
    return icons[state] || <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">{notification.title}</div>
            <div className="text-sm">{notification.message}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Order State Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إدارة حالة الطلب</span>
            <div className="flex items-center gap-2">
              {getStateIcon(order.status as OrderState)}
              <Badge className={getStateBadgeColor(order.status as OrderState)}>
                {STATE_LABELS[order.status as OrderState]?.ar}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">رقم الطلب:</span> {order._id.slice(-8)}
            </div>
            <div>
              <span className="font-medium">العميل:</span> {order.customerName}
            </div>
            <div>
              <span className="font-medium">الهاتف:</span> {order.customerPhone1}
            </div>
            <div>
              <span className="font-medium">المدينة:</span> {order.city}
            </div>
          </div>

          {/* Current User Role Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">المستخدم الحالي:</span> {currentUser.fullName}
              <span className="ml-2 text-muted-foreground">({currentUser.userType})</span>
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="space-y-2">
            <h4 className="font-medium">الصلاحيات المتاحة:</h4>
            <div className="flex flex-wrap gap-2">
              {permissions.canProcess && (
                <Badge variant="outline" className="text-blue-600">
                  يمكن المعالجة
                </Badge>
              )}
              {permissions.canShip && (
                <Badge variant="outline" className="text-purple-600">
                  يمكن الشحن
                </Badge>
              )}
              {permissions.canDeliver && (
                <Badge variant="outline" className="text-green-600">
                  يمكن التسليم
                </Badge>
              )}
              {permissions.canCancel && (
                <Badge variant="outline" className="text-red-600">
                  يمكن الإلغاء
                </Badge>
              )}
              {!permissions.canEdit && (
                <Badge variant="outline" className="text-gray-600">
                  قراءة فقط
                </Badge>
              )}
            </div>
          </div>

          {/* Available Transitions */}
          {permissions.allowedTransitions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">التحولات المتاحة:</h4>
              <div className="flex flex-wrap gap-2">
                {permissions.allowedTransitions.map((state) => (
                  <Badge key={state} className={getStateBadgeColor(state)}>
                    {STATE_LABELS[state]?.ar}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* State Manager Component */}
          <div className="pt-4 border-t">
            <OrderStateManager
              order={order}
              userRole={currentUser.userType}
              onStateChange={handleStateChange}
              isLoading={isLoading}
            />
          </div>

          {/* State History Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStateHistory(true)}
              className="w-full"
            >
              عرض تاريخ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* State History Dialog */}
      <StateHistoryDialog
        stateHistory={order.stateHistory}
        isOpen={showStateHistory}
        onClose={() => setShowStateHistory(false)}
      />

      {/* Role-based Rules Info */}
      <Card>
        <CardHeader>
          <CardTitle>قواعد تغيير الحالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">الأدمن:</div>
              <div className="text-blue-700">يمكنه تغيير أي حالة طلب في أي وقت</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">الموظف:</div>
              <div className="text-green-700">
                يمكنه نقل الطلبات من "قيد الانتظار" → "قيد المعالجة" ويمكنه إلغاء الطلبات التي لم يتم شحنها بعد
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="font-medium text-orange-900">التاجر:</div>
              <div className="text-orange-700">
                يمكنه إلغاء الطلبات فقط إذا لم يبدأ الموظف بمعالجتها. خلاف ذلك، لديه صلاحية قراءة فقط
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">المندوب:</div>
              <div className="text-purple-700">
                يمكنه نقل الطلبات من "قيد المعالجة" → "في الطريق" → "تم التسليم". لا يمكنه تعديل الطلبات في حالات أخرى
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
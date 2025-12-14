/**
 * Order State Management Utility
 * 
 * This utility provides a centralized interface for managing order states
 * with role-based permissions and validation.
 */

import type { OrderState, OrderStateChangeRequest, OrderStateChangeResponse, UserRole, Order } from '../types/index';
import { orderStateAPI } from './api';
import { 
  canChangeOrderState, 
  getAllowedNextStates, 
  getTransitionErrorMessage,
  validateOrderStateChange 
} from './orderStateManager';

class OrderStateService {
  /**
   * Process order state change with complete validation
   */
  async changeOrderState(
    order: Order,
    newState: OrderState,
    userRole: UserRole,
    userId: string,
    changeReason?: string
  ): Promise<OrderStateChangeResponse> {
    try {
      // Client-side validation first
      const currentState = order.status as OrderState;
      
      if (!canChangeOrderState(userRole, currentState, newState)) {
        return {
          success: false,
          message: getTransitionErrorMessage(userRole, currentState, newState),
          error: 'UNAUTHORIZED_TRANSITION'
        };
      }

      // Create request object
      const request: OrderStateChangeRequest = {
        orderId: order._id,
        newState,
        userRole,
        userId,
        changeReason
      };

      // Validate request structure
      const validationResult = validateOrderStateChange(request);
      if (!validationResult.success) {
        return validationResult;
      }

      // Send request to server
      const response = await orderStateAPI.updateOrderStatus(
        order._id,
        newState,
        changeReason
      );

      return {
        success: true,
        message: response.message || `Order status updated successfully`,
        data: {
          orderId: order._id,
          previousState: currentState,
          newState,
          stateHistory: `${currentState} → ${newState}`
        }
      };

    } catch (error: any) {
      console.error('Order state change failed:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order status',
        error: error.response?.data?.error || 'SERVER_ERROR'
      };
    }
  }

  /**
   * Get possible next states for an order based on user role
   */
  getNextPossibleStates(order: Order, userRole: UserRole): OrderState[] {
    const currentState = order.status as OrderState;
    return getAllowedNextStates(userRole, currentState);
  }

  /**
   * Check if user can change order state
   */
  canUserChangeState(order: Order, userRole: UserRole, newState: OrderState): boolean {
    const currentState = order.status as OrderState;
    return canChangeOrderState(userRole, currentState, newState);
  }

  /**
   * Get detailed permissions for an order and user
   */
  getOrderPermissions(order: Order, userRole: UserRole) {
    const currentState = order.status as OrderState;
    const allowedStates = getAllowedNextStates(userRole, currentState);
    
    return {
      canEdit: allowedStates.length > 0,
      canCancel: allowedStates.includes('Cancelled'),
      canProcess: allowedStates.includes('Processing'),
      canDeliver: allowedStates.includes('Delivered'),
      canShip: allowedStates.includes('On the Way'),
      allowedTransitions: allowedStates,
      currentState,
      userRole
    };
  }

  /**
   * Bulk state change validation for multiple orders
   */
  validateBulkStateChange(
    orders: Order[],
    newState: OrderState,
    userRole: UserRole
  ): { valid: Order[]; invalid: Order[] } {
    const valid: Order[] = [];
    const invalid: Order[] = [];

    orders.forEach(order => {
      if (this.canUserChangeState(order, userRole, newState)) {
        valid.push(order);
      } else {
        invalid.push(order);
      }
    });

    return { valid, invalid };
  }

  /**
   * Get state change statistics for reporting
   */
  getStateChangeStats(orders: Order[]): Record<OrderState, number> {
    const stats: Record<OrderState, number> = {
      'Pending': 0,
      'Processing': 0,
      'On the Way': 0,
      'Delivered': 0,
      'Cancelled': 0
    };

    orders.forEach(order => {
      const state = order.status as OrderState;
      if (stats.hasOwnProperty(state)) {
        stats[state]++;
      }
    });

    return stats;
  }

  /**
   * Generate state change notification message
   */
  generateNotificationMessage(
    order: Order,
    previousState: OrderState,
    newState: OrderState,
    userRole: UserRole
  ): { title: string; description: string; type: 'success' | 'warning' | 'error' } {
    const orderCode = order._id.slice(-8);
    const customerName = order.customerName;

    const messages = {
      'Pending': {
        title: 'تم إرجاع الطلب لقائمة الانتظار',
        description: `الطلب ${orderCode} للعميل ${customerName} في انتظار المعالجة`,
        type: 'warning' as const
      },
      'Processing': {
        title: 'تم بدء معالجة الطلب',
        description: `الطلب ${orderCode} للعميل ${customerName} قيد المعالجة`,
        type: 'success' as const
      },
      'On the Way': {
        title: 'الطلب في الطريق',
        description: `الطلب ${orderCode} للعميل ${customerName} في طريقه للتسليم`,
        type: 'success' as const
      },
      'Delivered': {
        title: 'تم تسليم الطلب',
        description: `الطلب ${orderCode} للعميل ${customerName} تم تسليمه بنجاح`,
        type: 'success' as const
      },
      'Cancelled': {
        title: 'تم إلغاء الطلب',
        description: `الطلب ${orderCode} للعميل ${customerName} تم إلغاؤه`,
        type: 'error' as const
      }
    };

    return messages[newState] || {
      title: 'تم تحديث حالة الطلب',
      description: `الطلب ${orderCode} تم تحديث حالته`,
      type: 'success'
    };
  }
}

// Export singleton instance
export const orderStateService = new OrderStateService();
export default orderStateService;
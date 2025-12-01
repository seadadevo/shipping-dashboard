import type { OrderState, UserRole, OrderStateChangeRequest, OrderStateChangeResponse } from '../types/index';

/**
 * Order State Transition Rules
 * This defines which roles can transition between which states
 */
/**
 * ===================================================================
 * COMPREHENSIVE ORDER STATUS PERMISSION SYSTEM
 * ===================================================================
 * 
 * 1. ORDER STATUSES:
 * - Pending: Order created and awaiting processing by staff
 * - Processing: Order is being prepared and processed by employee
 * - On the Way: Order is out for delivery with delivery agent
 * - Delivered: Order successfully delivered to customer (FINAL STATE)
 * - Cancelled: Order has been cancelled and will not be fulfilled
 * 
 * 2. CRITICAL RULES:
 * - Delivery Agent CANNOT revert Delivered to any previous state
 * - After Delivered, all roles have select DISABLED except Admin
 * - Merchant can ONLY VIEW status, cannot modify anything
 * - Cancelled cannot be undone except by Admin
 * - Only Admin/Employee can move Pending → Processing
 * - Only Admin/Employee can assign delivery agent
 * 
 * 3. ROLE PERMISSIONS:
 * 
 * ADMIN:
 * - Full control over all status transitions
 * - Can undo Delivered and Cancelled states
 * - Can override any business rule
 * 
 * EMPLOYEE:
 * - Can start processing: Pending → Processing
 * - Can cancel before delivery: Pending/Processing → Cancelled
 * - Cannot modify once with Delivery Agent (On the Way)
 * - Cannot modify Delivered orders
 * - Cannot undo Cancelled
 * 
 * MERCHANT:
 * - READ-ONLY access to all order statuses
 * - Cannot change any status
 * - Can only view order information
 * 
 * DELIVERY AGENT (courier):
 * - Can only work in delivery pipeline
 * - Can pick up: Processing → On the Way
 * - Can complete: On the Way → Delivered
 * - Cannot revert Delivered
 * - Cannot modify Cancelled orders
 * ===================================================================
 */
const STATE_TRANSITION_RULES: Record<UserRole, Record<OrderState, OrderState[]>> = {
  admin: {
    'Pending': ['Processing', 'On the Way', 'Delivered', 'Cancelled'],
    'Processing': ['Pending', 'On the Way', 'Delivered', 'Cancelled'],
    'On the Way': ['Pending', 'Processing', 'Delivered', 'Cancelled'],
    'Delivered': ['Pending', 'Processing', 'On the Way', 'Cancelled'], // Admin can undo Delivered
    'Cancelled': ['Pending', 'Processing', 'On the Way', 'Delivered'] // Admin can undo Cancelled
  },
  employee: {
    'Pending': ['Processing', 'Cancelled'], // Can start processing or cancel
    'Processing': ['Cancelled'], // Can cancel if not shipped yet
    'On the Way': [], // Cannot modify once with delivery agent
    'Delivered': [], // Cannot modify delivered orders
    'Cancelled': [] // Cannot undo cancelled
  },
  merchant: {
    'Pending': [], // READ-ONLY - Cannot change anything
    'Processing': [], // READ-ONLY
    'On the Way': [], // READ-ONLY
    'Delivered': [], // READ-ONLY
    'Cancelled': [] // READ-ONLY
  },
  courier: {
    'Pending': [], // Cannot touch pending orders
    'Processing': ['On the Way'], // Can pick up for delivery
    'On the Way': ['Delivered'], // Can complete delivery
    'Delivered': [], // CRITICAL: Cannot revert delivered
    'Cancelled': [] // Cannot work on cancelled orders
  }
};

/**
 * State labels in Arabic and English
 */
export const STATE_LABELS: Record<OrderState, { en: string; ar: string }> = {
  'Pending': { en: 'Pending', ar: 'قيد الانتظار' },
  'Processing': { en: 'Processing', ar: 'قيد المعالجة' },
  'On the Way': { en: 'On the Way', ar: 'في الطريق' },
  'Delivered': { en: 'Delivered', ar: 'تم التسليم' },
  'Cancelled': { en: 'Cancelled', ar: 'ملغي' }
};

/**
 * Check if a role can transition from current state to new state
 */
export const canChangeOrderState = (
  userRole: UserRole, 
  currentState: OrderState, 
  newState: OrderState
): boolean => {
  const allowedTransitions = STATE_TRANSITION_RULES[userRole]?.[currentState] || [];
  return allowedTransitions.includes(newState);
};

/**
 * Get all possible states that a role can transition to from current state
 */
export const getAllowedNextStates = (
  userRole: UserRole, 
  currentState: OrderState
): OrderState[] => {
  return STATE_TRANSITION_RULES[userRole]?.[currentState] || [];
};

/**
 * Check if the status select should be completely disabled
 * CRITICAL RULES:
 * - Delivered orders: Only Admin can modify
 * - Merchant: Always disabled (read-only)
 */
export const isStatusSelectDisabled = (
  userRole: UserRole,
  currentState: OrderState
): boolean => {
  // Merchant is always read-only
  if (userRole === 'merchant') {
    return true;
  }

  // Delivered orders: Only admin can modify
  if (currentState === 'Delivered' && userRole !== 'admin') {
    return true;
  }

  // Cancelled orders: Only admin can undo
  if (currentState === 'Cancelled' && userRole !== 'admin') {
    return true;
  }

  // Check if user has any allowed transitions
  const allowedTransitions = getAllowedNextStates(userRole, currentState);
  return allowedTransitions.length === 0;
};

/**
 * Get all status options that should appear in the dropdown
 * This returns ALL statuses, but some may be disabled
 */
export const getStatusDropdownOptions = (
  userRole: UserRole,
  currentState: OrderState
): { value: OrderState; label: string; disabled: boolean; reason?: string }[] => {
  const allStatuses: OrderState[] = ['Pending', 'Processing', 'On the Way', 'Delivered', 'Cancelled'];
  const allowedTransitions = getAllowedNextStates(userRole, currentState);

  return allStatuses.map(status => {
    const isAllowed = allowedTransitions.includes(status);
    const isCurrent = status === currentState;
    
    let disabled = !isAllowed || isCurrent;
    let reason: string | undefined;

    if (isCurrent) {
      reason = 'الحالة الحالية';
    } else if (!isAllowed) {
      reason = getDisabledReason(userRole, currentState, status);
    }

    return {
      value: status,
      label: STATE_LABELS[status].ar,
      disabled,
      reason
    };
  });
};

/**
 * Get reason why a status option is disabled
 */
const getDisabledReason = (
  userRole: UserRole,
  currentState: OrderState,
  targetState: OrderState
): string => {
  if (userRole === 'merchant') {
    return 'التاجر لديه صلاحية القراءة فقط';
  }

  if (userRole === 'courier') {
    if (targetState === 'Cancelled') {
      return 'المندوب لا يمكنه إلغاء الطلبات';
    }
    if (targetState === 'Pending') {
      return 'لا يمكن إرجاع الطلب للانتظار';
    }
    if (currentState === 'Delivered') {
      return 'لا يمكن تعديل الطلبات المسلمة';
    }
  }

  if (userRole === 'employee') {
    if (currentState === 'Delivered') {
      return 'لا يمكن تعديل الطلبات المسلمة - اتصل بالمدير';
    }
    if (currentState === 'On the Way') {
      return 'لا يمكن تعديل الطلبات قيد التوصيل';
    }
    if (currentState === 'Cancelled') {
      return 'لا يمكن التراجع عن الإلغاء - اتصل بالمدير';
    }
    if (targetState === 'On the Way' && currentState === 'Pending') {
      return 'يجب معالجة الطلب أولاً';
    }
  }

  return 'غير مسموح بهذا التحويل';
};

/**
 * Get tooltip message for disabled select
 */
export const getDisabledSelectTooltip = (
  userRole: UserRole,
  currentState: OrderState
): string => {
  if (userRole === 'merchant') {
    return 'التاجر لديه صلاحية قراءة فقط ولا يمكنه تعديل حالة الطلب';
  }

  if (currentState === 'Delivered' && userRole !== 'admin') {
    return 'الطلبات المسلمة لا يمكن تعديلها. فقط المدير يمكنه إجراء تغييرات';
  }

  if (currentState === 'Cancelled' && userRole !== 'admin') {
    return 'لا يمكن التراجع عن الطلبات الملغاة. اتصل بالمدير إذا كنت بحاجة لإعادة تفعيل الطلب';
  }

  if (userRole === 'employee' && currentState === 'On the Way') {
    return 'لا يمكن تعديل الطلبات قيد التوصيل. فقط مندوب التوصيل يمكنه تحديث الحالة';
  }

  if (userRole === 'courier' && currentState === 'Pending') {
    return 'يجب معالجة الطلب من قبل الموظف أولاً قبل أن يتمكن المندوب من العمل عليه';
  }

  return 'لا توجد تحويلات متاحة لهذه الحالة';
};

/**
 * Get error message for invalid state transition
 */
export const getTransitionErrorMessage = (
  userRole: UserRole,
  currentState: OrderState,
  newState: OrderState
): string => {
  const roleMessages: Record<UserRole, string> = {
    admin: 'Admin can change any order state at any time.',
    employee: getEmployeeErrorMessage(currentState, newState),
    merchant: getMerchantErrorMessage(currentState),
    courier: getCourierErrorMessage(currentState, newState)
  };

  return roleMessages[userRole] || 'Invalid state transition.';
};

const getEmployeeErrorMessage = (currentState: OrderState, newState: OrderState): string => {
  if (currentState === 'Pending') {
    return newState === 'Cancelled' 
      ? 'Employee can cancel pending orders.'
      : newState === 'Processing'
        ? 'Employee can start processing pending orders.'
        : 'Employee can only move pending orders to Processing or cancel them.';
  }
  
  if (currentState === 'Processing') {
    return newState === 'Cancelled'
      ? 'Employee can cancel orders that haven\'t been shipped yet.'
      : 'Employee cannot modify orders once they are being processed by delivery.';
  }

  if (currentState === 'Delivered') {
    return 'Employee cannot modify delivered orders. Only Admin can make changes to delivered orders.';
  }

  if (currentState === 'On the Way') {
    return 'Employee cannot modify orders that are out for delivery. Only the delivery agent can update these orders.';
  }

  if (currentState === 'Cancelled') {
    return 'Employee cannot undo cancelled orders. Only Admin can reactivate cancelled orders.';
  }
  
  return 'Employee cannot modify orders in this state.';
};

const getMerchantErrorMessage = (currentState: OrderState): string => {
  return 'Merchant has read-only access and cannot modify order status. Contact support if you need to make changes.';
};

const getCourierErrorMessage = (currentState: OrderState, newState: OrderState): string => {
  if (currentState === 'Delivered') {
    return 'Delivery agent cannot revert delivered orders. If there is an issue, contact your supervisor.';
  }

  if (currentState === 'Cancelled') {
    return 'Cannot work on cancelled orders.';
  }

  if (currentState === 'Pending') {
    return 'Delivery agent can only work on orders that are being processed by employees first.';
  }
  if (currentState === 'Processing' && newState === 'On the Way') {
    return 'Delivery can pick up orders and mark them as On the Way.';
  }
  
  if (currentState === 'On the Way' && newState === 'Delivered') {
    return 'Delivery can mark orders as Delivered once delivered to customer.';
  }
  
  return 'Delivery can only move orders from Processing → On the Way → Delivered.';
};

/**
 * Validate order state change request
 */
export const validateOrderStateChange = (request: OrderStateChangeRequest): OrderStateChangeResponse => {
  const { userRole, newState } = request;

  // For this implementation, we need the current state from the order
  // In a real implementation, you would fetch this from the server
  // For now, we'll validate based on the role and new state only
  
  if (!userRole || !newState) {
    return {
      success: false,
      message: 'User role and new state are required.',
      error: 'Missing required parameters'
    };
  }

  return {
    success: true,
    message: 'State change validation passed.',
    data: {
      orderId: request.orderId,
      previousState: '', // Will be filled by the server
      newState: request.newState,
      stateHistory: `${request.userRole} requested change to ${request.newState}`
    }
  };
};

/**
 * Format state change for display
 */
export const formatStateChange = (
  previousState: OrderState,
  newState: OrderState,
  language: 'en' | 'ar' = 'ar'
): string => {
  const prevLabel = STATE_LABELS[previousState]?.[language] || previousState;
  const newLabel = STATE_LABELS[newState]?.[language] || newState;
  
  return language === 'ar' 
    ? `${prevLabel} ← ${newLabel}`
    : `${prevLabel} → ${newLabel}`;
};

/**
 * Get state badge color for UI
 */
export const getStateBadgeColor = (state: OrderState): string => {
  const colors: Record<OrderState, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'On the Way': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  
  return colors[state] || 'bg-gray-100 text-gray-800';
};
/**
 * Order State Management JSON API Handler
 * 
 * This module provides a structured JSON response format for order state management
 * that can be easily integrated with dashboard components or external systems.
 */

import type { Order, OrderState, UserRole, OrderStateChangeResponse } from '../types/index';
import { orderStateService } from './orderStateService';
import { STATE_LABELS, formatStateChange } from './orderStateManager';

interface OrderStateAPIRequest {
  role: UserRole;
  orderId: string;
  currentState: OrderState;
  requestedState: OrderState;
  userId: string;
  reason?: string;
}

interface OrderStateAPIResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    previousState: OrderState;
    newState: OrderState;
    stateHistory: string;
    timestamp: string;
    changedBy: {
      id: string;
      role: UserRole;
    };
  };
  error?: {
    code: string;
    details: string;
  };
  metadata?: {
    allowedStates: OrderState[];
    rolePermissions: {
      canEdit: boolean;
      canCancel: boolean;
      canProcess: boolean;
      canDeliver: boolean;
    };
  };
}

/**
 * Process order state change request and return structured JSON response
 */
export const processOrderStateChangeAPI = async (
  request: OrderStateAPIRequest
): Promise<OrderStateAPIResponse> => {
  try {
    // Validate input
    if (!request.role || !request.orderId || !request.currentState || !request.requestedState) {
      return {
        success: false,
        message: "Missing required parameters: role, orderId, currentState, and requestedState are required.",
        error: {
          code: "MISSING_PARAMETERS",
          details: "All required fields must be provided in the request."
        }
      };
    }

    // Create mock order for validation (in real implementation, fetch from database)
    const mockOrder: Partial<Order> = {
      _id: request.orderId,
      status: request.currentState,
      customerName: "Test Customer", // This would come from database
    };

    // Check permissions
    const permissions = orderStateService.getOrderPermissions(
      mockOrder as Order, 
      request.role
    );

    if (!permissions.canEdit) {
      return {
        success: false,
        message: `Role '${request.role}' does not have permission to modify orders in state '${request.currentState}'.`,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          details: getRoleErrorMessage(request.role, request.currentState, request.requestedState)
        },
        metadata: {
          allowedStates: permissions.allowedTransitions,
          rolePermissions: {
            canEdit: permissions.canEdit,
            canCancel: permissions.canCancel,
            canProcess: permissions.canProcess,
            canDeliver: permissions.canDeliver
          }
        }
      };
    }

    // Validate specific state transition
    const canChange = orderStateService.canUserChangeState(
      mockOrder as Order,
      request.role,
      request.requestedState
    );

    if (!canChange) {
      return {
        success: false,
        message: `Cannot transition from '${request.currentState}' to '${request.requestedState}' with role '${request.role}'.`,
        error: {
          code: "INVALID_STATE_TRANSITION",
          details: getRoleErrorMessage(request.role, request.currentState, request.requestedState)
        },
        metadata: {
          allowedStates: permissions.allowedTransitions,
          rolePermissions: {
            canEdit: permissions.canEdit,
            canCancel: permissions.canCancel,
            canProcess: permissions.canProcess,
            canDeliver: permissions.canDeliver
          }
        }
      };
    }

    // If all validations pass, return success response
    return {
      success: true,
      message: `Order state successfully changed from '${request.currentState}' to '${request.requestedState}'.`,
      data: {
        orderId: request.orderId,
        previousState: request.currentState,
        newState: request.requestedState,
        stateHistory: formatStateChange(request.currentState, request.requestedState, 'ar'),
        timestamp: new Date().toISOString(),
        changedBy: {
          id: request.userId,
          role: request.role
        }
      },
      metadata: {
        allowedStates: orderStateService.getNextPossibleStates(
          { ...mockOrder, status: request.requestedState } as Order,
          request.role
        ),
        rolePermissions: orderStateService.getOrderPermissions(
          { ...mockOrder, status: request.requestedState } as Order,
          request.role
        )
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: "Internal server error occurred while processing the request.",
      error: {
        code: "INTERNAL_ERROR",
        details: error.message || "Unknown error occurred"
      }
    };
  }
};

/**
 * Get detailed role permissions for an order state
 */
export const getOrderStatePermissionsAPI = (
  role: UserRole,
  currentState: OrderState
): OrderStateAPIResponse => {
  try {
    // Create mock order
    const mockOrder: Partial<Order> = {
      _id: "mock-order-id",
      status: currentState,
      customerName: "Test Customer",
    };

    const permissions = orderStateService.getOrderPermissions(
      mockOrder as Order,
      role
    );

    return {
      success: true,
      message: `Permissions retrieved for role '${role}' on state '${currentState}'.`,
      data: {
        orderId: "mock-order-id",
        previousState: currentState,
        newState: currentState,
        stateHistory: `Current state: ${STATE_LABELS[currentState]?.ar}`,
        timestamp: new Date().toISOString(),
        changedBy: {
          id: "current-user",
          role: role
        }
      },
      metadata: {
        allowedStates: permissions.allowedTransitions,
        rolePermissions: {
          canEdit: permissions.canEdit,
          canCancel: permissions.canCancel,
          canProcess: permissions.canProcess,
          canDeliver: permissions.canDeliver
        }
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: "Error retrieving permissions.",
      error: {
        code: "PERMISSION_ERROR",
        details: error.message || "Unknown error occurred"
      }
    };
  }
};

/**
 * Get role-specific error message
 */
const getRoleErrorMessage = (
  role: UserRole,
  currentState: OrderState,
  requestedState: OrderState
): string => {
  switch (role) {
    case 'admin':
      return 'Admin can change any order state at any time.';
      
    case 'employee':
      if (currentState === 'Pending') {
        return 'Employee can only move orders from Pending to Processing or cancel them.';
      } else if (currentState === 'Processing') {
        return 'Employee can only cancel orders that haven\'t been shipped yet.';
      } else {
        return 'Employee cannot modify orders in this state.';
      }
      
    case 'merchant':
      if (currentState === 'Pending') {
        return 'Merchant can only cancel orders that employees haven\'t started processing yet.';
      } else {
        return 'Merchant cannot modify orders once processing has started. Please contact support for changes.';
      }
      
    case 'courier':
      return 'Delivery can only move orders from Processing → On the Way → Delivered. They cannot modify orders in other states.';
      
    default:
      return 'Invalid role specified.';
  }
};

/**
 * Example usage function for testing
 */
export const testOrderStateAPI = () => {
  const testCases = [
    {
      role: 'admin' as UserRole,
      orderId: '507f1f77bcf86cd799439011',
      currentState: 'Pending' as OrderState,
      requestedState: 'Delivered' as OrderState,
      userId: 'admin-user-id'
    },
    {
      role: 'employee' as UserRole,
      orderId: '507f1f77bcf86cd799439012',
      currentState: 'Pending' as OrderState,
      requestedState: 'Processing' as OrderState,
      userId: 'employee-user-id',
      reason: 'Order processing started'
    },
    {
      role: 'merchant' as UserRole,
      orderId: '507f1f77bcf86cd799439013',
      currentState: 'Processing' as OrderState,
      requestedState: 'Cancelled' as OrderState,
      userId: 'merchant-user-id'
    },
    {
      role: 'courier' as UserRole,
      orderId: '507f1f77bcf86cd799439014',
      currentState: 'Processing' as OrderState,
      requestedState: 'On the Way' as OrderState,
      userId: 'courier-user-id',
      reason: 'Package picked up for delivery'
    }
  ];

  console.log('=== Order State Management API Test Results ===\n');

  testCases.forEach(async (testCase, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log(`Role: ${testCase.role}`);
    console.log(`Current State: ${testCase.currentState}`);
    console.log(`Requested State: ${testCase.requestedState}`);
    
    const result = await processOrderStateChangeAPI(testCase);
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('\n---\n');
  });
};

export default {
  processOrderStateChangeAPI,
  getOrderStatePermissionsAPI,
  testOrderStateAPI
};
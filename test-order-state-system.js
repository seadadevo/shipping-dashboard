#!/usr/bin/env node

/**
 * Order State Management System Test Script
 * 
 * This script demonstrates the complete functionality of the order state management system
 * including role-based permissions, state transitions, and error handling.
 */

const testOrderStateManagement = () => {
  console.log('🚀 Order State Management System Demo\n');
  console.log('=====================================\n');

  // Test cases representing different scenarios
  const testScenarios = [
    {
      title: "✅ Admin changing any state (should succeed)",
      role: "admin",
      orderId: "64a1b2c3d4e5f6789012345a",
      currentState: "Pending",
      requestedState: "Delivered",
      userId: "admin-123",
      reason: "Admin override - direct delivery"
    },
    {
      title: "✅ Employee processing pending order (should succeed)",
      role: "employee",
      orderId: "64a1b2c3d4e5f6789012345b",
      currentState: "Pending",
      requestedState: "Processing",
      userId: "employee-456",
      reason: "Starting order processing"
    },
    {
      title: "❌ Employee trying to deliver order (should fail)",
      role: "employee",
      orderId: "64a1b2c3d4e5f6789012345c",
      currentState: "On the Way",
      requestedState: "Delivered",
      userId: "employee-456",
      reason: "Employee trying to mark as delivered"
    },
    {
      title: "✅ Merchant cancelling pending order (should succeed)",
      role: "merchant",
      orderId: "64a1b2c3d4e5f6789012345d",
      currentState: "Pending",
      requestedState: "Cancelled",
      userId: "merchant-789",
      reason: "Customer requested cancellation"
    },
    {
      title: "❌ Merchant trying to cancel processing order (should fail)",
      role: "merchant",
      orderId: "64a1b2c3d4e5f6789012345e",
      currentState: "Processing",
      requestedState: "Cancelled",
      userId: "merchant-789",
      reason: "Trying to cancel after processing started"
    },
    {
      title: "✅ Courier moving order to 'On the Way' (should succeed)",
      role: "courier",
      orderId: "64a1b2c3d4e5f6789012345f",
      currentState: "Processing",
      requestedState: "On the Way",
      userId: "courier-101",
      reason: "Package picked up for delivery"
    },
    {
      title: "✅ Courier delivering order (should succeed)",
      role: "courier",
      orderId: "64a1b2c3d4e5f6789012345g",
      currentState: "On the Way",
      requestedState: "Delivered",
      userId: "courier-101",
      reason: "Package delivered to customer"
    },
    {
      title: "❌ Courier trying to cancel order (should fail)",
      role: "courier",
      orderId: "64a1b2c3d4e5f6789012345h",
      currentState: "Processing",
      requestedState: "Cancelled",
      userId: "courier-101",
      reason: "Courier trying to cancel"
    }
  ];

  // Simulate the API responses
  testScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.title}`);
    console.log('─'.repeat(50));
    
    const response = simulateOrderStateAPI(scenario);
    
    // Display results in a structured format
    console.log(`📋 Request Details:`);
    console.log(`   Role: ${scenario.role}`);
    console.log(`   Order ID: ${scenario.orderId.slice(-8)}`);
    console.log(`   Current State: ${scenario.currentState} (${getArabicState(scenario.currentState)})`);
    console.log(`   Requested State: ${scenario.requestedState} (${getArabicState(scenario.requestedState)})`);
    console.log(`   Reason: ${scenario.reason}`);
    
    console.log(`\n📤 Response:`);
    if (response.success) {
      console.log(`   ✅ Status: SUCCESS`);
      console.log(`   📝 Message: ${response.message}`);
      console.log(`   🔄 State Change: ${response.data.stateHistory}`);
      console.log(`   ⏰ Timestamp: ${new Date(response.data.timestamp).toLocaleString('ar-EG')}`);
      
      if (response.metadata?.allowedStates) {
        console.log(`   🎯 Next Allowed States: ${response.metadata.allowedStates.map(s => getArabicState(s)).join(', ')}`);
      }
    } else {
      console.log(`   ❌ Status: FAILED`);
      console.log(`   📝 Message: ${response.message}`);
      console.log(`   🔴 Error Code: ${response.error.code}`);
      console.log(`   📄 Details: ${response.error.details}`);
      
      if (response.metadata?.allowedStates) {
        console.log(`   ✅ Allowed States: ${response.metadata.allowedStates.map(s => getArabicState(s)).join(', ')}`);
      }
    }
  });

  // Role permissions summary
  console.log('\n\n📊 Role Permissions Summary');
  console.log('═'.repeat(50));
  
  const roles = ['admin', 'employee', 'merchant', 'courier'];
  const states = ['Pending', 'Processing', 'On the Way', 'Delivered', 'Cancelled'];
  
  roles.forEach(role => {
    console.log(`\n👤 ${role.toUpperCase()} Permissions:`);
    states.forEach(state => {
      const permissions = getPermissionsForRoleAndState(role, state);
      console.log(`   ${getArabicState(state)}: ${permissions.join(', ') || 'لا توجد صلاحيات'}`);
    });
  });

  console.log('\n\n🎯 System Rules Summary');
  console.log('═'.repeat(50));
  console.log('🔹 Admin: يمكنه تغيير أي حالة طلب في أي وقت');
  console.log('🔹 Employee: يمكنه نقل الطلبات من "قيد الانتظار" → "قيد المعالجة" ويمكنه إلغاء الطلبات التي لم يتم شحنها');
  console.log('🔹 Merchant: يمكنه إلغاء الطلبات فقط إذا لم يبدأ الموظف بمعالجتها');
  console.log('🔹 Courier: يمكنه نقل الطلبات من "قيد المعالجة" → "في الطريق" → "تم التسليم"');
  
  console.log('\n✨ Demo completed successfully!\n');
};

// Helper functions for simulation
const simulateOrderStateAPI = (scenario) => {
  const stateTransitionRules = {
    admin: {
      'Pending': ['Processing', 'On the Way', 'Delivered', 'Cancelled'],
      'Processing': ['Pending', 'On the Way', 'Delivered', 'Cancelled'],
      'On the Way': ['Pending', 'Processing', 'Delivered', 'Cancelled'],
      'Delivered': ['Pending', 'Processing', 'On the Way', 'Cancelled'],
      'Cancelled': ['Pending', 'Processing', 'On the Way', 'Delivered']
    },
    employee: {
      'Pending': ['Processing', 'Cancelled'],
      'Processing': ['Cancelled'],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    merchant: {
      'Pending': ['Cancelled'],
      'Processing': [],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    courier: {
      'Pending': [],
      'Processing': ['On the Way'],
      'On the Way': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    }
  };

  const allowedTransitions = stateTransitionRules[scenario.role]?.[scenario.currentState] || [];
  const canTransition = allowedTransitions.includes(scenario.requestedState);

  if (canTransition) {
    return {
      success: true,
      message: `Order status successfully changed from '${scenario.currentState}' to '${scenario.requestedState}'.`,
      data: {
        orderId: scenario.orderId,
        previousState: scenario.currentState,
        newState: scenario.requestedState,
        stateHistory: `${getArabicState(scenario.currentState)} ← ${getArabicState(scenario.requestedState)}`,
        timestamp: new Date().toISOString(),
        changedBy: {
          id: scenario.userId,
          role: scenario.role
        }
      },
      metadata: {
        allowedStates: stateTransitionRules[scenario.role]?.[scenario.requestedState] || [],
        rolePermissions: {
          canEdit: true,
          canCancel: allowedTransitions.includes('Cancelled'),
          canProcess: allowedTransitions.includes('Processing'),
          canDeliver: allowedTransitions.includes('Delivered')
        }
      }
    };
  } else {
    return {
      success: false,
      message: `Cannot transition from '${scenario.currentState}' to '${scenario.requestedState}' with role '${scenario.role}'.`,
      error: {
        code: "INVALID_STATE_TRANSITION",
        details: getRoleErrorMessage(scenario.role, scenario.currentState, scenario.requestedState)
      },
      metadata: {
        allowedStates: allowedTransitions,
        rolePermissions: {
          canEdit: allowedTransitions.length > 0,
          canCancel: allowedTransitions.includes('Cancelled'),
          canProcess: allowedTransitions.includes('Processing'),
          canDeliver: allowedTransitions.includes('Delivered')
        }
      }
    };
  }
};

const getArabicState = (state) => {
  const stateLabels = {
    'Pending': 'قيد الانتظار',
    'Processing': 'قيد المعالجة',
    'On the Way': 'في الطريق',
    'Delivered': 'تم التسليم',
    'Cancelled': 'ملغي'
  };
  return stateLabels[state] || state;
};

const getRoleErrorMessage = (role, currentState, requestedState) => {
  switch (role) {
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
        return 'Merchant cannot modify orders once processing has started.';
      }
    case 'courier':
      return 'Delivery can only move orders from Processing → On the Way → Delivered.';
    default:
      return 'Invalid role specified.';
  }
};

const getPermissionsForRoleAndState = (role, state) => {
  const stateTransitionRules = {
    admin: {
      'Pending': ['Processing', 'On the Way', 'Delivered', 'Cancelled'],
      'Processing': ['Pending', 'On the Way', 'Delivered', 'Cancelled'],
      'On the Way': ['Pending', 'Processing', 'Delivered', 'Cancelled'],
      'Delivered': ['Pending', 'Processing', 'On the Way', 'Cancelled'],
      'Cancelled': ['Pending', 'Processing', 'On the Way', 'Delivered']
    },
    employee: {
      'Pending': ['Processing', 'Cancelled'],
      'Processing': ['Cancelled'],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    merchant: {
      'Pending': ['Cancelled'],
      'Processing': [],
      'On the Way': [],
      'Delivered': [],
      'Cancelled': []
    },
    courier: {
      'Pending': [],
      'Processing': ['On the Way'],
      'On the Way': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    }
  };

  const transitions = stateTransitionRules[role]?.[state] || [];
  return transitions.map(getArabicState);
};

// Run the test if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testOrderStateManagement();
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = {
    testOrderStateManagement,
    simulateOrderStateAPI,
    getArabicState
  };
}
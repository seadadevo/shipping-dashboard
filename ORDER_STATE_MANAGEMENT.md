# Order State Management System

A comprehensive role-based order state management system for the shipping dashboard application with full Arabic and English support.

## 🎯 Overview

This system implements a robust order state management solution with role-based permissions that allows different user types to manage order states according to predefined business rules.

## 📋 Order States

1. **Pending (قيد الانتظار)** - Initial state when order is created
2. **Processing (قيد المعالجة)** - Order is being processed by staff
3. **On the Way (في الطريق)** - Order is out for delivery
4. **Delivered (تم التسليم)** - Order successfully delivered to customer
5. **Cancelled (ملغي)** - Order has been cancelled

## 👥 User Roles & Permissions

### 🔹 Admin

- **Full Control**: Can change any order state at any time
- Can override any state transition for business needs
- Has access to all order management functions

### 🔹 Employee

- **Limited Processing Control**:
  - Can move orders from `Pending` → `Processing`
  - Can cancel orders that haven't been shipped yet (`Pending` or `Processing`)
- Cannot modify orders once they're with delivery (`On the Way` or `Delivered`)

### 🔹 Merchant

- **Minimal Control**:
  - Can only cancel `Pending` orders (before employee processing starts)
  - Has read-only access to orders once processing begins
  - Must contact support for changes to processed orders

### 🔹 Courier/Delivery

- **Delivery Flow Control**:
  - Can move orders from `Processing` → `On the Way`
  - Can move orders from `On the Way` → `Delivered`
  - Cannot modify orders in any other states

## 🏗️ Architecture

### Server-Side Components

1. **Order Model** (`/server/models/Order.js`)

   - Updated with new state enum and state history tracking
   - Includes validation for state transitions

2. **Order Controller** (`/server/controllers/orderController.js`)

   - Enhanced `updateOrderStatus` function with role-based validation
   - State history tracking for audit purposes

3. **Order Routes** (`/server/routes/orderRoutes.js`)
   - RESTful endpoints for state management
   - Permission-based route protection

### Client-Side Components

1. **Type Definitions** (`/client/src/types/index.ts`)

   - Complete TypeScript interfaces for order state management
   - Type safety for all operations

2. **State Manager** (`/client/src/lib/orderStateManager.ts`)

   - Core business logic for state transitions
   - Validation and permission checking functions

3. **Service Layer** (`/client/src/lib/orderStateService.ts`)

   - High-level service for order state operations
   - Integration with API calls and error handling

4. **React Components** (`/client/src/components/OrderStateManager.tsx`)

   - User interface for state management
   - Interactive dialogs and state history display

5. **API Integration** (`/client/src/lib/api.ts`)
   - HTTP client integration for server communication
   - Error handling and response processing

## 🚀 Usage Examples

### Basic State Change

```javascript
import { orderStateService } from "./lib/orderStateService";

// Change order state with validation
const result = await orderStateService.changeOrderState(
  order, // Order object
  "Processing", // New state
  "employee", // User role
  "user-123", // User ID
  "Starting processing" // Optional reason
);

if (result.success) {
  console.log("State changed successfully:", result.message);
} else {
  console.error("State change failed:", result.message);
}
```

### Check Permissions

```javascript
import { orderStateService } from "./lib/orderStateService";

// Get user permissions for an order
const permissions = orderStateService.getOrderPermissions(order, "merchant");

console.log("Can edit order:", permissions.canEdit);
console.log("Can cancel order:", permissions.canCancel);
console.log("Allowed transitions:", permissions.allowedTransitions);
```

### React Component Usage

```jsx
import { OrderStateManager } from "./components/OrderStateManager";

function OrderCard({ order, user }) {
  const handleStateChange = async (orderId, newState, reason) => {
    // Handle state change logic
    const result = await orderStateService.changeOrderState(
      order,
      newState,
      user.userType,
      user._id,
      reason
    );

    if (result.success) {
      // Update UI or refetch data
      refreshOrderData();
    }
  };

  return (
    <div className="order-card">
      <OrderStateManager
        order={order}
        userRole={user.userType}
        onStateChange={handleStateChange}
      />
    </div>
  );
}
```

## 🔗 API Endpoints

### Update Order Status

```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Processing",
  "changeReason": "Order processing started"
}
```

### Get State History

```http
GET /api/orders/:id/state-history
Authorization: Bearer <token>
```

### Validate State Change

```http
POST /api/orders/:id/validate-state-change
Authorization: Bearer <token>
Content-Type: application/json

{
  "newState": "Delivered"
}
```

## 📊 JSON Response Format

### Successful State Change

```json
{
  "success": true,
  "message": "Order status updated from Pending to Processing",
  "data": {
    "order": {
      /* updated order object */
    },
    "stateHistory": "Pending → Processing"
  }
}
```

### Failed State Change

```json
{
  "success": false,
  "message": "Employee cannot modify orders in this state",
  "error": {
    "code": "UNAUTHORIZED_TRANSITION",
    "details": "Employee can only move orders from Pending to Processing or cancel them."
  }
}
```

## 🧪 Testing

The system includes a comprehensive test script that demonstrates all functionality:

```bash
# Run the test script
node test-order-state-system.js
```

This will show:

- ✅ Valid state transitions
- ❌ Invalid state transitions with proper error messages
- 📊 Role permission summaries
- 🎯 Complete system rules documentation

## 🔧 Installation & Setup

### Server Setup

1. Update your Order model with the new state enum
2. Replace the `updateOrderStatus` controller function
3. Update your routes to include new endpoints
4. Install required dependencies (already included in existing setup)

### Client Setup

1. Add the new type definitions to your types file
2. Import the order state management components
3. Integrate the `OrderStateManager` component into your existing order management UI
4. Update API calls to use the new endpoints

## 🎨 UI Features

- **Interactive State Badges**: Visual indicators for current order state
- **Permission-Based Buttons**: Only show actions the user can perform
- **State Change Dialog**: User-friendly interface for changing states
- **State History**: Complete audit trail of all state changes
- **Error Handling**: Clear error messages for invalid operations
- **Arabic/English Support**: Full bilingual interface

## 🛡️ Security Features

- **Role-Based Access Control**: Strict permission checking at all levels
- **Server-Side Validation**: All state changes validated on the server
- **Audit Trail**: Complete history of who changed what and when
- **Error Handling**: Graceful handling of unauthorized operations
- **Type Safety**: Full TypeScript support prevents runtime errors

## 🔄 Integration with Existing Components

The system is designed to integrate seamlessly with your existing order management components. Simply import the `OrderStateManager` component and replace your existing status update logic.

## 📚 Additional Resources

- **Test Script**: `test-order-state-system.js` - Complete demonstration
- **API Handler**: `orderStateAPI.ts` - JSON API integration
- **Service Layer**: `orderStateService.ts` - High-level operations
- **React Components**: Ready-to-use UI components with Arabic support

## 🎯 Business Rules Summary

The system enforces these business rules:

1. **Admin Override**: Admins can change any state at any time for business needs
2. **Employee Processing**: Employees manage the initial processing workflow
3. **Merchant Cancellation**: Merchants can only cancel before processing starts
4. **Delivery Chain**: Couriers manage the delivery pipeline exclusively
5. **State History**: All changes are tracked for audit purposes
6. **Permission Validation**: Every action is validated against user role

This creates a robust, secure, and user-friendly order state management system that scales with your business needs.

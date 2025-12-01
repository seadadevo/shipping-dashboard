# COMPREHENSIVE ORDER STATUS PERMISSION SYSTEM

## Shipping Dashboard - Complete Implementation Guide

---

## 1. ORDER STATUSES

### Status Definitions

| Status         | Arabic       | Description                                            |
| -------------- | ------------ | ------------------------------------------------------ |
| **Pending**    | قيد الانتظار | Order created and awaiting processing by staff         |
| **Processing** | قيد المعالجة | Order is being prepared and processed by employee      |
| **On the Way** | في الطريق    | Order is out for delivery with delivery agent          |
| **Delivered**  | تم التسليم   | Order successfully delivered to customer (FINAL STATE) |
| **Cancelled**  | ملغي         | Order has been cancelled and will not be fulfilled     |

---

## 2. PERMISSIONS PER ROLE

### 🔴 ADMIN (المدير)

**Full System Control - Override All Rules**

#### Allowed Transitions:

- **From Pending →** Processing, On the Way, Delivered, Cancelled
- **From Processing →** Pending, On the Way, Delivered, Cancelled
- **From On the Way →** Pending, Processing, Delivered, Cancelled
- **From Delivered →** Pending, Processing, On the Way, Cancelled ✅ **Can Undo**
- **From Cancelled →** Pending, Processing, On the Way, Delivered ✅ **Can Undo**

#### Forbidden:

- **NOTHING** - Admin can do everything

#### UI Behavior:

- ✅ Select dropdown **ALWAYS ENABLED**
- ✅ All status options **ENABLED**
- ✅ Can override any business rule
- ✅ Can assign/reassign delivery agents at any time

---

### 🟡 EMPLOYEE (الموظف)

**Order Processing & Pre-Delivery Management**

#### Allowed Transitions:

- **From Pending →** Processing, Cancelled
  - Can start order processing
  - Can cancel if customer requests before processing
- **From Processing →** Cancelled
  - Can cancel if not yet shipped

#### Forbidden:

- ❌ **Cannot modify** On the Way orders (with delivery agent)
- ❌ **Cannot modify** Delivered orders (contact admin)
- ❌ **Cannot undo** Cancelled orders

#### UI Behavior:

- **Pending Status:**
  - ✅ Select **ENABLED**
  - ✅ Show: Processing, Cancelled
  - ❌ Disable: On the Way (tooltip: "يجب معالجة الطلب أولاً")
- **Processing Status:**
  - ✅ Select **ENABLED**
  - ✅ Show: Cancelled
  - ❌ Disable all others
- **On the Way Status:**
  - ❌ Select **DISABLED**
  - 💬 Tooltip: "لا يمكن تعديل الطلبات قيد التوصيل"
- **Delivered Status:**
  - ❌ Select **DISABLED**
  - 💬 Tooltip: "لا يمكن تعديل الطلبات المسلمة - اتصل بالمدير"
- **Cancelled Status:**
  - ❌ Select **DISABLED**
  - 💬 Tooltip: "لا يمكن التراجع عن الإلغاء - اتصل بالمدير"

#### Assignment Permissions:

- ✅ Can assign delivery agent to orders
- ✅ Can reassign delivery agent if order not shipped

---

### 🟢 MERCHANT (التاجر)

**READ-ONLY ACCESS**

#### Allowed Transitions:

- **NONE** - Complete read-only access

#### Forbidden:

- ❌ **Cannot change ANY status**
- ❌ **Cannot assign** delivery agents
- ❌ **Cannot modify** order details

#### UI Behavior:

- ❌ Select dropdown **ALWAYS DISABLED**
- 💬 Tooltip: "التاجر لديه صلاحية قراءة فقط ولا يمكنه تعديل حالة الطلب"
- 📋 Can only **VIEW** order information
- 📞 Must **contact support** for any changes

---

### 🔵 DELIVERY AGENT / COURIER (المندوب)

**Delivery Pipeline Only**

#### Allowed Transitions:

- **From Processing →** On the Way
  - Can pick up order for delivery
- **From On the Way →** Delivered
  - Can mark as delivered after customer receives

#### Forbidden:

- ❌ **Cannot touch** Pending orders (not assigned yet)
- ❌ **Cannot revert** Delivered orders ⚠️ **CRITICAL RULE**
- ❌ **Cannot work on** Cancelled orders
- ❌ **Cannot cancel** orders
- ❌ **Cannot modify** order before pickup

#### UI Behavior:

- **Pending Status:**
  - ❌ Select **DISABLED**
  - 💬 Tooltip: "يجب معالجة الطلب من قبل الموظف أولاً"
- **Processing Status:**
  - ✅ Select **ENABLED**
  - ✅ Show: On the Way
  - ❌ Disable: Pending, Delivered, Cancelled
- **On the Way Status:**
  - ✅ Select **ENABLED**
  - ✅ Show: Delivered
  - ❌ Disable all others
- **Delivered Status:**
  - ❌ Select **DISABLED** ⚠️ **CRITICAL**
  - 💬 Tooltip: "لا يمكن تعديل الطلبات المسلمة"
- **Cancelled Status:**
  - ❌ Select **DISABLED**
  - 💬 Tooltip: "لا يمكن العمل على الطلبات الملغاة"

---

## 3. UI HANDLING RULES

### Select Dropdown Behavior

#### When to DISABLE Select Completely:

```typescript
1. Role is Merchant → ALWAYS DISABLED
2. Status is Delivered AND role ≠ Admin → DISABLED
3. Status is Cancelled AND role ≠ Admin → DISABLED
4. Role has NO allowed transitions for current status → DISABLED
```

#### Dropdown Options Display Logic:

```typescript
// Show ALL statuses in dropdown
// But mark some as DISABLED with tooltips

For each status option:
  - If status === currentStatus → DISABLED (current state)
  - If status NOT in allowedTransitions → DISABLED with reason tooltip
  - If status in allowedTransitions → ENABLED
```

### Error Handling

#### When User Tries Forbidden Action:

1. **Frontend Validation:**
   - Show toast/alert with clear Arabic message
   - Example: "التاجر لديه صلاحية قراءة فقط"
2. **Backend Validation:**

   - Return 403 Forbidden status
   - Include detailed error message
   - Example: `{ success: false, error: "UNAUTHORIZED_TRANSITION", message: "..." }`

3. **UI Feedback:**
   - Red border on select if error
   - Display error message below select
   - Auto-dismiss after 5 seconds
   - Log error for support tracking

### Tooltip Display:

```typescript
// Hover over disabled select
→ Show role-specific reason

// Hover over disabled option
→ Show why that transition is forbidden
```

---

## 4. CRITICAL IMPLEMENTATION RULES

### Rule 1: Delivery Agent Cannot Revert Delivered

```typescript
// Backend validation
if (userRole === "courier" && currentState === "Delivered") {
  return {
    success: false,
    error: "DELIVERY_CANNOT_REVERT_DELIVERED",
    message: "Delivery agent cannot revert delivered orders",
  };
}

// Frontend UI
if (userRole === "courier" && currentState === "Delivered") {
  isSelectDisabled = true;
  tooltip = "لا يمكن تعديل الطلبات المسلمة";
}
```

### Rule 2: After Delivered, Only Admin Can Modify

```typescript
// Backend validation
if (currentState === "Delivered" && userRole !== "admin") {
  return {
    success: false,
    error: "DELIVERED_LOCKED",
    message: "Only Admin can modify delivered orders",
  };
}

// Frontend UI
if (currentState === "Delivered" && userRole !== "admin") {
  isSelectDisabled = true;
  tooltip = "فقط المدير يمكنه تعديل الطلبات المسلمة";
}
```

### Rule 3: Merchant is Read-Only

```typescript
// Backend validation
if (userRole === "merchant") {
  return {
    success: false,
    error: "MERCHANT_READ_ONLY",
    message: "Merchant has read-only access",
  };
}

// Frontend UI
if (userRole === "merchant") {
  isSelectDisabled = true;
  hideAllActionButtons = true;
  tooltip = "التاجر لديه صلاحية قراءة فقط";
}
```

### Rule 4: Cancelled Cannot Be Undone (Except Admin)

```typescript
// Backend validation
if (currentState === "Cancelled" && userRole !== "admin") {
  return {
    success: false,
    error: "CANCELLED_LOCKED",
    message: "Only Admin can undo cancelled orders",
  };
}

// Frontend UI
if (currentState === "Cancelled" && userRole !== "admin") {
  isSelectDisabled = true;
  tooltip = "لا يمكن التراجع عن الإلغاء - اتصل بالمدير";
}
```

### Rule 5: Only Admin/Employee Can Start Processing

```typescript
// Backend validation
if (
  currentState === "Pending" &&
  newState === "Processing" &&
  !["admin", "employee"].includes(userRole)
) {
  return {
    success: false,
    error: "PROCESSING_RESTRICTED",
    message: "Only Admin/Employee can move to Processing",
  };
}

// Frontend UI
if (currentState === "Pending" && !["admin", "employee"].includes(userRole)) {
  disableOption("Processing", "فقط المدير أو الموظف يمكنه بدء المعالجة");
}
```

### Rule 6: Only Admin/Employee Can Assign Delivery Agent

```typescript
// Backend validation
if (req.body.assignedDriver && !["admin", "employee"].includes(userRole)) {
  return {
    success: false,
    error: "ASSIGNMENT_RESTRICTED",
    message: "Only Admin/Employee can assign delivery agent",
  };
}

// Frontend UI
if (!["admin", "employee"].includes(userRole)) {
  hideDriverAssignmentButton = true;
  // or
  isDriverSelectDisabled = true;
  tooltip = "فقط المدير أو الموظف يمكنه تعيين المندوب";
}
```

---

## 5. IMPLEMENTATION CHECKLIST

### Backend:

- ✅ Updated Order model with correct status enum
- ✅ State transition rules in orderController.js
- ✅ Validation function with all critical rules
- ✅ Clear error messages for each forbidden action
- ✅ State history tracking for audit
- ✅ Driver assignment validation

### Frontend:

- ✅ orderStateManager.ts with comprehensive rules
- ✅ isStatusSelectDisabled() function
- ✅ getStatusDropdownOptions() with disabled reasons
- ✅ getDisabledSelectTooltip() for hover messages
- ✅ Role-specific error messages
- ✅ UI components respect all rules

### Testing:

- ✅ Test all role transitions
- ✅ Test critical rules (Delivered lock, Merchant read-only)
- ✅ Test tooltip display
- ✅ Test error messages
- ✅ Test driver assignment permissions
- ✅ Test audit trail logging

---

## 6. QUICK REFERENCE TABLE

| Role         | Can Start Processing | Can Cancel          | Can Ship | Can Deliver | Can Undo Delivered | Can Undo Cancelled | Read-Only |
| ------------ | -------------------- | ------------------- | -------- | ----------- | ------------------ | ------------------ | --------- |
| **Admin**    | ✅                   | ✅                  | ✅       | ✅          | ✅                 | ✅                 | ❌        |
| **Employee** | ✅                   | ✅ (before shipped) | ❌       | ❌          | ❌                 | ❌                 | ❌        |
| **Merchant** | ❌                   | ❌                  | ❌       | ❌          | ❌                 | ❌                 | ✅        |
| **Courier**  | ❌                   | ❌                  | ✅       | ✅          | ❌                 | ❌                 | ❌        |

---

**Implementation Status:** ✅ COMPLETE
**Last Updated:** December 1, 2025
**Version:** 2.0.0

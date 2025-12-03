import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Order, OrderState, UserRole } from '../../types';
import { 
  canChangeOrderState, 
  getAllowedNextStates, 
  STATE_LABELS, 
  getStateBadgeColor,
  formatStateChange 
} from '../../lib/orderStateManager';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface OrderStateManagerProps {
  order: Order;
  userRole: UserRole;
  onStateChange: (orderId: string, newState: OrderState, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export const OrderStateManager: React.FC<OrderStateManagerProps> = ({
  order,
  userRole,
  onStateChange,
  isLoading = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<OrderState | ''>('');
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState('');

  const currentState = order.status as OrderState;
  const allowedStates = getAllowedNextStates(userRole, currentState);

  const handleStateChange = async () => {
    if (!selectedState) {
      setError('Please select a new state.');
      return;
    }

    if (!canChangeOrderState(userRole, currentState, selectedState)) {
      setError('You do not have permission to make this state transition.');
      return;
    }

    try {
      await onStateChange(order._id, selectedState, changeReason);
      setIsDialogOpen(false);
      setSelectedState('');
      setChangeReason('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update order state.');
    }
  };

  const openDialog = () => {
    setIsDialogOpen(true);
    setError('');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedState('');
    setChangeReason('');
    setError('');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current State Badge */}
      <Badge className={getStateBadgeColor(currentState)}>
        {STATE_LABELS[currentState]?.ar || currentState}
      </Badge>

      {/* Change State Button */}
      {allowedStates.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={openDialog}
          disabled={isLoading}
        >
          تغيير الحالة
        </Button>
      )}

      {/* State Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تغيير حالة الطلب</DialogTitle>
            <DialogDescription>
              الطلب رقم: {order._id.slice(-8)}
              <br />
              الحالة الحالية: {STATE_LABELS[currentState]?.ar}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newState" className="text-right">
                الحالة الجديدة
              </Label>
              <Select 
                value={selectedState} 
                onValueChange={(value: OrderState) => setSelectedState(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الحالة الجديدة" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStateBadgeColor(state)} text-xs`}>
                          {STATE_LABELS[state]?.ar}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {STATE_LABELS[state]?.en}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedState && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">المعاينة</Label>
                <div className="col-span-3">
                  <div className="text-sm text-muted-foreground">
                    {formatStateChange(currentState, selectedState)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reason" className="text-right pt-2">
                سبب التغيير
              </Label>
              <Textarea
                id="reason"
                placeholder="اكتب سبب تغيير الحالة (اختياري)"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="col-span-3 resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>
              إلغاء
            </Button>
            <Button 
              onClick={handleStateChange}
              disabled={!selectedState || isLoading}
            >
              {isLoading ? 'جاري التحديث...' : 'تأكيد التغيير'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order State History */}
      {order.stateHistory && order.stateHistory.length > 0 && (
        <div className="ml-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // You can implement a separate dialog to show state history
              console.log('Order state history:', order.stateHistory);
            }}
            className="text-xs"
          >
            تاريخ التغييرات ({order.stateHistory.length})
          </Button>
        </div>
      )}
    </div>
  );
};

// State History Display Component
interface StateHistoryProps {
  stateHistory: Order['stateHistory'];
  isOpen: boolean;
  onClose: () => void;
}

export const StateHistoryDialog: React.FC<StateHistoryProps> = ({
  stateHistory = [],
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تاريخ تغيير حالات الطلب</DialogTitle>
          <DialogDescription>
            جميع التغييرات التي تمت على حالة هذا الطلب
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {stateHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              لا توجد تغييرات مسجلة على هذا الطلب
            </div>
          ) : (
            <div className="space-y-3">
              {stateHistory.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {formatStateChange(
                        entry.previousState as OrderState,
                        entry.newState as OrderState
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString('ar-EG')}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    بواسطة: {entry.changedBy.fullName} ({entry.changedBy.userType})
                  </div>
                  
                  {entry.changeReason && (
                    <div className="text-sm bg-muted p-2 rounded">
                      <strong>السبب:</strong> {entry.changeReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
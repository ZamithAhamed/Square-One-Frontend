import React from 'react';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Payment } from '../types';

interface PaymentCardProps {
  payment: Payment;
}


const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return CreditCard;
      case 'cash': return DollarSign;
      case 'insurance': return CreditCard;
      case 'bank-transfer': return CreditCard;
      default: return DollarSign;
    }
  };

  const MethodIcon = getMethodIcon(payment.method);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MethodIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{payment.patientName}</h3>
            <p className="text-sm text-gray-500">{payment.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 mb-1">Amount</p>
          <p className="font-semibold text-gray-900">
            {payment.currency} {payment.amount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Method</p>
          <p className="font-medium text-gray-700 capitalize">
            {payment.method.replace('-', ' ')}
          </p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Date</p>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700">{payment.date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
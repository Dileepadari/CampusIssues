
import { Card } from "@/components/ui/card";
import { ComplaintStats } from "@/lib/types";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";

interface DashboardStatsProps {
  stats: ComplaintStats;
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-white">
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-blue-100">
            <ClipboardList className="h-6 w-6 text-brand-blue" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-white">
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-amber-100">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white">
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-blue-100">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white">
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-2xl font-bold">{stats.resolved}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;

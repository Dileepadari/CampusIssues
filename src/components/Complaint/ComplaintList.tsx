
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplaintCategory, Complaint, ComplaintStatus } from '@/lib/types';
import ComplaintCard from './ComplaintCard';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ComplaintListProps {
  complaints: Complaint[];
  isAdmin?: boolean;
}

const ComplaintList = ({ complaints, isAdmin = false }: ComplaintListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.trackingId.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === '' || complaint.category === categoryFilter;

    // Status filter
    const matchesStatus = statusFilter === '' || complaint.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get all categories from complaints
  const categories = Array.from(new Set(complaints.map(c => c.category)));
  
  // Get all statuses from complaints
  const statuses = Array.from(new Set(complaints.map(c => c.status)));

  return (
    <div>
      <div className="mb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description or tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="w-full sm:w-auto">
            <Label htmlFor="category-filter" className="text-xs mb-1 block">Category</Label>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as ComplaintCategory | '')}
            >
              <SelectTrigger id="category-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Label htmlFor="status-filter" className="text-xs mb-1 block">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ComplaintStatus | '')}
            >
              <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredComplaints.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </p>
          {filteredComplaints.map((complaint) => (
            <ComplaintCard 
              key={complaint.id} 
              complaint={complaint} 
              isAdmin={isAdmin} 
            />
          ))}
        </>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-lg font-medium">No complaints found</p>
          <p className="text-muted-foreground mt-1">
            {searchQuery || categoryFilter || statusFilter 
              ? 'Try adjusting your filters or search query'
              : 'No complaints have been submitted yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;

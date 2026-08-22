import { useMemo, useState } from 'react';
import { Search, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSetUserActive, useSetUserRole, useUsers } from '@/hooks/useComplaints';
import { dateOnly } from '@/lib/format';
import { ROLES, ROLE_LABEL, type PublicUser, type Role } from '@/lib/types';

const ROLE_ICON: Record<Role, typeof UserRound> = {
  student: UserRound,
  staff: Wrench,
  admin: ShieldCheck,
};

export default function People() {
  const { user: currentUser } = useAuth();
  const { data: users, isPending } = useUsers();
  const setRole = useSetUserRole();
  const setActive = useSetUserActive();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [pendingDeactivate, setPendingDeactivate] = useState<PublicUser | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (users ?? []).filter((person) => {
      if (roleFilter !== 'all' && person.role !== roleFilter) return false;
      if (!needle) return true;
      return [person.name, person.email, person.identifier ?? '', person.department ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Grant staff access, and deactivate accounts that should no longer sign in."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, roll number or department"
            className="pl-9"
            aria-label="Search people"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | 'all')}>
          <SelectTrigger className="w-44" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABEL[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nobody matches that search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((person) => {
                  const Icon = ROLE_ICON[person.role];
                  const isSelf = person.id === currentUser?.id;
                  return (
                    <TableRow key={person.id} className={person.isActive ? undefined : 'opacity-60'}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={person} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {person.name}
                              {isSelf && (
                                <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {person.email}
                              {person.identifier ? ` - ${person.identifier}` : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {person.department ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dateOnly(person.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                          <Select
                            value={person.role}
                            disabled={isSelf || setRole.isPending}
                            onValueChange={(value) =>
                              setRole.mutate({ userId: person.id, role: value as Role })
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="w-32"
                              aria-label={`Role for ${person.name}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABEL[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {person.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setPendingDeactivate(person)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Badge variant="muted">Deactivated</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setActive.mutate({ userId: person.id, isActive: true })
                              }
                            >
                              Reactivate
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingDeactivate !== null}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title={`Deactivate ${pendingDeactivate?.name}?`}
        description="They will not be able to sign in, and any complaints assigned to them are released back to the unassigned queue. Their complaints and replies stay in the record."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          if (pendingDeactivate) {
            setActive.mutate({ userId: pendingDeactivate.id, isActive: false });
          }
          setPendingDeactivate(null);
        }}
      />
    </div>
  );
}

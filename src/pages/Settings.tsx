import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Download, Loader2, LogOut, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext';
import { errorMessage } from '@/hooks/useComplaints';
import * as api from '@/lib/api';
import { downloadFile } from '@/lib/format';
import {
  ROLE_LABEL,
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeInput,
  type ProfileInput,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function ProfileSection() {
  const { user, refresh } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      department: user?.department ?? '',
      identifier: user?.identifier ?? '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>
          Signed in as {user?.email} - {ROLE_LABEL[user?.role ?? 'student']}. Roles are changed by an
          administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit(async (input) => {
            try {
              await api.updateProfile(input);
              await refresh();
              toast.success('Profile updated');
            } catch (error) {
              toast.error(errorMessage(error));
            }
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Roll or employee number</Label>
              <Input id="identifier" {...register('identifier')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password</CardTitle>
        <CardDescription>At least 8 characters, with a letter and a number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit(async (input) => {
            try {
              await api.changePassword(input);
              reset();
              toast.success('Password changed');
            } catch (error) {
              toast.error(errorMessage(error));
            }
          })}
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p role="alert" className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your account, how the app looks, and your data." />

      <ProfileSection />
      <PasswordSection />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>System follows whatever your device is set to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                variant={theme === value ? 'default' : 'outline'}
                className={cn('gap-2')}
                onClick={() => setTheme(value)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
          <CardDescription>
            {user?.role === 'student'
              ? 'Download every complaint you have filed, with its replies and history.'
              : 'Download the full complaint record, including internal notes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              try {
                const json = await api.exportData();
                downloadFile(
                  `campusissues-export-${new Date().toISOString().slice(0, 10)}.json`,
                  json,
                  'application/json',
                );
                toast.success('Export downloaded');
              } catch (error) {
                toast.error(errorMessage(error));
              } finally {
                setIsExporting(false);
              }
            }}
          >
            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export as JSON
          </Button>

          <Button
            variant="ghost"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Reset demo data</CardTitle>
            <CardDescription>
              Wipes every account and complaint stored in this browser and restores the seeded demo
              dataset. You will be signed out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-4" />
              Reset everything
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />
      <p className="pb-4 text-xs text-muted-foreground">
        CampusIssues stores its data in this browser. See DEVDOC.md for how to point it at a real
        backend.
      </p>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all data?"
        description="Every account, complaint, reply and notification in this browser is deleted and replaced with the demo dataset. This cannot be undone."
        confirmLabel="Reset everything"
        destructive
        onConfirm={async () => {
          try {
            await api.resetDemoData();
            toast.success('Demo data restored');
            window.location.assign('/');
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </div>
  );
}

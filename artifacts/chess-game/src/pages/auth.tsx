import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (mode === 'login') {
      loginMutation.mutate({ data: values }, {
        onSuccess: (res) => {
          login(res.token);
          setLocation('/home');
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      });
    } else {
      registerMutation.mutate({ data: values }, {
        onSuccess: (res) => {
          login(res.token);
          setLocation('/home');
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-xl border border-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl text-primary-foreground font-serif leading-none">♞</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            {mode === 'login' ? 'Enter your details to access your account' : 'Join the most prestigious chess club'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="grandmaster@example.com" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-lg h-12" disabled={isPending}>
              {isPending ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm font-sans text-muted-foreground">
          {mode === 'login' ? (
            <>Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link></>
          )}
        </div>
      </div>
    </div>
  );
}

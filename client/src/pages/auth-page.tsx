import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Users, Book, Bot, CheckCircle2, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "agent", "user"], {
    required_error: "Please select a role",
  }),
  companyName: z.string().min(1, "Company Name is required"),
  department: z.string().min(1, "Department is required"),
  contactNumber: z.string().min(1, "Contact Number is required"),
  designation: z.string().min(1, "Designation is required"),
  location: z.string().min(1, "Location is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const resetToken = params.get("reset");

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !resetToken) {
      navigate("/");
    }
  }, [user, navigate, resetToken]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user" as any,
      companyName: "",
      department: "",
      contactNumber: "",
      designation: "",
      location: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await apiRequest("POST", "/api/forgot-password", { email: forgotEmail });
      const data = await res.json();
      setForgotSent(true);
      toast({ title: "Check your email", description: data.message });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reset email", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Both passwords must be identical.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/reset-password", { token: resetToken, newPassword });
      const data = await res.json();
      toast({ title: "Password reset!", description: data.message });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message || "Invalid or expired token", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Password reset form (when user clicks email link)
  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-slate-200/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-11 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-11 bg-slate-50"
              />
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 shadow-lg"
              onClick={handleResetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
              ) : (
                "Reset Password"
              )}
            </Button>
            <Button variant="link" className="w-full text-sm" onClick={() => navigate("/auth")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Left Side - Auth Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-100 -z-10" />

        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl opacity-70"></div>
                <img
                  src="/logo1.png"
                  alt="Cybaem Tech Logo"
                  className="h-24 w-auto relative z-10 drop-shadow-sm"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 text-lg">Sign in to access your IT portal</p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/50">
            <CardHeader className="pb-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2 p-1 bg-slate-100/80">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-4 focus-visible:outline-none">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                {...field}
                                className="h-11 bg-slate-50 border-slate-200 focus:border-primary/50 focus:ring-primary/20 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                              <Button
                                variant="link"
                                className="p-0 h-auto text-xs text-primary font-medium"
                                type="button"
                                onClick={() => { setShowForgotPassword(true); setForgotSent(false); setForgotEmail(""); }}
                              >
                                Forgot password?
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                                className="h-11 bg-slate-50 border-slate-200 focus:border-primary/50 focus:ring-primary/20 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="mt-4 focus-visible:outline-none">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Username <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="jdoe" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Full Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Email <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@company.com" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Role <span className="text-red-500">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 bg-slate-50">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">Client (User)</SelectItem>
                                  <SelectItem value="agent">Agent (Engineer)</SelectItem>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Password <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4 pb-2">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500 font-bold tracking-wider">Company Details</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Company Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corp" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Department <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="IT, HR, Sales" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="contactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Contact Number <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="designation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-700">Designation <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Software Engineer" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-xs font-medium text-slate-700">Location (City) <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="New York, London, Tokyo" {...field} className="h-9 bg-slate-50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full mt-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          <div className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Cybaem Tech. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Intro & Features */}
      <div className="hidden md:flex flex-1 relative overflow-hidden bg-slate-900 text-white p-12 items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#0b66c2] opacity-90 z-0"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="max-w-lg relative z-10">
          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
              Enterprise IT Service <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Management Reimagined</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Streamline your support workflow with our intelligent, secure, and efficient ticketing solution.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start group">
              <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-sm group-hover:bg-primary/20 transition-colors duration-300">
                <Shield className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Secure & Reliable</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Enterprise-grade security with role-based access control and data protection.</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-sm group-hover:bg-primary/20 transition-colors duration-300">
                <Users className="h-6 w-6 text-teal-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Team Collaboration</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Seamlessly connect agents, admins, and users for faster resolution times.</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-sm group-hover:bg-primary/20 transition-colors duration-300">
                <Book className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Knowledge Base</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Empower users with self-service resources and comprehensive documentation.</p>
              </div>
            </div>

            <div className="flex items-start group">
              <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-sm group-hover:bg-primary/20 transition-colors duration-300">
                <Bot className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">AI Assistant</h3>
                <p className="text-slate-400 text-sm leading-relaxed">24/7 intelligent support to handle common queries instantly.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                  {i}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-white font-medium">1000+</span> tickets resolved this week
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowForgotPassword(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold">Forgot Password</h2>
              <p className="text-blue-100 text-sm mt-1">We'll send a reset link to your email</p>
            </div>
            <div className="p-6 space-y-4">
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Email Sent!</h3>
                  <p className="text-slate-600 text-sm">
                    If an account exists with <strong>{forgotEmail}</strong>, you'll receive a password reset link shortly. Check your inbox.
                  </p>
                  <Button className="mt-6 w-full" onClick={() => setShowForgotPassword(false)}>
                    Back to Login
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="h-11 bg-slate-50"
                      onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                    />
                  </div>
                  <Button
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full text-sm text-slate-500" onClick={() => setShowForgotPassword(false)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

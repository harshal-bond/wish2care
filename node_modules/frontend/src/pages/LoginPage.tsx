import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchApi } from '../lib/api';
import { useNavigate } from "react-router-dom";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { ShieldAlert, KeyRound, Mail, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success) {
      login(res.data.token, res.data.worker);
      navigate("/dashboard", { replace: true });
}
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/40 px-4 font-sans text-gray-900">
      <Card className="w-full max-w-[420px] border border-gray-100 bg-white shadow-xl rounded-2xl overflow-hidden p-4 sm:p-6">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gray-950 flex items-center justify-center text-white font-bold text-lg mb-4">
            W
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Sign in to Wish2Care</CardTitle>
          <p className="text-sm text-gray-500 mt-2">SAFE Wellness Score screening tool</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <Input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="worker@wish2care.org"
                  className="pl-10 h-11 border-gray-200 bg-white rounded-xl text-sm focus:ring-gray-950 focus:border-gray-950 transition-all duration-150"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <Input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="pl-10 h-11 border-gray-200 bg-white rounded-xl text-sm focus:ring-gray-950 focus:border-gray-950 transition-all duration-150"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-gray-950 text-white font-bold hover:bg-gray-800 transition-colors shadow-sm mt-2 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-50 text-center text-xs text-gray-400">
            Secure admin & fieldworker authentication system.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

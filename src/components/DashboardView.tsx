import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Activity, 
  Layers, 
  Shield, 
  Bot, 
  Cpu, 
  FlaskConical, 
  Zap, 
  ChevronRight,
  Database,
  BarChart3,
  UserPlus,
  CheckCircle,
  XCircle,
  Users,
  Wallet,
  Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

const calculateCredits = (model: string, inputTokens: number, outputTokens: number) => {
  const isLarge = model.toLowerCase().includes('large');
  const inputCost = isLarge ? 5 : 1;
  const outputCost = isLarge ? 10 : 2;
  return (inputTokens * inputCost + outputTokens * outputCost) / 1000000;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { profile, user, isConfigured } = useAuth();
  
  // Standard/Developer State
  const [modelStats, setModelStats] = useState<Record<string, { input: number, output: number, credits: number }>>({});
  const [totalCredits, setTotalCredits] = useState(0);
  const [myEnterpriseName, setMyEnterpriseName] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(10);

  // Invitation State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteCreditLimit, setInviteCreditLimit] = useState<number>(10);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Enterprise Member State
  const [enterpriseMembers, setEnterpriseMembers] = useState<any[]>([]);
  const [membersUsage, setMembersUsage] = useState<Record<string, { input: number, output: number, credits: number, username: string }>>({});

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!isConfigured || !profile || !user) return;
    if (profile.accountType === 'enterprise') {
      const { data } = await supabase.from('enterprise_invitations').select('*').eq('enterprise_id', user.id).order('created_at', { ascending: false });
      if (data) setInvitations(data);
    } else if (profile.username) {
      const { data } = await supabase.from('enterprise_invitations').select('*').eq('username', profile.username).order('created_at', { ascending: false });
      if (data) setInvitations(data);
    }
  };

  const fetchApiKeys = async () => {
    if (!user) return;
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setApiKeys(data);
  };

  useEffect(() => {
    if (isConfigured && user && profile) {
      fetchInvitations();
      fetchApiKeys();

      // Fetch personal wallet balance
      const fetchWallet = async () => {
        const { data } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).single();
        if (data) setWalletBalance(data.credit_balance);
      };
      fetchWallet();

      if (profile.accountType !== 'enterprise') {
        const fetchStandardData = async () => {
          if (profile.enterpriseId) {
            const { data } = await supabase.from('profiles').select('enterprise_name').eq('id', profile.enterpriseId).single();
            if (data?.enterprise_name) setMyEnterpriseName(data.enterprise_name);
          }

          const { data, error } = await supabase
            .from('token_usage')
            .select('model_name, input_tokens, output_tokens')
            .eq('user_id', user.id);

          if (!error && data) {
            const stats: Record<string, { input: number, output: number, credits: number }> = {};
            let tCredits = 0;
            data.forEach(row => {
              const m = row.model_name;
              if (!stats[m]) stats[m] = { input: 0, output: 0, credits: 0 };
              stats[m].input += row.input_tokens;
              stats[m].output += row.output_tokens;
              
              const credits = calculateCredits(m, row.input_tokens, row.output_tokens);
              stats[m].credits += credits;
              tCredits += credits;
            });
            setModelStats(stats);
            setTotalCredits(tCredits);
          }
        };
        fetchStandardData();
      } else {
        // Fetch Enterprise Data (Members & Analytics)
        const fetchEnterpriseData = async () => {
          const { data: members } = await supabase
            .from('profiles')
            .select('*')
            .eq('enterprise_id', user.id);
          
          if (members) setEnterpriseMembers(members);

          // Fetch usage where enterprise_id matches, so we don't lose data when members are removed
          const { data: usageData } = await supabase
            .from('token_usage')
            .select('user_id, model_name, input_tokens, output_tokens, profiles!user_id(username)')
            .eq('enterprise_id', user.id);
            
          if (usageData) {
            const usageMap: Record<string, { input: number, output: number, credits: number, username: string }> = {};
            usageData.forEach(row => {
              if (!usageMap[row.user_id]) usageMap[row.user_id] = { input: 0, output: 0, credits: 0, username: (row.profiles as any)?.username || 'Removed User' };
              usageMap[row.user_id].input += row.input_tokens;
              usageMap[row.user_id].output += row.output_tokens;
              usageMap[row.user_id].credits += calculateCredits(row.model_name, row.input_tokens, row.output_tokens);
            });
            setMembersUsage(usageMap);
          }
        };
        fetchEnterpriseData();
      }
    }
  }, [user, profile, isConfigured]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviteLoading(true);
    setInviteMsg('');
    const { error } = await supabase.from('enterprise_invitations').insert({
      enterprise_id: user?.id,
      username: inviteUsername,
      credit_limit: inviteCreditLimit
    });
    setInviteLoading(false);
    if (error) {
      setInviteMsg(error.message);
    } else {
      setInviteMsg('Invitation sent successfully!');
      setInviteUsername('');
      fetchInvitations();
    }
  };

  const handleAcceptInvite = async (invitationId: string) => {
    const { error } = await supabase.rpc('accept_invitation', { invitation_id: invitationId });
    if (!error) {
      window.location.reload();
    }
  };

  const handleRejectInvite = async (invitationId: string) => {
    await supabase.rpc('reject_invitation', { invitation_id: invitationId });
    fetchInvitations();
  };

  const handleUpdateLimit = async (memberId: string, currentLimit: number) => {
    const newLimit = prompt('Enter new monthly credit limit (€):', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      await supabase.from('profiles').update({ credit_limit: Number(newLimit) }).eq('id', memberId);
      window.location.reload();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member? Their credit limit will be reset.')) {
      const { error } = await supabase.rpc('remove_enterprise_member', { member_id: memberId });
      if (!error) {
        window.location.reload();
      } else {
        alert('Failed to remove member: ' + error.message);
      }
    }
  };

  const handleTopUp = async () => {
    const amount = prompt('MOCK PAYMENT: How many € would you like to add to your wallet?', '100');
    if (amount && !isNaN(Number(amount))) {
      const { error } = await supabase.rpc('top_up_wallet', { amount: Number(amount) });
      if (!error) {
        alert(`Successfully topped up €${amount}!`);
        window.location.reload();
      } else {
        alert('Top up failed: ' + error.message);
      }
    }
  };

  const handleCreateApiKey = async () => {
    const newKeyString = 'sk-proj-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { error } = await supabase.from('api_keys').insert({
      user_id: user?.id,
      key_value: newKeyString
    });
    if (!error) {
      setNewKey(newKeyString);
      fetchApiKeys();
    } else {
      alert('Failed to create API key');
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Any applications using it will immediately lose access.')) {
      await supabase.from('api_keys').delete().eq('id', id);
      fetchApiKeys();
    }
  };

  const renderEnterpriseDashboard = () => {
    const totalEnterpriseCredits = Object.values(membersUsage).reduce((a, b) => a + b.credits, 0);
    
    // Convert membersUsage map to an array for recharts
    const chartData = Object.entries(membersUsage).map(([userId, usage]) => {
      return {
        name: usage.username,
        Credits: Number((usage.credits || 0).toFixed(4)),
      };
    });

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Total Members</p>
              <p className="text-3xl font-mono text-[#F5F5F5]">{enterpriseMembers.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#333333]" />
          </div>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Available Wallet Balance</p>
              <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
              <button onClick={handleTopUp} className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] hover:underline">Top Up Wallet</button>
            </div>
            <Wallet className="w-8 h-8 text-emerald-400/20" />
          </div>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Total Credits Used</p>
              <p className="text-3xl font-mono text-[#FFD54F]">€{totalEnterpriseCredits.toFixed(4)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-[#FFD54F]/20" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Credit Usage by Member
        </h2>
        {chartData.length > 0 ? (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg mb-10 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  cursor={{ fill: '#252525' }}
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #333333', borderRadius: '8px', color: '#F5F5F5' }}
                  itemStyle={{ color: '#FFD54F', fontWeight: 'bold' }}
                  formatter={(value: any) => [`€${Number(value).toFixed(4)}`, 'Credits Used']}
                />
                <Bar dataKey="Credits" fill="#FFD54F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-10 shadow-lg mb-10 text-center">
            <p className="text-[#666666] text-sm">No token usage recorded yet.</p>
          </div>
        )}

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
          Member Management
        </h2>
        <div className="bg-[#121212] border border-[#333333] rounded-xl overflow-hidden mb-10 shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#333333]">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Username</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Input Tokens</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Output Tokens</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Credits vs Limit</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enterpriseMembers.map(member => {
                const usage = membersUsage[member.id] || { input: 0, output: 0, credits: 0 };
                const limit = member.credit_limit || 10;
                const pct = Math.min((usage.credits / limit) * 100, 100);
                return (
                  <tr key={member.id} className="border-b border-[#333333]/50 hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-[#F5F5F5]">{member.username}</td>
                    <td className="p-4 text-xs text-[#BDBDBD] font-mono">{usage.input.toLocaleString()}</td>
                    <td className="p-4 text-xs text-[#BDBDBD] font-mono">{usage.output.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex justify-between text-[10px] mb-1.5 uppercase font-bold tracking-wide">
                        <span className="text-[#BDBDBD]">€{usage.credits.toFixed(4)} USED</span>
                        <span className="text-[#666666]">€{limit.toFixed(2)} LIMIT</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                        <div className={`h-full ${pct > 90 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button onClick={() => handleUpdateLimit(member.id, limit)} className="px-3 py-1.5 bg-[#252525] hover:bg-[#333333] text-[#FFD54F] border border-[#FFD54F]/30 rounded text-xs font-bold uppercase transition-colors">Edit Limit</button>
                      <button onClick={() => handleRemoveMember(member.id)} className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase transition-colors">Remove</button>
                    </td>
                  </tr>
                );
              })}
              {enterpriseMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#666666] italic text-sm">No active members in this enterprise.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
          Pending & Sent Invitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#121212] border border-[#333333] rounded-xl p-5 shadow-lg">
            <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#FFD54F]" /> Invite New Member</h3>
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#666666] mb-1">Username to Invite</label>
                <input type="text" required value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD54F] outline-none transition-colors" placeholder="e.g. alice_dev" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#666666] mb-1">Monthly Credit Limit (€)</label>
                <input type="number" required value={inviteCreditLimit} onChange={(e) => setInviteCreditLimit(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD54F] outline-none transition-colors" min="1" step="1" />
              </div>
              <button type="submit" disabled={inviteLoading} className="w-full bg-[#FFD54F] text-black font-bold text-xs uppercase tracking-wider py-2 rounded-lg hover:bg-[#FFCA28] transition-colors disabled:opacity-50">
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </button>
              {inviteMsg && <p className="text-xs text-emerald-400 mt-2">{inviteMsg}</p>}
            </form>
          </div>
          <div className="bg-[#121212] border border-[#333333] rounded-xl p-5 overflow-y-auto max-h-[300px] shadow-lg">
            <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#FFD54F]" /> Sent Invitations</h3>
            {invitations.length === 0 ? (
              <p className="text-xs text-[#666666] italic">No invitations sent yet.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map(inv => (
                  <div key={inv.id} className="p-3 bg-[#1A1A1A] border border-[#333333] rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-[#F5F5F5]">{inv.username}</p>
                      <p className="text-[10px] text-[#666666]">Limit: €{inv.credit_limit?.toFixed(2)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${inv.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400' : inv.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderInvitationsList = () => {
    const pending = invitations.filter(i => i.status === 'pending');
    if (pending.length === 0) return null;
    return (
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-[#F5F5F5] font-bold text-sm mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#FFD54F]" /> Pending Enterprise Invitations</h3>
        <div className="space-y-3">
          {pending.map(inv => (
            <div key={inv.id} className="p-4 bg-[#121212] border border-[#333333] rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-[#F5F5F5]">An Enterprise is inviting you to join</p>
                <p className="text-xs text-[#BDBDBD] mt-1">They will sponsor you with a limit of <strong className="text-[#FFD54F]">€{inv.credit_limit?.toFixed(2)}</strong> per month.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAcceptInvite(inv.id)} className="p-2 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition-colors" title="Accept"><CheckCircle className="w-5 h-5" /></button>
                <button onClick={() => handleRejectInvite(inv.id)} className="p-2 bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors" title="Reject"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnterpriseLink = () => {
    if (!profile?.enterpriseId) return null;
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-6 shadow-lg mb-8 flex items-center gap-4">
        <div className="p-3 bg-emerald-900/40 rounded-lg"><Shield className="w-6 h-6 text-emerald-400" /></div>
        <div>
          <h3 className="text-emerald-400 font-bold text-sm">Sponsored by Enterprise</h3>
          <p className="text-xs text-emerald-200/70 mt-1">
            {myEnterpriseName ? `You are a member of ${myEnterpriseName}. ` : 'Your token usage is currently being sponsored. '}
            Monthly Limit: <strong className="text-white">€{profile.creditLimit?.toFixed(2)} Credits</strong>.
          </p>
        </div>
      </div>
    );
  };

  const renderResearcherDashboard = () => (
    <>
      {renderInvitationsList()}
      {renderEnterpriseLink()}
      
      {!profile?.enterpriseId && (
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between mb-8">
          <div>
            <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Available Wallet Balance</p>
            <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
            <button onClick={handleTopUp} className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] hover:underline">Top Up Wallet</button>
          </div>
          <Wallet className="w-8 h-8 text-emerald-400/20" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F5F5F5] font-bold text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-[#FFD54F]" /> Developer API Keys
            </h3>
            <button onClick={handleCreateApiKey} className="text-xs px-3 py-1.5 bg-[#FFD54F] text-black font-bold uppercase tracking-wider rounded">Create Key</button>
          </div>
          
          {newKey && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-lg mb-4">
              <p className="text-emerald-400 text-xs font-bold mb-2">Please copy this key now. You will not be able to see it again!</p>
              <code className="text-sm text-white font-mono break-all">{newKey}</code>
            </div>
          )}

          <div className="space-y-3">
            {apiKeys.map(k => (
              <div key={k.id} className="p-3 bg-[#121212] rounded border border-[#333333] flex justify-between items-center">
                <div>
                  <p className="text-[#F5F5F5] text-sm font-mono">{k.key_value.substring(0, 12)}...{k.key_value.substring(k.key_value.length - 4)}</p>
                  <p className="text-[#666666] text-[10px]">Created: {new Date(k.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold uppercase">Active</span>
                  <button onClick={() => handleRevokeApiKey(k.id)} className="text-[#666666] hover:text-red-400 transition-colors" title="Revoke Key"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-xs text-[#666666] italic">No active API keys.</p>}
          </div>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#F5F5F5] font-bold text-lg flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#FFD54F]" /> Sandbox Environments
          </h3>
          <p className="text-sm text-[#BDBDBD] mb-6">
            Access secure, isolated instances of the 120B omni model to test prompts and logic before production deployment.
          </p>
          <button 
            onClick={() => onNavigate('api-docs')}
            className="w-full py-3 bg-[#121212] border border-[#FFD54F]/30 hover:border-[#FFD54F] rounded-lg text-[#FFD54F] font-bold uppercase tracking-wider text-xs transition-colors"
          >
            Launch API Playground
          </button>
        </div>
      </div>
      
      <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
        API Usage Overview
      </h2>
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 max-w-2xl shadow-lg text-left">
        {renderUsageMetrics()}
      </div>
    </>
  );

  const renderUsageMetrics = () => {
    const limit = profile?.creditLimit || 10;
    const pct = Math.min((totalCredits / limit) * 100, 100);

    return (
      <>
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">Credits Used vs Allocated Limit</span>
          <span className="text-lg font-mono text-[#F5F5F5]">€{totalCredits.toFixed(4)} <span className="text-sm text-[#666666]">/ €{limit.toFixed(2)}</span></span>
        </div>
        <div className="w-full h-2 bg-[#252525] rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
        </div>
        
        <div className="space-y-4 mb-4 border-t border-[#252525] pt-4">
          <p className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-wider mb-2">Usage by Model</p>
          {Object.entries(modelStats).length > 0 ? (
            Object.entries(modelStats).map(([model, stats]) => (
              <div key={model} className="bg-[#121212] border border-[#333333] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#F5F5F5] font-semibold text-sm">{model}</span>
                  <span className="text-[#FFD54F] font-mono font-bold">€{stats.credits.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Input Tokens</span>
                    <span className="text-[#BDBDBD] font-mono">{stats.input.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Output Tokens</span>
                    <span className="text-[#BDBDBD] font-mono">{stats.output.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#666666] italic">No tokens used yet.</p>
          )}
        </div>

        <p className="text-xs text-emerald-400 mt-2 font-semibold">€{(limit - totalCredits).toFixed(4)} allocated credits remaining</p>
      </>
    );
  };

  const renderStandardDashboard = () => (
    <div className="max-w-3xl mx-auto">
      {renderInvitationsList()}
      {renderEnterpriseLink()}
      
      {!profile?.enterpriseId && (
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between mb-8">
          <div>
            <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Available Wallet Balance</p>
            <p className="text-3xl font-mono text-emerald-400">€{walletBalance.toFixed(2)}</p>
            <button onClick={handleTopUp} className="text-[10px] mt-2 font-bold uppercase text-[#FFD54F] hover:underline">Top Up Wallet</button>
          </div>
          <Wallet className="w-8 h-8 text-emerald-400/20" />
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 text-center shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">
          {profile?.enterpriseId ? 'Enterprise Plan' : 'Free Trial Tier'}
        </h2>
        <p className="text-[#BDBDBD] text-sm mb-8 max-w-lg mx-auto">
          {profile?.enterpriseId ? 'Your API requests and chat sessions are sponsored by your organization.' : 'You are currently on the free trial. You have an initial Wallet Balance to explore Anacleto AI.'}
        </p>

        <div className="bg-[#121212] border border-[#333333] rounded-xl p-6 max-w-md mx-auto mb-8 text-left shadow-lg">
          {renderUsageMetrics()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('chat')}
          className="bg-[#121212] border border-[#333333] hover:border-[#FFD54F]/50 rounded-xl p-6 cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFD54F]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-[#FFD54F]" />
          </div>
          <h3 className="text-[#F5F5F5] font-bold mb-2">Open Anacleto Chat</h3>
          <p className="text-[#666666] text-xs">Jump back into your secure conversational interface.</p>
        </div>
        <div className="bg-[#121212] border border-[#333333] rounded-xl p-6 opacity-50">
          <div className="w-12 h-12 rounded-xl bg-[#333333] flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-[#666666]" />
          </div>
          <h3 className="text-[#F5F5F5] font-bold mb-2">Developer API (Pro)</h3>
          <p className="text-[#666666] text-xs">Upgrade to access raw API keys and playground.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="mb-8 border-b border-[#333333] pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F5F5] uppercase tracking-tight">
            {profile?.accountType === 'enterprise' && 'Enterprise Portal'}
            {profile?.accountType === 'developer' && 'Developer Portal'}
            {profile?.accountType === 'standard' && 'User Dashboard'}
          </h1>
          <p className="text-[#BDBDBD] text-sm mt-1">Welcome back, {profile?.username || profile?.enterpriseName || profile?.email}</p>
        </div>
        <div className="px-3 py-1 rounded bg-[#121212] border border-[#333333] text-xs font-bold uppercase tracking-wider text-[#FFD54F]">
          Account: {profile?.accountType}
        </div>
      </div>

      {profile?.accountType === 'enterprise' && renderEnterpriseDashboard()}
      {profile?.accountType === 'developer' && renderResearcherDashboard()}
      {profile?.accountType === 'standard' && renderStandardDashboard()}
    </div>
  );
};

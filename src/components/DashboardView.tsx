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
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface DashboardViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { profile, user, isConfigured } = useAuth();
  const [modelTokens, setModelTokens] = useState<Record<string, number>>({});
  const [totalTokens, setTotalTokens] = useState(0);

  // Invitation State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteTokenLimit, setInviteTokenLimit] = useState<number>(10000);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Enterprise Member State
  const [enterpriseMembers, setEnterpriseMembers] = useState<any[]>([]);
  const [membersUsage, setMembersUsage] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (isConfigured && user && profile) {
      // Fetch Invitations
      fetchInvitations();

      // Fetch Tokens for standard/developer
      if (profile.accountType !== 'enterprise') {
        const fetchTokens = async () => {
          const { data, error } = await supabase
            .from('token_usage')
            .select('model_name, input_tokens, output_tokens')
            .eq('user_id', user.id);

          if (!error && data) {
            const counts: Record<string, number> = {};
            let total = 0;
            data.forEach(row => {
              const sum = row.input_tokens + row.output_tokens;
              counts[row.model_name] = (counts[row.model_name] || 0) + sum;
              total += sum;
            });
            setModelTokens(counts);
            setTotalTokens(total);
          }
        };
        fetchTokens();
      } else {
        // Fetch Enterprise Data (Members & Analytics)
        const fetchEnterpriseData = async () => {
          const { data: members } = await supabase
            .from('profiles')
            .select('*')
            .eq('enterprise_id', user.id);
          
          if (members) {
            setEnterpriseMembers(members);
            const userIds = members.map(m => m.id);
            if (userIds.length > 0) {
              const { data: usageData } = await supabase
                .from('token_usage')
                .select('user_id, input_tokens, output_tokens')
                .in('user_id', userIds);
                
              if (usageData) {
                const usageMap: Record<string, number> = {};
                usageData.forEach(row => {
                  usageMap[row.user_id] = (usageMap[row.user_id] || 0) + row.input_tokens + row.output_tokens;
                });
                setMembersUsage(usageMap);
              }
            }
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
      token_limit: inviteTokenLimit
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
    const newLimit = prompt('Enter new monthly token limit:', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      await supabase.from('profiles').update({ token_limit: Number(newLimit) }).eq('id', memberId);
      window.location.reload();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member? Their token limit will be reset to default.')) {
      const { error } = await supabase.rpc('remove_enterprise_member', { member_id: memberId });
      if (!error) {
        window.location.reload();
      } else {
        alert('Failed to remove member: ' + error.message);
      }
    }
  };

  const renderEnterpriseDashboard = () => {
    const totalEnterpriseTokens = Object.values(membersUsage).reduce((a, b) => a + b, 0);
    
    // Prepare data for recharts
    const chartData = enterpriseMembers.map(m => ({
      name: m.username,
      Tokens: membersUsage[m.id] || 0,
      Limit: m.token_limit
    }));

    return (
      <>
        {/* KPI Cards */}
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
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Tokens Used (MTD)</p>
              <p className="text-3xl font-mono text-[#FFD54F]">{totalEnterpriseTokens.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-[#FFD54F]/20" />
          </div>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[#666666] text-xs font-bold uppercase tracking-wider mb-1">Pending Invites</p>
              <p className="text-3xl font-mono text-[#F5F5F5]">{invitations.filter(i => i.status === 'pending').length}</p>
            </div>
            <UserPlus className="w-8 h-8 text-[#333333]" />
          </div>
        </div>

        {/* Analytics Graph */}
        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2">
          Usage Analytics by Member
        </h2>
        {enterpriseMembers.length > 0 ? (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg mb-10 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#252525' }}
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #333333', borderRadius: '8px', color: '#F5F5F5' }}
                  itemStyle={{ color: '#FFD54F', fontWeight: 'bold' }}
                />
                <Bar dataKey="Tokens" fill="#FFD54F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-10 shadow-lg mb-10 text-center">
            <p className="text-[#666666] text-sm">No members yet. Invite a member to see analytics.</p>
          </div>
        )}

        {/* Member Management */}
        <h2 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider mb-4 border-b border-[#333333] pb-2 mt-8">
          Member Management
        </h2>
        <div className="bg-[#121212] border border-[#333333] rounded-xl overflow-hidden mb-10 shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#333333]">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Username</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666]">Usage vs Limit</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#666666] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enterpriseMembers.map(member => {
                const used = membersUsage[member.id] || 0;
                const limit = member.token_limit;
                const pct = Math.min((used / limit) * 100, 100);
                return (
                  <tr key={member.id} className="border-b border-[#333333]/50 hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-[#F5F5F5]">{member.username}</td>
                    <td className="p-4">
                      <div className="flex justify-between text-[10px] mb-1.5 uppercase font-bold tracking-wide">
                        <span className="text-[#BDBDBD]">{used.toLocaleString()} USED</span>
                        <span className="text-[#666666]">{limit.toLocaleString()} LIMIT</span>
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
                  <td colSpan={3} className="p-8 text-center text-[#666666] italic text-sm">No active members in this enterprise.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invitations Management */}
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
                <label className="block text-[10px] uppercase font-bold text-[#666666] mb-1">Monthly Token Limit</label>
                <input type="number" required value={inviteTokenLimit} onChange={(e) => setInviteTokenLimit(Number(e.target.value))} className="w-full bg-[#1A1A1A] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#FFD54F] outline-none transition-colors" min="1000" step="1000" />
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
                      <p className="text-[10px] text-[#666666]">Limit: {inv.token_limit.toLocaleString()} tokens</p>
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
                <p className="text-sm font-bold text-[#F5F5F5]">Enterprise is inviting you to join</p>
                <p className="text-xs text-[#BDBDBD] mt-1">They will provide you with a token limit of <strong className="text-[#FFD54F]">{inv.token_limit.toLocaleString()}</strong> tokens/month.</p>
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
          <h3 className="text-emerald-400 font-bold text-sm">Linked to Enterprise</h3>
          <p className="text-xs text-emerald-200/70 mt-1">Your token usage is currently being sponsored by your enterprise. Monthly Limit: <strong className="text-white">{profile.tokenLimit?.toLocaleString()} tokens</strong>.</p>
        </div>
      </div>
    );
  };

  const renderResearcherDashboard = () => (
    <>
      {renderInvitationsList()}
      {renderEnterpriseLink()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F5F5F5] font-bold text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-[#FFD54F]" /> Developer API Keys
            </h3>
            <button className="text-xs px-3 py-1.5 bg-[#FFD54F] text-black font-bold uppercase tracking-wider rounded">Create Key</button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-[#121212] rounded border border-[#333333] flex justify-between items-center">
              <div>
                <p className="text-[#F5F5F5] text-sm font-mono">sk-proj-a9b8...3f21</p>
                <p className="text-[#666666] text-xs">Created: Aug 12, 2026</p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
            </div>
            <div className="p-3 bg-[#121212] rounded border border-[#333333] flex justify-between items-center">
              <div>
                <p className="text-[#F5F5F5] text-sm font-mono">sk-proj-c4d5...1a9e</p>
                <p className="text-[#666666] text-xs">Created: Jul 01, 2026</p>
              </div>
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">Revoked</span>
            </div>
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
    </>
  );

  const renderStandardDashboard = () => (
    <div className="max-w-3xl mx-auto">
      {renderInvitationsList()}
      {renderEnterpriseLink()}
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 text-center shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Free Trial Tier</h2>
        <p className="text-[#BDBDBD] text-sm mb-8 max-w-lg mx-auto">
          {profile?.enterpriseId ? 'You are utilizing an enterprise-sponsored plan. Rate limits are dictated by your organization.' : 'You are currently on the free trial. You have access to Anacleto Chat with standard rate limits.'}
        </p>

        <div className="bg-[#121212] border border-[#333333] rounded-xl p-6 max-w-md mx-auto mb-8 text-left">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">Chat Tokens Used</span>
            <span className="text-lg font-mono text-[#F5F5F5]">{totalTokens.toLocaleString()} <span className="text-sm text-[#666666]">/ 10,000</span></span>
          </div>
          <div className="w-full h-2 bg-[#252525] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${Math.min((totalTokens / 10000) * 100, 100)}%` }}></div>
          </div>
          
          <div className="space-y-2 mb-4 border-t border-[#252525] pt-4">
            <p className="text-[10px] font-bold text-[#BDBDBD] uppercase tracking-wider mb-2">Usage by Model</p>
            {Object.entries(modelTokens).length > 0 ? (
              Object.entries(modelTokens).map(([model, count]) => (
                <div key={model} className="flex justify-between items-center text-xs">
                  <span className="text-[#666666] font-semibold">{model}</span>
                  <span className="text-[#FFD54F] font-mono">{count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#666666] italic">No tokens used yet.</p>
            )}
          </div>

          <p className="text-xs text-emerald-400 mt-2 font-semibold">{((profile?.tokenLimit || 10000) - totalTokens).toLocaleString()} tokens remaining this month</p>
        </div>

        <button className="px-6 py-3 bg-[#FFD54F] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-[#FFCA28] transition-colors shadow-lg shadow-[#FFD54F]/20">
          Upgrade Plan
        </button>
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
